import fs from 'fs';
import fg from 'fast-glob';
import nodePath from 'path'; // Rename to avoid conflict in global scope if necessary, though 'path' is conventional
import * as babelParser from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default;

import { extractHtmlUsage } from './utils/parse-html-ast.js';
import { extractCssTokens } from './utils/parse-css-tokens.js';
import { extractJsxUsage } from './utils/parse-jsx-ast.js';

// Use the renamed import for global scope path operations
const OUTPUT_PATH = nodePath.resolve('reports/web-usage.json');
const DS_PREFIXES = ['nb'];
const APP_PREFIXES = ['app', 'shared'];

const usageMap = {
  framework: 'unknown'
};

for (const prefix of DS_PREFIXES) {
  usageMap[prefix] = {
    components: {},
    classes: {},
    customProperties: {},
    scssVariables: {},
    outsideComponents: {},
    directives: {},
    propValues: {},
    internalComponents: {}
  };
}

if (fs.existsSync('angular.json')) usageMap.framework = 'angular';
else if (fs.existsSync('vite.config.ts') || fs.existsSync('vite.config.js')) usageMap.framework = 'react-vite';
else if (fs.existsSync('next.config.js')) usageMap.framework = 'nextjs';
else if (fs.existsSync('vue.config.js')) usageMap.framework = 'vue';
else if (fs.existsSync('package.json')) {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    if (pkg.dependencies?.react) usageMap.framework = 'react';
    else if (pkg.dependencies?.vue) usageMap.framework = 'vue';
    else if (pkg.dependencies?.svelte) usageMap.framework = 'svelte';
  } catch {}
}

const allFiles = await fg(['**/*.{ts,tsx,js,jsx,html,vue,css,scss}'], {
  ignore: ['**/node_modules/**', 'dist', 'build', 'reports', 'analyzer']
});

const jsFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.tsx') || f.endsWith('.jsx'));
const htmlFiles = allFiles.filter(f => f.endsWith('.html') || f.endsWith('.vue'));
const cssFiles = allFiles.filter(f => f.endsWith('.css') || f.endsWith('.scss'));

/**
 * Extracts Angular component template usage from a TypeScript file.
 * @param {string} filePath Path to the TypeScript file.
 * @param {string[]} dsPrefixes Array of Design System prefixes (e.g., ['nb']).
 * @param {string[]} appPrefixes Array of Application prefixes (e.g., ['app']).
 * @returns {object|null} Usage data from extractHtmlUsage, or null.
 */
function extractAngularUsageFromTs(filePath, dsPrefixes, appPrefixes) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const ast = babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'decorators-legacy', 'deprecatedImportAssert']
    });

    let htmlContent = null;

    traverse(ast, {
      ClassDeclaration(astPath) { // Renamed 'path' to 'astPath' to avoid conflict
        if (astPath.node.decorators) {
          for (const decorator of astPath.node.decorators) {
            if (
              decorator.expression.type === 'CallExpression' &&
              decorator.expression.callee.type === 'Identifier' &&
              decorator.expression.callee.name === 'Component'
            ) {
              const arg = decorator.expression.arguments[0];
              if (arg && arg.type === 'ObjectExpression') {
                for (const prop of arg.properties) {
                  if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                    if (prop.key.name === 'template') {
                      if (prop.value.type === 'StringLiteral') {
                        htmlContent = prop.value.value;
                      } else if (prop.value.type === 'TemplateLiteral') {
                        // For simplicity, concatenate quasi parts. Could be more complex with expressions.
                        htmlContent = prop.value.quasis.map(q => q.value.cooked).join('');
                      }
                      break; // Found template
                    } else if (prop.key.name === 'templateUrl') {
                      if (prop.value.type === 'StringLiteral') {
                        const templateUrl = prop.value.value;
                        // Use the imported 'nodePath' module here
                        const templatePathResolved = nodePath.resolve(nodePath.dirname(filePath), templateUrl);
                        if (fs.existsSync(templatePathResolved)) {
                          htmlContent = fs.readFileSync(templatePathResolved, 'utf8');
                        } else {
                          console.warn(`[scan-web] TemplateUrl not found: ${templatePathResolved} referenced in ${filePath}`);
                        }
                      }
                      break; // Found templateUrl
                    }
                  }
                }
              }
            }
            if (htmlContent) break; // Found component with template/templateUrl
          }
        }
        if (htmlContent) astPath.stop(); // Stop traversal if template found in a class
      }
    });

    if (htmlContent) {
      return extractHtmlUsage(htmlContent, dsPrefixes, appPrefixes);
    }
  } catch (error) {
    console.warn(`[scan-web] Error parsing Angular TS file ${filePath}:`, error.message);
  }
  return null;
}

// 📦 Análise JS/TS/JSX/TSX
for (const file of jsFiles) {
  let angularUsage = null;
  if (file.endsWith('.ts') && !file.endsWith('.tsx')) {
    angularUsage = extractAngularUsageFromTs(file, DS_PREFIXES, APP_PREFIXES);
  }

  const capitalizedDsPrefixes = DS_PREFIXES.map(p => p.charAt(0).toUpperCase() + p.slice(1));
  const capitalizedAppPrefixes = APP_PREFIXES.map(p => p.charAt(0).toUpperCase() + p.slice(1));
  const jsxUsage = extractJsxUsage(file, capitalizedDsPrefixes, capitalizedAppPrefixes);

  for (const prefix of DS_PREFIXES) {
    const target = usageMap[prefix];

    if (angularUsage) {
      mergeHtmlUsage(angularUsage, target, prefix);
    }

    if (jsxUsage && jsxUsage.components && typeof jsxUsage.components === 'object') {
      for (const [tag, count] of Object.entries(jsxUsage.components)) {
        if (tag.toLowerCase().startsWith(prefix)) {
          target.components[tag] = (target.components[tag] || 0) + count;
        }
      }
    }
    if (jsxUsage && jsxUsage.propValues && typeof jsxUsage.propValues === 'object') {
      for (const [tag, props] of Object.entries(jsxUsage.propValues)) {
        if (tag.toLowerCase().startsWith(prefix)) {
          if (!target.propValues[tag]) target.propValues[tag] = {};
          for (const [prop, values] of Object.entries(props)) { // Assumes props is an object
            if (!target.propValues[tag][prop]) target.propValues[tag][prop] = [];
            for (const value of values) { // Assumes values is an array
              if (!target.propValues[tag][prop].includes(value)) {
                target.propValues[tag][prop].push(value);
              }
            }
          }
        }
      }
    }
    if (jsxUsage && jsxUsage.directives && typeof jsxUsage.directives === 'object') {
      for (const [directive, count] of Object.entries(jsxUsage.directives)) {
        if (directive.toLowerCase().startsWith(prefix)) {
          target.directives[directive] = (target.directives[directive] || 0) + count;
        }
      }
    }
    if (jsxUsage && jsxUsage.internalComponents && typeof jsxUsage.internalComponents === 'object') {
      for (const [tag, count] of Object.entries(jsxUsage.internalComponents)) {
        target.internalComponents[tag] = (target.internalComponents[tag] || 0) + count;
      }
    }
    if (jsxUsage && jsxUsage.outsideComponents && typeof jsxUsage.outsideComponents === 'object') {
      for (const [tag, count] of Object.entries(jsxUsage.outsideComponents)) {
        target.outsideComponents[tag] = (target.outsideComponents[tag] || 0) + count;
      }
    }

    // Merge CSS class usage from JSX/TSX
    if (jsxUsage && jsxUsage.classes && typeof jsxUsage.classes === 'object') {
      for (const [cls, count] of Object.entries(jsxUsage.classes)) {
        // jsxUsage.classes contains DS-prefixed classes (e.g., "nb-button")
        // Filter for the current prefix being processed in the loop.
        // DS_PREFIXES are like ['nb'], classes are like 'nb-button'.
        // The check in extractJsxUsage is `dsClassPrefixes.some(p => cls.startsWith(p))`
        // where dsClassPrefixes are `nb-`, `idsw-` etc.
        // So, cls already has the full prefix e.g. "nb-button".
        // We need to ensure it matches the *current* `prefix` from `DS_PREFIXES`.
        if (cls.toLowerCase().startsWith(prefix.toLowerCase() + '-')) {
          target.classes[cls] = (target.classes[cls] || 0) + count;
        }
      }
    }
  }
}

// 📦 Análise HTML/Vue
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const htmlResult = extractHtmlUsage(content, DS_PREFIXES, APP_PREFIXES);
  for (const prefix of DS_PREFIXES) {
    const target = usageMap[prefix];
    mergeHtmlUsage(htmlResult, target, prefix);
  }
}

// 🎨 CSS/SCSS
for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const prefix of DS_PREFIXES) {
    const tokens = extractCssTokens(content, prefix);
    const target = usageMap[prefix];

    for (const token of tokens.customProperties) {
      target.customProperties[token] = (target.customProperties[token] || 0) + 1;
    }

    for (const token of tokens.scssVariables) {
      target.scssVariables[token] = (target.scssVariables[token] || 0) + 1;
    }

    for (const cls of tokens.classes || []) {
      target.classes[cls] = (target.classes[cls] || 0) + 1;
    }
  }
}

// 🔗 Utilitário de Merge
function mergeHtmlUsage(htmlResult, target, prefix) {
  for (const [tag, count] of Object.entries(htmlResult.components)) {
    if (!tag.toLowerCase().startsWith(prefix)) continue;
    target.components[tag] = (target.components[tag] || 0) + count;
  }
  for (const [tag, props] of Object.entries(htmlResult.propValues)) {
    if (!tag.toLowerCase().startsWith(prefix)) continue;
    if (!target.propValues[tag]) target.propValues[tag] = {};
    for (const [prop, values] of Object.entries(props)) {
      if (!target.propValues[tag][prop]) target.propValues[tag][prop] = [];
      for (const value of values) {
        if (!target.propValues[tag][prop].includes(value)) {
          target.propValues[tag][prop].push(value);
        }
      }
    }
  }
  // Merge directives
  if (htmlResult.directives && typeof htmlResult.directives === 'object') {
    for (const [directive, count] of Object.entries(htmlResult.directives)) {
      // Assuming parse-html-ast.js ensures directives are correctly DS-prefixed.
      // The prefix check here is for ensuring it belongs to the current DS context being processed.
      if (directive.toLowerCase().startsWith(prefix.toLowerCase())) {
        target.directives[directive] = (target.directives[directive] || 0) + count;
      }
    }
  } else if (htmlResult.directives) {
    // Add a warning if htmlResult.directives is not an object but exists, to help diagnose
    console.warn(`[scan-web] Warning: htmlResult.directives in mergeHtmlUsage was expected to be an object, but got: ${typeof htmlResult.directives}`);
  }
  for (const [tag, count] of Object.entries(htmlResult.outsideComponents)) {
    target.outsideComponents[tag] = (target.outsideComponents[tag] || 0) + count;
  }
  // Ensure htmlResult.internalComponents exists and is an object before iterating
  if (htmlResult.internalComponents && typeof htmlResult.internalComponents === 'object') {
    for (const [tag, count] of Object.entries(htmlResult.internalComponents)) {
      target.internalComponents[tag] = (target.internalComponents[tag] || 0) + count;
    }
  }
  // Merge classes usage
  // Ensure htmlResult.classes exists and is an object before iterating
  if (htmlResult.classes && typeof htmlResult.classes === 'object') {
    for (const [cls, count] of Object.entries(htmlResult.classes || {})) {
      // extractHtmlUsage already filters by prefix, so we can merge directly
      target.classes[cls] = (target.classes[cls] || 0) + count;
    }
  }
}

// 💾 Salvar
// Use the imported 'nodePath' module here
const reportsDir = nodePath.dirname(OUTPUT_PATH);
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(usageMap, null, 2));
console.log(`✅ Web usage report saved to ${OUTPUT_PATH}`);

import fs from 'fs';
import fg from 'fast-glob';
import nodePath from 'path'; // Rename to avoid conflict in global scope if necessary, though 'path' is conventional
import * as babelParser from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default;

import { extractHtmlUsage } from './utils/parse-html-ast.js';
import { extractCssTokens } from './utils/parse-css-tokens.js';
import { extractJsxUsage } from './utils/parse-jsx-ast.js';
import { discoverJsxInternalComponentNames } from './utils/discover-jsx-names.js';

// Use the renamed import for global scope path operations
const OUTPUT_PATH = nodePath.resolve('reports/web-usage.json');
const DS_PREFIXES = ['nb'];

const processedTemplateUrls = new Set(); // For Angular template double counting fix
const discoveredAngularSelectors = new Set();
const discoveredJsxInternalNames = new Set();

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

console.log('[Discovery Pass] Identifying JSX internal component definitions...');
const capitalizedDsPrefixes = DS_PREFIXES.map(p => p.charAt(0).toUpperCase() + p.slice(1));
for (const file of jsFiles) {
    const foundJsxNames = discoverJsxInternalComponentNames(file, capitalizedDsPrefixes);
    foundJsxNames.forEach(name => discoveredJsxInternalNames.add(name));
}
console.log(`[Discovery Pass] Discovered JSX Internal Names: ${JSON.stringify(Array.from(discoveredJsxInternalNames))}`);

/**
 * Discovers Angular component selectors from a TypeScript file and adds them to the provided set.
 * @param {string} filePath Path to the TypeScript file.
 * @param {string[]} dsPrefixes Array of Design System prefixes (e.g., ['nb']).
 * @param {Set<string>} selectorsSet The set to add discovered selectors to.
 */
function discoverAngularSelectorsInTsFile(filePath, dsPrefixes, selectorsSet) {
  const dsTagPrefixes = dsPrefixes.map(p => p + '-'); // e.g., ['nb-']
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const ast = babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'decorators-legacy', 'deprecatedImportAssert']
    });

    traverse(ast, {
      ClassDeclaration(astPath) {
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
                  if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier' &&
                      prop.key.name === 'selector' && prop.value.type === 'StringLiteral') {
                    const selector = prop.value.value;
                    const isPotentialElementSelector = /^[a-zA-Z0-9_]+-[a-zA-Z0-9_-]*$/.test(selector);
                    if (selector && isPotentialElementSelector) {
                      const isDsComponentSelector = dsTagPrefixes.some(dsp => selector.startsWith(dsp));
                      if (!isDsComponentSelector) {
                        selectorsSet.add(selector);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.warn(`[scan-web] Error parsing Angular TS file for selector discovery ${filePath}:`, error.message);
  }
}

// New loop for Angular Selector Discovery
console.log('[Discovery Pass] Identifying Angular component selectors...');
const tsFilesForSelectorDiscovery = allFiles.filter(f => f.endsWith('.ts') && !f.endsWith('.tsx'));

for (const file of tsFilesForSelectorDiscovery) {
  discoverAngularSelectorsInTsFile(file, DS_PREFIXES, discoveredAngularSelectors);
}
console.log(`[Discovery Pass] Discovered Angular Selectors: ${JSON.stringify(Array.from(discoveredAngularSelectors))}`);

/**
 * Extracts Angular component template usage from a TypeScript file.
 * @param {string} filePath Path to the TypeScript file.
 * @param {string[]} dsPrefixes Array of Design System prefixes (e.g., ['nb']).
 * @returns {object|null} Usage data from extractHtmlUsage, or null.
 */
function extractAngularUsageFromTs(filePath, dsPrefixes) {
  // Selector discovery is now done in the initial pass.
  // This function focuses on extracting HTML content.
  // appPrefixes parameter removed as it's no longer used.
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
                          processedTemplateUrls.add(templatePathResolved); // Add to processed set
                        } else {
                          console.warn(`[scan-web] TemplateUrl not found: ${templatePathResolved} referenced in ${filePath}`);
                        }
                      }
                      break; // Found templateUrl
                    }
                    // Selector discovery logic removed from here
                  }
                }
              }
            }
            // No need to break if only selector found, might still need template/templateUrl
            // if (htmlContent) break;
          }
        }
        // Stop traversal if template found in a class, but allow selector processing to continue for all decorators.
        // This means if a file has multiple components, all selectors can be found.
        // if (htmlContent) astPath.stop(); // This might be too early if we want all selectors from a file.
                                          // However, typical Angular files have one component.
                                          // For now, let's keep it as is, prioritizing template extraction.
                                          // If a component has a selector but no template/templateUrl, htmlContent remains null.
      }
    });

    // The function's main purpose is to return HTML content for parsing.
    // Selector discovery is a side-effect for populating the global set.
    if (htmlContent) {
      // Pass discoveredAngularSelectors (global set). appPrefixes was removed from extractHtmlUsage.
      return extractHtmlUsage(htmlContent, dsPrefixes, discoveredAngularSelectors);
    }
  } catch (error) {
  console.warn(`[scan-web] Error parsing Angular TS file for template extraction ${filePath}:`, error.message);
  }
  return null;
}

// 📦 Análise JS/TS/JSX/TSX
for (const file of jsFiles) {
  let angularUsage = null;
  if (file.endsWith('.ts') && !file.endsWith('.tsx')) {
    angularUsage = extractAngularUsageFromTs(file, DS_PREFIXES);
  }

  // capitalizedDsPrefixes is already defined above, no need to redefine.
  // const capitalizedAppPrefixes = APP_PREFIXES.map(p => p.charAt(0).toUpperCase() + p.slice(1)); // This line is removed.
  // Pass discoveredJsxInternalNames (global set). appPrefixes was removed from extractJsxUsage.
  const jsxUsage = extractJsxUsage(file, capitalizedDsPrefixes, discoveredJsxInternalNames);

  for (const prefix of DS_PREFIXES) {
    const target = usageMap[prefix];

    if (angularUsage) {
      mergeHtmlUsage(angularUsage, target, prefix); // Reverted: Removed filePath
    }

    if (jsxUsage && jsxUsage.components && typeof jsxUsage.components === 'object') {
      for (const [tag, count] of Object.entries(jsxUsage.components)) {
        if (tag.toLowerCase().startsWith(prefix)) { // prefix is 'nb'
          // Removed NbIcon logging
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
  const absoluteFilePath = nodePath.resolve(file); // Ensure absolute path for comparison
  if (processedTemplateUrls.has(absoluteFilePath)) {
    // console.log(`[DEBUG] Skipping already processed Angular template: ${file}`); // Optional debug log
    continue; // Skip this file
  }
  const content = fs.readFileSync(file, 'utf8');
  // Pass discoveredAngularSelectors (global set). appPrefixes was removed from extractHtmlUsage.
  const htmlResult = extractHtmlUsage(content, DS_PREFIXES, discoveredAngularSelectors);
  for (const prefix of DS_PREFIXES) {
    const target = usageMap[prefix];
    mergeHtmlUsage(htmlResult, target, prefix); // Reverted: Removed filePath
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
function mergeHtmlUsage(htmlResult, target, prefix) { // Reverted: Removed filePath parameter
  for (const [tag, count] of Object.entries(htmlResult.components)) {
    if (!tag.toLowerCase().startsWith(prefix)) continue; // prefix is 'nb'
    // Removed nb-icon logging
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

/**
 * Calculates the usage score based on component categories.
 * @param {object} usageMap The main map containing all usage statistics.
 * @param {string[]} dsPrefixes Array of Design System prefixes (e.g., ['nb']).
 * @returns {object} An object containing the score, e.g., {"score": {"nb": "60%", "internal": "20%", "external": "20%"}}
 */
function calculateUsageScore(usageMap, dsPrefixes) {
  let nb_count = 0;
  let internal_count = 0;
  let external_count = 0;

  // Calculate nb_count (Design System components)
  for (const prefix of dsPrefixes) {
    if (usageMap[prefix] && usageMap[prefix].components) {
      nb_count += Object.values(usageMap[prefix].components).reduce((sum, count) => sum + count, 0);
    }
  }

  // Calculate internal_count and external_count
  // These are taken from the first DS prefix entry, as they represent global app counts
  // and are duplicated under each DS prefix key by the current merge logic.
  if (dsPrefixes.length > 0) {
    const firstPrefix = dsPrefixes[0];
    if (usageMap[firstPrefix]) {
      if (usageMap[firstPrefix].internalComponents) {
        internal_count = Object.values(usageMap[firstPrefix].internalComponents).reduce((sum, count) => sum + count, 0);
      }
      if (usageMap[firstPrefix].outsideComponents) {
        external_count = Object.values(usageMap[firstPrefix].outsideComponents).reduce((sum, count) => sum + count, 0);
      }
    }
  }

  const total_count = nb_count + internal_count + external_count;

  if (total_count === 0) {
    return {
      score: {
        nb: "0%",
        internal: "0%",
        external: "0%"
      }
    };
  }

  // Calculate percentages
  const nb_percentage = Math.round((nb_count / total_count) * 100) + '%';
  const internal_percentage = Math.round((internal_count / total_count) * 100) + '%';
  // Ensure external_percentage makes the total 100% with the other rounded percentages
  const external_raw_percentage = (external_count / total_count) * 100;
  let external_percentage_val = Math.round(external_raw_percentage);

  // Adjust last percentage to ensure sum is 100 due to rounding
  const current_total_percentage = parseInt(nb_percentage) + parseInt(internal_percentage) + external_percentage_val;
  if (current_total_percentage !== 100 && total_count > 0) {
    external_percentage_val += (100 - current_total_percentage);
     // Sanity check: ensure it's not negative if other numbers were rounded up significantly
    if (external_percentage_val < 0) external_percentage_val = 0;
  }


  const external_percentage = external_percentage_val + '%';

  // Fallback if rounding adjustment leads to weird sum (e.g. if total_count is very small)
  // This is a simple corrective, more robust would be to distribute error or use floor/ceil carefully
  const final_nb_int = parseInt(nb_percentage);
  const final_int_int = parseInt(internal_percentage);
  let final_ext_int = parseInt(external_percentage);

  if (final_nb_int + final_int_int + final_ext_int !== 100 && total_count > 0) {
    // If sum is not 100, adjust the largest contributor or external by default
     final_ext_int = 100 - final_nb_int - final_int_int;
     if (final_ext_int < 0) { // if external becomes negative, set to 0 and adjust another
        final_ext_int = 0;
        // This case can get complex, for now, simple adjustment is fine.
        // A more robust solution might involve distributing the rounding error.
     }
  }


  return {
    score: {
      nb: final_nb_int + '%',
      internal: final_int_int + '%',
      external: final_ext_int + '%'
    }
  };
}

// Calculate score before saving
const calculatedScoreObject = calculateUsageScore(usageMap, DS_PREFIXES);
if (calculatedScoreObject && calculatedScoreObject.score) { // Check if score object and its property exist
  usageMap.score = calculatedScoreObject.score;
} else {
  // Fallback or warning if score calculation didn't return expected structure
  console.warn('[scan-web] Score calculation did not return the expected structure. Skipping score in output.');
  usageMap.score = {
    nb: "0%",
    internal: "0%",
    external: "0%"
  }; // Default/error score
}

// 💾 Salvar
// Use the imported 'nodePath' module here
const reportsDir = nodePath.dirname(OUTPUT_PATH);
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(usageMap, null, 2));
console.log(`✅ Web usage report saved to ${OUTPUT_PATH}`);

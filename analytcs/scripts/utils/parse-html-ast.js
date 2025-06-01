import { parseDocument } from 'htmlparser2';
import { selectAll } from 'css-select';

/**
 * @param {string} html - conteúdo HTML
 * @param {string[]} dsPrefixes - ex: ['nb', 'idsw']
 * @param {string[]} appPrefixes - ex: ['app', 'shared']
 * @returns {{
 *   components: Record<string, number>,
 *   propValues: Record<string, Record<string, string[]>>,
 *   directives: string[],
 *   outsideComponents: Record<string, number>,
 *   internalComponents: Record<string, number>
 * }}
 */
export function extractHtmlUsage(html, dsPrefixes = [], appPrefixes = []) {
  const tagPrefixes = dsPrefixes.map(p => p + '-');
  // Prepare lowercase prefixes for directive matching, similar to JSX parser
  const htmlDirectivePrefixes = dsPrefixes.map(p => p.toLowerCase());
  const appTagPrefixes = appPrefixes.map(p => p + '-');
  console.log(`[DEBUG HTML Internal] Received appPrefixes: ${JSON.stringify(appPrefixes)}, Derived appTagPrefixes: ${JSON.stringify(appTagPrefixes)}`);

  const result = {
    components: {},
    propValues: {},
    directives: {}, // Changed to object for counts
    outsideComponents: {},
    internalComponents: {},
    classes: {}
  };

  const doc = parseDocument(html);
  const elements = selectAll('*', doc);

  for (const el of elements) {
    if (!el.name || !el.attribs) continue;
    const tag = el.name;
    // console.log(`[DEBUG HTML Internal] Checking tag: ${tag}`);
    const isCustomElement = tag.includes('-');
    const isDSComponent = tagPrefixes.some(prefix => tag.startsWith(prefix));
    const isAppComponent = appTagPrefixes.some(prefix => tag.startsWith(prefix));
    // console.log(`[DEBUG HTML Internal] Tag: ${tag}, isAppComponent: ${isAppComponent}`);

    // 🔹 COMPONENTE DO DESIGN SYSTEM
    if (isDSComponent) {
      result.components[tag] = (result.components[tag] || 0) + 1;
      if (!result.propValues[tag]) result.propValues[tag] = {};

      for (const [attr, val] of Object.entries(el.attribs)) {
        const cleanAttr = attr.replace(/[\[\]\(\)\*]/g, '');
        if (typeof val === 'string') {
          if (!result.propValues[tag][cleanAttr]) result.propValues[tag][cleanAttr] = [];
          if (!result.propValues[tag][cleanAttr].includes(val)) {
            result.propValues[tag][cleanAttr].push(val);
          }
        }

        // Diretivas do DS (ex: nbButton, idswForm) - This specific block will be removed
        // Directive checking will be handled by the general loop for all elements later.
      }
    }

    // 🔸 COMPONENTE INTERNO
    else if (isAppComponent) {
      console.log(`[DEBUG HTML Internal] Counting HTML internal component: ${tag}`);
      result.internalComponents[tag] = (result.internalComponents[tag] || 0) + 1;
    }

    // ⚠️ COMPONENTE EXTERNO
    else if (isCustomElement) {
      result.outsideComponents[tag] = (result.outsideComponents[tag] || 0) + 1;
    }

    // Process classes
    const classAttr = el.attribs.class;
    if (classAttr) {
      const classes = classAttr.split(/\s+/);
      for (const cls of classes) {
        if (dsPrefixes.some(prefix => cls.startsWith(prefix + '-'))) {
          result.classes[cls] = (result.classes[cls] || 0) + 1;
        }
      }
    }

    // 🔸 Diretivas em qualquer elemento (ex: nbTooltip, idswFormField)
    // This loop processes attributes for ALL elements, including DS Components, App Components, etc.
    for (const attr of Object.keys(el.attribs)) {
      const cleanAttr = attr.replace(/[\[\]\(\)\*]/g, ''); // Keep original cleaning
      // Standardized directive check with length condition and lowercase prefix comparison
      if (htmlDirectivePrefixes.some(p => cleanAttr.startsWith(p) && cleanAttr.length > p.length)) {
        result.directives[cleanAttr] = (result.directives[cleanAttr] || 0) + 1;
      }
    }
  }

  return result;
}

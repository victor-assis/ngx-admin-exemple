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
  const directivePrefixes = dsPrefixes;
  const appTagPrefixes = appPrefixes.map(p => p + '-');

  const result = {
    components: {},
    propValues: {},
    directives: [],
    outsideComponents: {},
    internalComponents: {},
    classes: {}
  };

  const doc = parseDocument(html);
  const elements = selectAll('*', doc);

  for (const el of elements) {
    if (!el.name || !el.attribs) continue;
    const tag = el.name;
    const isCustomElement = tag.includes('-');
    const isDSComponent = tagPrefixes.some(prefix => tag.startsWith(prefix));
    const isAppComponent = appTagPrefixes.some(prefix => tag.startsWith(prefix));

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

        // Diretivas do DS (ex: nbButton, idswForm)
        if (directivePrefixes.some(p => cleanAttr.startsWith(p))) {
          if (!result.directives.includes(cleanAttr)) {
            result.directives.push(cleanAttr);
          }
        }
      }
    }

    // 🔸 COMPONENTE INTERNO
    else if (isAppComponent) {
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

    // 🔸 Diretivas fora do tagName (ex: matTooltip)
    for (const attr of Object.keys(el.attribs)) {
      const cleanAttr = attr.replace(/[\[\]\(\)\*]/g, '');
      if (
        directivePrefixes.some(p => cleanAttr.startsWith(p)) &&
        !result.directives.includes(cleanAttr)
      ) {
        result.directives.push(cleanAttr);
      }
    }
  }

  return result;
}

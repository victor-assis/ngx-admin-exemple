import fs from 'fs';
import * as babelParser from '@babel/parser';

import traverseModule from '@babel/traverse';
const traverse = traverseModule.default;

/**
 * Extrai componentes, props, diretivas e componentes internos de um arquivo JSX/TSX.
 * @param {string} filePath - Caminho do arquivo.
 * @param {string[]} dsPrefixes - Prefixos dos componentes e diretivas do DS, ex: ['Nb', 'Idsw']. (Note: para diretivas, o prefixo pode ser minúsculo ex: 'nb')
 * @param {string[]} appPrefixes - Prefixos dos componentes da App, ex: ['App', 'Shared'].
 * @returns {{
 *   components: Record<string, number>,
 *   propValues: Record<string, Record<string, string[]>>,
 *   directives: Record<string, number>,
 *   internalComponents: Record<string, number>,
 *   outsideComponents: Record<string, number>
 * }}
 */
export function extractJsxUsage(filePath, dsPrefixes = [], appPrefixes = []) {
  const code = fs.readFileSync(filePath, 'utf8');
  const ast = babelParser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'decorators-legacy']
  });

  const result = {
    components: {},
    propValues: {},
    directives: {},
    internalComponents: {},
    outsideComponents: {}
  };

  // As diretivas podem ter prefixos diferentes (ex: minúsculos como 'nbButton')
  // enquanto componentes são capitalizados (ex: 'NbButton').
  // Vamos assumir que dsPrefixes pode conter ambos os tipos de casos ou que serão tratados adequadamente.
  // Para este contexto, vamos assumir que os prefixos de diretiva são os mesmos que os de componentes,
  // mas em minúsculas para corresponder a atributos como `nbButton`.
  // Esta lógica pode precisar de ajuste com base na convenção real de nomenclatura de diretivas.
  const directiveAttributePrefixes = dsPrefixes.map(p => p.toLowerCase());


  traverse(ast, {
    JSXOpeningElement(path) {
      const nameNode = path.node.name;
      if (!nameNode || !nameNode.name) return; // Ignora elementos como <></> ou <Component.SubComponent /> por enquanto

      const tagName = nameNode.name;
      const isDSComponent = dsPrefixes.some(p => tagName.startsWith(p));

      if (isDSComponent) {
        result.components[tagName] = (result.components[tagName] || 0) + 1;
        if (!result.propValues[tagName]) result.propValues[tagName] = {};

        for (const attr of path.node.attributes) {
          if (attr.type !== 'JSXAttribute' || !attr.name) continue;
          
          const propName = attr.name.name;
          if (!propName) continue;

          // Extração de valor de prop (StringLiteral)
          const valueNode = attr.value;
          if (valueNode && valueNode.type === 'StringLiteral') {
            const value = valueNode.value;
            if (!result.propValues[tagName][propName]) result.propValues[tagName][propName] = [];
            if (!result.propValues[tagName][propName].includes(value)) {
              result.propValues[tagName][propName].push(value);
            }
          }

          // Verificação de diretivas como atributos em componentes DS
          // Ex: <NbButton nbButton /> ou <NbInput idswInput />
          // Assumindo que prefixos de diretiva são minúsculos (ex: 'nb', 'idsw')
          if (directiveAttributePrefixes.some(dp => propName.startsWith(dp) && propName !== dp)) { // Evitar que 'nb' em <NbCard nb /> seja contado como diretiva
             // Verifica se a diretiva (propName) realmente pertence ao DS (ex: nbButton, idswFormField)
             // Esta é uma simplificação; pode precisar de uma lista mais explícita de diretivas.
            if (dsPrefixes.some(dsp => propName.toLowerCase().startsWith(dsp.toLowerCase()) && propName.length > dsp.length)) {
                 result.directives[propName] = (result.directives[propName] || 0) + 1;
            }
          }
        }
      } else {
        // Não é componente DS, verificar se é componente interno da aplicação
        const isAppComponent = appPrefixes.some(p => tagName.startsWith(p));
        if (isAppComponent) {
          result.internalComponents[tagName] = (result.internalComponents[tagName] || 0) + 1;
        } else {
          // Não é componente DS nem componente interno da App.
          // Verificar se é um componente "externo" (ex: de terceiros, ou customizado não App).
          // Heurística: começa com letra maiúscula e não é tag HTML padrão.
          // Tags HTML padrão (div, span, etc.) são minúsculas.
          if (/^[A-Z]/.test(tagName)) {
            result.outsideComponents[tagName] = (result.outsideComponents[tagName] || 0) + 1;
          }
        }
      }

      // Verifica diretivas em qualquer elemento (não apenas DS) - se necessário
      // A lógica atual em extractHtmlUsage parece contar diretivas em qualquer tag.
      // Para JSX, diretivas como atributos são menos comuns fora de componentes específicos.
      // Se uma diretiva como `nbTooltip` puder ser aplicada a um `<div>`, essa lógica seria aqui.
      // Por ora, focamos em diretivas como atributos de componentes DS.
      // Se precisarmos expandir, podemos adicionar outro loop aqui pelos atributos
      // e verificar contra `directiveAttributePrefixes` para qualquer `tagName`.
    }
  });

  return result;
}

import fs from 'fs';
import { Octokit } from '@octokit/rest';

// ✅ Setup
const token = process.env.GITHUB_TOKEN;
const repoFull = process.env.GITHUB_REPOSITORY; // ex: user/repo
const prNumber = process.env.PR_NUMBER;

if (!token || !repoFull || !prNumber) {
  console.error('❌ Variáveis de ambiente faltando: GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER');
  process.exit(1);
}

const [owner, repo] = repoFull.split('/');
const octokit = new Octokit({ auth: token });

const path = 'analyzer/reports/final-report.json';
if (!fs.existsSync(path)) {
  console.error('❌ final-report.json não encontrado.');
  process.exit(1);
}

const reportData = JSON.parse(fs.readFileSync(path, 'utf-8'));
const framework = reportData.framework || 'N/A';
const score = reportData.score; // Keep as is, will check before use
const systems = reportData.systems || {};

const count = obj => Object.values(obj || {}).reduce((acc, val) => acc + val, 0);

const formatList = (title, obj) => {
  if (!obj || Object.keys(obj).length === 0) return `<details><summary><h3>${title}</h3></summary>

No data available.

</details>

`;
  let listItems = Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([key, val]) => `- \`${key}\`: **${val}**`)
    .join('\n'); // Use
 here
  return `<details><summary><h3>${title} (click to expand)</h3></summary>

${listItems}

</details>

`;
};

const renderPropsMarkdown = data => {
  if (!data || Object.keys(data).length === 0) return `<details><summary><h3>🧬 Props usadas por componente</h3></summary>

No data available.

</details>

`;
  let mdContent = '';
  for (const [component, props] of Object.entries(data)) {
    mdContent += `**${component}**\n`; // Use
 here
    for (const [prop, values] of Object.entries(props)) {
      mdContent += `- \`${prop}\`: ${values.map(v => `\`${v}\``).join(', ')}\n`; // Use
 here
    }
    mdContent += '\n'; // Use
 here
  }
  return `<details><summary><h3>🧬 Props usadas por componente (click to expand)</h3></summary>

${mdContent}</details>

`;
};

// renderInternalsMarkdown function removed.

// ✅ Gera mensagem de comentário
let message = `## 📊 Design System Usage Report
`;
if (score && typeof score === 'object' && score.nb) {
  const nbScoreForBadge = parseInt(score.nb) || 0; // Extract number for badge
  message += `![Usage Badge](https://img.shields.io/badge/design--system--usage-${nbScoreForBadge}%25-blue?style=flat-square)
`;
  message += `**Framework detectado:** \`${framework}\`
`;
  message += `**Overall Adoption Score:**
`;
  message += `- Design System (nb): **${score.nb || 'N/A'}**
`;
  message += `- Internal Components: **${score.internal || 'N/A'}**
`;
  message += `- External Components: **${score.external || 'N/A'}**

`;
} else {
  message += `**Framework detectado:** \`${framework}\`
`;
  message += `**Overall Adoption Score:** Data N/A

`;
}

for (const [prefix, data] of Object.entries(systems)) {
  message += `---\n\n`; // Using \n for markdown structure, PR comment API handles this.
  message += `## 🔹 Design System: \`${prefix}\`\n`;
  // Removed **Adoção estimada:** ${data.score}% line

  const total = // This total is for the "Total de usos detectados" line, can be kept.
    count(data.components) +
    count(data.classes) +
    count(data.customProperties) +
    count(data.scssVariables) +
    count(data.directives);

  if (total > 0) {
    message += `- Total de usos detectados: **${total}**\n\n`;
    message += formatList('🧩 Componentes (tags)', data.components);
    message += formatList('🎨 Classes CSS', data.classes);
    message += formatList('🧪 CSS Custom Properties', data.customProperties);
    message += formatList('💠 SCSS Tokens', data.scssVariables);
    message += formatList('🔷 Diretivas Angular/Vue', data.directives);
    message += renderPropsMarkdown(data.propValues);
    message += formatList('🚫 Componentes fora do Design System', data.outsideComponents);
    // Replaced renderInternalsMarkdown with formatList for internalComponents
    message += formatList('🧩 Componentes Internos da Aplicação', data.internalComponents);
  } else {
    message += `❌ Nenhum uso detectado para este DS.`;
  }

  message += '\n';
}

// ✅ Publica comentário na PR
await octokit.issues.createComment({
  owner,
  repo,
  issue_number: parseInt(prNumber, 10),
  body: message
});

console.log('✅ Comentário publicado na PR.');

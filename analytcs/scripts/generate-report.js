import fs from 'fs';
import path from 'path';

const INPUT_PATH = path.resolve('reports/web-usage.json');
const OUTPUT_JSON = path.resolve('analyzer/reports/final-report.json');
const OUTPUT_MD = path.resolve('analyzer/reports/final-report.md');

const reportsDir = path.dirname(OUTPUT_JSON);
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

if (!fs.existsSync(INPUT_PATH)) {
  console.error('❌ web-usage.json não encontrado.');
  process.exit(1);
}

const usageMap = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
const { framework, ...systems } = usageMap;

// const count = obj => Object.values(obj || {}).reduce((acc, val) => acc + val, 0); // count function no longer needed here for score

// Initialize finalReport for JSON output - simplified score handling
const finalReport = { framework, score: usageMap.score || {}, systems: {} };

// Start building the Markdown report string
let mdReport = "# Web Usage Analysis Report\n\n";

mdReport += "## Overall Summary\n";
mdReport += `- **Framework Detected**: ${framework}\n`;
if (usageMap.score) {
  mdReport += `- **Adoption Score**:\n`;
  mdReport += `    - **nb**: ${usageMap.score.nb}\n`;
  mdReport += `    - **Internal**: ${usageMap.score.internal}\n`;
  mdReport += `    - **External**: ${usageMap.score.external}\n`;
}
mdReport += "\n---\n\n";

// Utility functions - can remain the same
const formatList = (title, obj) => {
  if (!obj || Object.keys(obj).length === 0) return '';
  return `### ${title}\n` +
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([key, val]) => `- \`${key}\`: **${val}**`)
      .join('\n') +
    '\n\n';
};

const renderPropsMarkdown = data => {
  if (!data || Object.keys(data).length === 0) return '';
  let md = `### 🧬 Props usadas por componente\n\n`;
  for (const [component, props] of Object.entries(data)) {
    md += `**${component}**\n`;
    for (const [prop, values] of Object.entries(props)) {
      md += `- \`${prop}\`: ${values.map(v => `\`${v}\``).join(', ')}\n`;
    }
    md += '\n';
  }
  return md;
};

// Process each Design System
for (const [prefix, data] of Object.entries(systems)) {
  // For JSON report, store data without the old per-system score
  finalReport.systems[prefix] = { ...data };

  let mdSystemSection = `## Design System: \`${prefix}\`\n\n`;
  // Old per-system score display removed

  mdSystemSection += formatList('Component Usage (`<tag>`)', data.components);
  mdSystemSection += formatList('Directive Usage', data.directives);
  mdSystemSection += formatList('Class Usage', data.classes);
  mdSystemSection += formatList('CSS Custom Property Usage', data.customProperties);
  mdSystemSection += formatList('SCSS Variable Usage', data.scssVariables);
  mdSystemSection += renderPropsMarkdown(data.propValues);

  mdReport += mdSystemSection + "\n---\n\n";
}

// Add Global Application-Specific Components Section to Markdown
mdReport += "## Application-Specific Components\n\n";
const firstSystemPrefix = Object.keys(systems)[0]; // Get the first prefix
if (firstSystemPrefix && systems[firstSystemPrefix]) {
  const globalData = systems[firstSystemPrefix];
  // Note: internalComponents and outsideComponents are now directly under each system prefix in usageMap.
  // The report will show them for the *first* system encountered. This matches the old behavior implicitly.
  // If these should be truly global and unique, web-usage.json structure would need adjustment.
  mdReport += formatList('Internal Application Components', globalData.internalComponents);
  mdReport += formatList('Unrecognized Custom Components (Outside Components)', globalData.outsideComponents);
}
mdReport += "\n---\n\n";

// Save the reports
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(finalReport, null, 2));
fs.writeFileSync(OUTPUT_MD, mdReport); // Write the consolidated mdReport string

console.log(`✅ Markdown and JSON reports saved.`);

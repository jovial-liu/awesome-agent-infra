import fs from 'node:fs/promises';

const catalog = JSON.parse(await fs.readFile(new URL('../catalog.json', import.meta.url), 'utf8'));
if (catalog.schema !== 'awesome-agent-infra/v1' || !Array.isArray(catalog.projects) || !catalog.projects.length) throw new Error('invalid catalog envelope');
const seen = new Set();
for (const project of catalog.projects) {
  for (const key of ['slug', 'category', 'repo', 'oneLiner', 'command', 'artifact']) if (!project[key]) throw new Error(`${project.slug || 'unknown'} missing ${key}`);
  if (!Array.isArray(project.keywords) || project.keywords.length < 3 || project.keywords.some((keyword) => typeof keyword !== 'string' || !keyword.trim())) throw new Error(`${project.slug || 'unknown'} needs at least three keywords`);
  if (seen.has(project.slug)) throw new Error(`duplicate slug: ${project.slug}`);
  seen.add(project.slug);
  if (!/^https:\/\/github\.com\//.test(project.repo)) throw new Error(`${project.slug} is not a GitHub URL`);
}
console.log(`catalog valid: ${catalog.projects.length} projects, ${new Set(catalog.projects.map((project) => project.category)).size} categories`);

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
if (!Array.isArray(catalog.recipes) || !catalog.recipes.length) throw new Error('catalog needs recipes');
const recipeSlugs = new Set();
for (const recipe of catalog.recipes) {
  if (!recipe.slug || !recipe.title || !Array.isArray(recipe.steps) || recipe.steps.length < 2) throw new Error(`invalid recipe: ${recipe.slug || 'unknown'}`);
  if (recipeSlugs.has(recipe.slug)) throw new Error(`duplicate recipe: ${recipe.slug}`);
  recipeSlugs.add(recipe.slug);
  for (const step of recipe.steps) {
    if (!seen.has(step.project)) throw new Error(`${recipe.slug} references unknown project: ${step.project}`);
    if (!step.why) throw new Error(`${recipe.slug} step ${step.project} needs a reason`);
  }
}
console.log(`catalog valid: ${catalog.projects.length} projects, ${new Set(catalog.projects.map((project) => project.category)).size} categories`);

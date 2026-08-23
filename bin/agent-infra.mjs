#!/usr/bin/env node
import { findProject, findRecipe, loadCatalog, searchCatalog } from '../src/index.mjs';

const VERSION = '0.3.0';
const HELP = `agent-infra ${VERSION}

Search a local-first map of small AI-agent infrastructure tools.

Usage:
  agent-infra find <problem words> [--limit N] [--json]
  agent-infra show <project> [--json]
  agent-infra list [--category NAME] [--json]
  agent-infra categories
  agent-infra recipes [--json]
  agent-infra recipe <name> [--json]
  agent-infra --version

Examples:
  agent-infra find stale tests
  agent-infra find "MCP tool collision" --limit 3
  agent-infra show stillgreen
  agent-infra list --category security
  agent-infra recipe secure-handoff
`;

function parseOptions(args) {
  const words = []; let json = false; let limit = 5; let category = '';
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--json') json = true;
    else if (args[index] === '--limit') limit = Number(args[++index]);
    else if (args[index] === '--category') category = args[++index] ?? '';
    else if (args[index].startsWith('--')) throw new Error(`unknown option: ${args[index]}`);
    else words.push(args[index]);
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error('limit must be an integer from 1 to 50');
  return { words, json, limit, category };
}

function printProject(project, reason = '') {
  console.log(`${project.slug}  [${project.category}]${reason ? `  ${reason}` : ''}`);
  console.log(`  ${project.oneLiner}`);
  console.log(`  ${project.repo}`);
  console.log(`  try: ${project.command}`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || ['help', '--help', '-h'].includes(command)) { console.log(HELP); return; }
  if (['--version', '-v'].includes(command)) { console.log(VERSION); return; }
  const catalog = await loadCatalog();
  if (command === 'recipes') {
    const options = parseOptions(args);
    if (options.words.length) throw new Error('recipes takes no positional arguments');
    if (options.json) console.log(JSON.stringify(catalog.recipes ?? [], null, 2));
    else for (const recipe of catalog.recipes ?? []) console.log(`${recipe.slug.padEnd(18)} ${recipe.title}`);
    return;
  }
  if (command === 'categories') {
    const counts = Object.entries(catalog.projects.reduce((result, project) => { result[project.category] = (result[project.category] ?? 0) + 1; return result; }, {})).sort();
    for (const [category, count] of counts) console.log(`${category.padEnd(16)} ${count}`);
    return;
  }
  const options = parseOptions(args);
  if (command === 'recipe') {
    if (options.words.length !== 1) throw new Error('recipe needs one recipe slug');
    const recipe = findRecipe(catalog, options.words[0]);
    if (!recipe) { console.error(`Unknown recipe: ${options.words[0]}`); process.exitCode = 1; return; }
    if (options.json) console.log(JSON.stringify(recipe, null, 2));
    else {
      console.log(`${recipe.title}\n`);
      recipe.steps.forEach((step, index) => { const project = findProject(catalog, step.project); console.log(`${index + 1}. ${step.project} — ${step.why}\n   ${project.command}`); });
    }
    return;
  }
  if (command === 'find') {
    const query = options.words.join(' ');
    if (!query) throw new Error('find needs a problem description');
    const results = searchCatalog(catalog, query, { limit: options.limit });
    if (options.json) console.log(JSON.stringify({ query, results }, null, 2));
    else if (!results.length) { console.log(`No match for “${query}”. Try a category or broader term.`); process.exitCode = 1; }
    else results.forEach((item, index) => { if (index) console.log(''); printProject(item.project, item.reasons.slice(0, 4).join(', ')); });
    return;
  }
  if (command === 'show') {
    if (options.words.length !== 1) throw new Error('show needs one project slug');
    const project = findProject(catalog, options.words[0]);
    if (!project) { console.error(`Unknown project: ${options.words[0]}`); process.exitCode = 1; return; }
    if (options.json) console.log(JSON.stringify(project, null, 2)); else printProject(project);
    return;
  }
  if (command === 'list') {
    let projects = catalog.projects;
    if (options.category) projects = projects.filter((project) => project.category === options.category);
    if (options.json) console.log(JSON.stringify(projects, null, 2));
    else if (!projects.length) { console.error(`No projects in category: ${options.category}`); process.exitCode = 1; }
    else for (const project of projects) console.log(`${project.slug.padEnd(16)} ${project.category.padEnd(16)} ${project.oneLiner}`);
    return;
  }
  throw new Error(`unknown command: ${command}`);
}

main().catch((error) => { console.error(`agent-infra: ${error.message}`); process.exitCode = 2; });

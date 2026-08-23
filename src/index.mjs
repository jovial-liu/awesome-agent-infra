import { readFile } from 'node:fs/promises';

const catalogUrl = new URL('../catalog.json', import.meta.url);

export async function loadCatalog() {
  return JSON.parse(await readFile(catalogUrl, 'utf8'));
}

function normalize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokens(value) {
  return [...new Set(normalize(value).split(/\s+/).filter(Boolean).map((token) => token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token))];
}

const EXPANSIONS = new Map(Object.entries({
  bug: ['failure', 'debugging'], crash: ['failure', 'debugging'], error: ['failure', 'debugging'],
  transfer: ['handoff'], context: ['token', 'optimization'], cost: ['token', 'optimization'],
  stale: ['verification', 'test', 'worktree'], green: ['verification', 'test'], proof: ['verification', 'receipt'],
  permission: ['authorization', 'policy'], access: ['authorization', 'policy'],
  attack: ['security'], unsafe: ['security'], secret: ['privacy', 'redaction'],
  benchmark: ['evaluation'], eval: ['evaluation'], package: ['release', 'npm'], publish: ['release', 'npm'],
  manual: ['documentation'], docs: ['documentation', 'markdown'],
  server: ['mcp', 'protocol'], tool: ['mcp'], collision: ['composition'],
  observe: ['observability'], trace: ['observability', 'record'],
}));

export function searchCatalog(catalog, query, { limit = 5 } = {}) {
  const phrase = normalize(query);
  const queryTokens = tokens(query);
  const expanded = new Set(queryTokens);
  for (const token of queryTokens) for (const value of EXPANSIONS.get(token) ?? []) expanded.add(value);
  const ranked = catalog.projects.map((project) => {
    const slug = normalize(project.slug);
    const category = normalize(project.category);
    const searchable = normalize([project.slug, project.category, project.oneLiner, project.artifact, ...(project.keywords ?? [])].join(' '));
    let score = 0;
    const reasons = [];
    if (slug === phrase) { score += 200; reasons.push('exact project'); }
    if (category === phrase) { score += 80; reasons.push(`category: ${project.category}`); }
    if (phrase && searchable.includes(phrase)) { score += 40; reasons.push('phrase match'); }
    for (const token of expanded) {
      if (slug.split(' ').includes(token)) score += 35;
      if (category.split(' ').includes(token)) { score += 24; reasons.push(`category: ${project.category}`); }
      if ((project.keywords ?? []).some((keyword) => tokens(keyword).includes(token))) { score += 18; reasons.push(`keyword: ${token}`); }
      else if (searchable.split(' ').includes(token)) { score += 7; reasons.push(`text: ${token}`); }
    }
    return { project, score, reasons: [...new Set(reasons)] };
  }).filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.project.slug.localeCompare(right.project.slug));
  const floor = Math.max(7, (ranked[0]?.score ?? 0) * 0.1);
  return ranked.filter((item) => item.score >= floor).slice(0, limit);
}

export function findProject(catalog, slug) {
  return catalog.projects.find((project) => project.slug === slug) ?? null;
}

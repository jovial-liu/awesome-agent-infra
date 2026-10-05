import test from 'node:test';
import { validateInstallation } from '../src/installation.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { findRecipe, searchCatalog } from '../src/index.mjs';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'bin', 'agent-infra.mjs');

test('catalog has unique, runnable project entries', async () => {
  const catalog = JSON.parse(await fs.readFile(new URL('../catalog.json', import.meta.url), 'utf8'));
  assert.equal(catalog.schema, 'awesome-agent-infra/v1');
  assert.equal(new Set(catalog.projects.map((project) => project.slug)).size, catalog.projects.length);
  for (const project of catalog.projects) assert.doesNotThrow(() => validateInstallation(project));
  assert.ok(catalog.projects.every((project) => Array.isArray(project.keywords) && project.keywords.length >= 3));
  assert.ok(catalog.projects.some((project) => project.category === 'security'));
});

test('recipes are ordered and reference existing projects', async () => {
  const catalog = JSON.parse(await fs.readFile(new URL('../catalog.json', import.meta.url), 'utf8'));
  const recipe = findRecipe(catalog, 'mcp-release');
  assert.deepEqual(recipe.steps.map((step) => step.project), ['mcpdoctor', 'toolclash', 'mcpstub']);
  const slugs = new Set(catalog.projects.map((project) => project.slug));
  assert.ok(catalog.recipes.flatMap((item) => item.steps).every((step) => slugs.has(step.project)));
});

test('find ranks exact problems and useful expansions', async () => {
  const catalog = JSON.parse(await fs.readFile(new URL('../catalog.json', import.meta.url), 'utf8'));
  assert.equal(searchCatalog(catalog, 'stale green tests')[0].project.slug, 'stillgreen');
  assert.equal(searchCatalog(catalog, 'MCP tool collision')[0].project.slug, 'toolclash');
  assert.equal(searchCatalog(catalog, 'npm package publish')[0].project.slug, 'packguard');
  assert.equal(searchCatalog(catalog, 'prompt injection attack')[0].project.slug, 'promptshield');
  assert.equal(searchCatalog(catalog, 'missing tool result trace')[0].project.slug, 'traceproof');
  assert.equal(searchCatalog(catalog, 'swallowed CI failure pipefail')[0].project.slug, 'falsegreen');
  assert.equal(searchCatalog(catalog, 'git hook worktree routing')[0].project.slug, 'hookmatrix');
});

test('CLI returns human and machine-readable recommendations', async () => {
  const human = await run(process.execPath, [cli, 'find', 'handoff', 'work']);
  assert.match(human.stdout, /agentbrief/);
  const machine = await run(process.execPath, [cli, 'show', 'stillgreen', '--json']);
  assert.equal(JSON.parse(machine.stdout).category, 'verification');
  const categories = await run(process.execPath, [cli, 'categories']);
  assert.match(categories.stdout, /security/);
  const recipe = await run(process.execPath, [cli, 'recipe', 'secure-handoff']);
  assert.match(recipe.stdout, /1\. promptshield/);
  assert.match(recipe.stdout, /3\. agentbrief/);
  const runReview = await run(process.execPath, [cli, 'recipe', 'agent-run-review']);
  assert.match(runReview.stdout, /2\. traceproof/);
  assert.match(runReview.stdout, /4\. diffstory/);
  const ciTrust = await run(process.execPath, [cli, 'recipe', 'github-ci-trust']);
  assert.match(ciTrust.stdout, /1\. falsegreen/);
  assert.match(ciTrust.stdout, /3\. stillgreen/);
  const worktreeProof = await run(process.execPath, [cli, 'recipe', 'worktree-proof']);
  assert.match(worktreeProof.stdout, /1\. hookmatrix/);
  assert.match(worktreeProof.stdout, /3\. agentbrief/);
});

test('source installation is explicit and rejects incomplete or unpinned entries', async () => {
  const catalog = JSON.parse(await fs.readFile(new URL('../catalog.json', import.meta.url), 'utf8'));
  const source = catalog.projects.find((project) => project.slug === 'hyperconsciousness');
  assert.equal(searchCatalog(catalog, 'encrypted knowledge')[0].project.slug, source.slug);
  for (const change of [
    { installation: undefined }, { installation: { ...source.installation, type: 'anything' } },
    { installation: { ...source.installation, prerequisites: [] } },
    { installation: { ...source.installation, platforms: [] } },
    { installation: { ...source.installation, ref: 'main' } },
    { installation: { ...source.installation, documentation: '' } },
    { command: 'hc --help' }, { safety: '' }, { license: '' }, { status: '' },
  ]) assert.throws(() => validateInstallation({ ...source, ...change }));
  const legacy = catalog.projects.filter((project) => !project.installation);
  assert.ok(legacy.every((project) => project.command.includes('#v1')));
  const human = await run(process.execPath, [cli, 'show', source.slug]);
  assert.match(human.stdout, /installation: rust-source/);
  assert.match(human.stdout, /requires: Rust/);
  assert.match(human.stdout, /safety: Source installation/);
  assert.ok(human.stdout.includes(source.command));
  const machine = await run(process.execPath, [cli, 'show', source.slug, '--json']);
  assert.deepEqual(JSON.parse(machine.stdout), source);
});

import test from 'node:test';
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
  assert.ok(catalog.projects.every((project) => project.command.includes('#v1')));
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
});

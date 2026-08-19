import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('catalog has unique, runnable project entries', async () => {
  const catalog = JSON.parse(await fs.readFile(new URL('../catalog.json', import.meta.url), 'utf8'));
  assert.equal(catalog.schema, 'awesome-agent-infra/v1');
  assert.equal(new Set(catalog.projects.map((project) => project.slug)).size, catalog.projects.length);
  assert.ok(catalog.projects.every((project) => project.command.includes('#v1')));
  assert.ok(catalog.projects.some((project) => project.category === 'security'));
});

/**
 * Which regions to use for the next statement: for each country, the ones not used for the longest
 * time (never used first). The standard format per statement (docs/EDITORIAL.md): 2 Swiss, 2 French,
 * 2 American, 1 British, plus the American President and the three diplomats.
 *
 *   npm run regions
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadStatements } from '../src/site/content.js';
import { COUNTRIES, regionsOf } from '../content/regions.js';

export const FORMAT = { switzerland: 2, france: 2, 'united-states': 2, 'united-kingdom': 1 };

export function nextRegions(statements, format = FORMAT) {
  // by publication date (a post can be added days after it was written), then by the post’s own time
  const stamp = (s) => `${s.published} ${s.original.date}T${s.original.time || "00:00"}`;
  const lastUsed = (id) => statements.filter((s) => s.editions?.[id]).map(stamp).sort().pop() || '';
  return Object.fromEntries(Object.entries(format).map(([country, n]) => [
    country,
    regionsOf(country)
      .map((r) => ({ id: r.id, name: r.name, last: lastUsed(r.id) }))
      .sort((a, b) => a.last.localeCompare(b.last))
      .slice(0, n),
  ]));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const picks = nextRegions(loadStatements(path.join(root, 'content/statements')));
  for (const [country, list] of Object.entries(picks)) {
    const name = COUNTRIES.find((c) => c.id === country).name;
    console.log(`${name}: ${list.map((r) => `${r.name} (${r.last ? `last ${r.last.slice(0, 10)}` : 'never used'})`).join(', ')}`);
  }
  console.log('Diplomat: The British Diplomat, The French Diplomat, The Swiss President (always)');
}

import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadStatements, validateStatement, splitByAge } from '../src/site/content.js';
import { REGIONS } from '../content/regions.js';
import { dayNumber, editionIndex } from '../src/site/rotation.js';

const statements = loadStatements(path.resolve('content/statements'));

describe('content', () => {
  it('every published statement is valid and sourced', () => {
    expect(statements.length).toBeGreaterThan(0);
    for (const s of statements) {
      expect(validateStatement(s)).toEqual([]);
      expect(s.original.source.label).toBeTruthy();
    }
  });

  it('a statement without a source is refused', () => {
    const s = structuredClone(statements[0]);
    delete s.original.source;
    expect(validateStatement(s).join()).toMatch(/source/);
  });

  it('every regional version has an English adaptation', () => {
    for (const s of statements) {
      for (const [id, ed] of Object.entries(s.editions)) {
        expect(REGIONS.map((r) => r.id)).toContain(id);
        expect(ed.en.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('archives', () => {
  it('keeps the last three days on the front page and archives the rest', () => {
    const mk = (slug, date) => ({ slug, original: { date } });
    const list = [mk('a', '2026-11-07'), mk('b', '2026-11-05'), mk('c', '2026-11-04')];
    const { recent, archived } = splitByAge(list, '2026-11-07');
    expect(recent.map((s) => s.slug)).toEqual(['a', 'b']);
    expect(archived.map((s) => s.slug)).toEqual(['c']);
    expect(splitByAge(list, '2027-01-01').recent).toHaveLength(3); // nothing new: keep the latest
  });
});

describe('edition of the day', () => {
  it('is the same for a given date, and changes from one day to the next', () => {
    const d = dayNumber(new Date('2026-11-06T12:00:00Z'), { utc: true });
    expect(editionIndex(3, d)).toBe(editionIndex(3, d));
    expect(editionIndex(3, d + 1)).not.toBe(editionIndex(3, d));
    expect(editionIndex(0, d)).toBe(-1);
  });
});

describe('build', () => {
  it('writes one page per article and per regional edition, and never marks an adaptation as a quote', async () => {
    process.env.OUT_DIR = mkdtempSync(path.join(tmpdir(), 'bbf-'));
    const { build } = await import('../scripts/build.mjs');
    const { out } = build({ date: '2026-11-06' });
    for (const s of statements) {
      expect(existsSync(path.join(out, 'statements', s.slug, 'index.html'))).toBe(true);
      for (const id of Object.keys(s.editions)) {
        const html = readFileSync(path.join(out, 'statements', s.slug, id, 'index.html'), 'utf8');
        expect(html).toContain('An independent satirical project');
        // only the original goes in a <blockquote>; the regional text is never presented as a quotation
        expect(html).toContain('class="post post--original"');
        const quotes = html.match(/<blockquote[\s\S]*?<\/blockquote>/g) || [];
        expect(quotes.length).toBe(1);
        expect(quotes.join()).not.toContain(s.editions[id].en[0].slice(0, 30));
      }
    }
    const home = readFileSync(path.join(out, 'index.html'), 'utf8');
    expect(home).toContain('Making presidential statements presidential again.');
    expect(readFileSync(path.join(out, 'sitemap.xml'), 'utf8')).toContain('/switzerland/vaudois/');
  });
});

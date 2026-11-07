/**
 * Loads and checks the statements (content/statements/*.json).
 * Only `status: "published"` statements reach the site: drafts and AI output waiting for review never do.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REGIONS, getRegion } from '../../content/regions.js';

export const STATUSES = ['draft', 'review', 'approved', 'published'];

/** Problems with one statement, as readable strings (empty when it is fine). */
export function validateStatement(s, file = s?.slug) {
  const errors = [];
  const need = (cond, msg) => cond || errors.push(`${file}: ${msg}`);
  need(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.slug || ''), 'slug must be lowercase words joined by hyphens');
  need(STATUSES.includes(s.status), `status must be one of ${STATUSES.join(', ')}`);
  need(/^\d{4}-\d{2}-\d{2}$/.test(s.published || ''), 'published must be a YYYY-MM-DD date');
  need(typeof s.headline === 'string' && s.headline.length > 0, 'headline is required');
  const o = s.original || {};
  need(o.speaker, 'original.speaker is required');
  need(/^\d{4}-\d{2}-\d{2}$/.test(o.date || ''), 'original.date must be a YYYY-MM-DD date');
  need(Array.isArray(o.text) && o.text.length > 0, 'original.text must be a list of paragraphs');
  need(o.medium, 'original.medium is required (where it was said or posted)');
  need(o.source && o.source.label, 'original.source.label is required: no source, no statement');
  need(s.presidential && Array.isArray(s.presidential.en) && s.presidential.en.length, 'presidential.en is required');
  for (const [id, ed] of Object.entries(s.editions || {})) {
    need(getRegion(id), `edition "${id}" is not a region declared in content/regions.js`);
    need(Array.isArray(ed.fr) && ed.fr.length, `editions.${id}.fr is required`);
    need(Array.isArray(ed.en) && ed.en.length, `editions.${id}.en (English adaptation) is required`);
  }
  return errors;
}

export function loadStatements(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const all = files.map((f) => {
    const data = JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
    const errors = validateStatement(data, f);
    if (errors.length) throw new Error(`Invalid statement:\n  ${errors.join('\n  ')}`);
    if (`${data.slug}.json` !== f) throw new Error(`${f}: file name must be <slug>.json (${data.slug}.json)`);
    return data;
  });
  return all.filter((s) => s.status === 'published').sort(newestFirst);
}

/** Newest statement first: by the date and time it was originally said or posted. */
const stamp = (s) => `${s.original.date}T${s.original.time || '00:00'}`;
export function newestFirst(a, b) {
  return stamp(b).localeCompare(stamp(a)) || a.slug.localeCompare(b.slug);
}

/** The front page shows the latest `count` statements; all of them also stay in the archives. */
export function splitLatest(statements, count = 5) {
  return { recent: statements.slice(0, count), archived: statements.slice(count) };
}

/** The statement's editions for one country, in the order of content/regions.js. */
export function editionsFor(statement, countryId) {
  return REGIONS.filter((r) => r.country === countryId && statement.editions?.[r.id]).map((region) => ({
    region,
    edition: statement.editions[region.id],
  }));
}

export function leadStatement(statements) {
  return statements.find((s) => s.featured) || statements[0];
}

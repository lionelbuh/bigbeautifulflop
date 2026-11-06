/**
 * Starts a new statement as a draft: npm run new -- <slug>
 * Fills in the structure; the editor pastes the original verbatim, adds its source, then writes
 * (or has AI draft) the adaptations. Drafts never appear on the site until status is "published".
 */
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug || '')) {
  console.error('Usage: npm run new -- <slug>   (lowercase words joined by hyphens, e.g. tariffs-are-beautiful)');
  process.exit(1);
}
const file = path.resolve('content/statements', `${slug}.json`);
if (existsSync(file)) {
  console.error(`${file} already exists.`);
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
const draft = {
  slug,
  status: 'draft',
  published: today,
  headline: '',
  dek: '',
  original: {
    speaker: 'Donald J. Trump',
    channel: 'Truth Social',
    medium: 'Truth Social, @realDonaldTrump',
    date: today,
    text: ['PASTE THE ORIGINAL VERBATIM, ONE PARAGRAPH PER ITEM'],
    context: '',
    source: { label: '', url: '' },
    verification: { status: 'to-verify', note: '' },
  },
  presidential: { en: [], fr: [], changes: [] },
  editions: {},
};
writeFileSync(file, `${JSON.stringify(draft, null, 2)}\n`);
console.log(`Created ${path.relative(process.cwd(), file)} (status: draft).`);

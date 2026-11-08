/**
 * What gets posted on each network for a statement: pure functions (tested in tests/social.test.js).
 * Every post keeps the original apart (quoted, attributed) and labels the rest as satire.
 *
 * - Bluesky (300 characters a post) and Threads (500): a short thread: the original, the American
 *   President, one satirical version, then the link to all versions.
 * - Facebook: one post with the link (the page preview shows the share image).
 * - Instagram: a caption for the carousel of images (see scripts/og-images.mjs).
 */
import { REGIONS, getCountry } from '../../content/regions.js';

export const SITE_URL = 'https://bigbeautifulflop.com';
export const articleUrl = (s) => `${SITE_URL}/statements/${s.slug}/`;
export const SATIRE_NOTE = 'Independent satire: only the original is a quotation.';

const chars = (t) => [...t].length;

/** Text cut at a word boundary to fit `max` characters, with an ellipsis when cut. */
export function excerpt(paragraphs, max) {
  const text = (Array.isArray(paragraphs) ? paragraphs.join(' ') : paragraphs).replace(/\s+/g, ' ').trim();
  if (chars(text) <= max) return text;
  const cut = [...text].slice(0, Math.max(0, max - 1)).join('');
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, '')}…`;
}

/** The English text of a version: the adaptation of a French version, an English version as written. */
export function englishOf(region, edition) {
  return region.lang.startsWith('fr') ? edition.en || edition.text : edition.text;
}

/** "Valaisan (Switzerland)", "Texas (United States)", "The British Diplomat". */
export function regionLabel(region) {
  const country = getCountry(region.country).name;
  return region.country === 'diplomat' || region.name.includes(country) ? region.name : `${region.name} (${country})`;
}

/** The versions of a statement, in a stable order: Swiss and French first, then US, UK, diplomats. */
export function versionsOf(s) {
  return REGIONS.filter((r) => s.editions?.[r.id]).map((region) => ({ region, edition: s.editions[region.id] }));
}

/** The satirical version that opens the thread: Swiss or French if there is one (the site's signature). */
export function leadSatire(s) {
  const list = versionsOf(s).filter((v) => v.region.country !== 'diplomat');
  return list.find((v) => ['switzerland', 'france'].includes(v.region.country)) || list[0] || null;
}

const quote = (t) => `“${t}”`;

/** Bluesky and Threads: the posts of the thread (the link goes in the last one, and in the card). */
export function threadPosts(s, max) {
  const url = articleUrl(s);
  const head = `${s.headline}\n\nTrump on Truth Social:\n`;
  const posts = [`${head}${quote(excerpt(s.original.text, max - chars(head) - 2))}`];
  const pHead = 'How a statesmanlike American President would have said it (satire):\n';
  posts.push(`${pHead}${quote(excerpt(s.presidential.en, max - chars(pHead) - 2))}`);
  const lead = leadSatire(s);
  if (lead) {
    const lHead = `${regionLabel(lead.region)}, in English (satire):\n`;
    posts.push(`${lHead}${quote(excerpt(englishOf(lead.region, lead.edition), max - chars(lHead) - 2))}`);
  }
  const n = versionsOf(s).length + 1;
  const last = `All ${n} versions, Swiss, French, American, British and diplomatic: ${url}\n\n${SATIRE_NOTE}`;
  posts.push(chars(last) <= max ? last : `All ${n} versions: ${url}`);
  return posts;
}

/** Facebook page post: one message with the link. */
export function facebookPost(s) {
  const lead = leadSatire(s);
  const parts = [
    s.headline,
    `Trump on Truth Social: ${quote(excerpt(s.original.text, 600))}`,
    `How a statesmanlike American President would have said it: ${quote(excerpt(s.presidential.en, 500))}`,
    lead ? `${regionLabel(lead.region)} (satire): ${quote(excerpt(englishOf(lead.region, lead.edition), 400))}` : '',
    `All ${versionsOf(s).length + 1} versions: ${articleUrl(s)}`,
    SATIRE_NOTE,
  ];
  return { message: parts.filter(Boolean).join('\n\n'), link: articleUrl(s) };
}

/** Instagram caption (2,200 characters at most; links are not clickable there). */
export function instagramCaption(s) {
  const caption = [
    s.headline,
    `Trump on Truth Social: ${quote(excerpt(s.original.text, 700))}`,
    'Swipe for the presidential version, the Swiss, French, American and British versions, and three diplomats.',
    `All versions: bigbeautifulflop.com (link in bio)`,
    SATIRE_NOTE,
    '#Trump #Satire #Politics #Switzerland #France #Diplomacy',
  ].join('\n\n');
  return excerpt(caption, 2200);
}

/**
 * The cards of the Instagram carousel, two per image: the original and a satire, the American
 * President and a version, then the others two by two (10 images at most, the last one being the
 * closing card).
 */
export function carouselCards(s) {
  const versions = versionsOf(s);
  const lead = leadSatire(s);
  const others = versions.filter((v) => v.region.id !== lead?.region.id);
  const card = ({ region, edition }) => ({
    kind: region.country === 'diplomat' ? 'diplomat' : 'satire',
    label: regionLabel(region),
    text: excerpt(englishOf(region, edition), 300),
    local: region.lang.startsWith('fr') ? excerpt(edition.text, 170) : null,
    chip: region.chip,
  });
  const cards = [
    { kind: 'original', label: 'Donald J. Trump · Truth Social', text: excerpt(s.original.text, 420) },
    ...(lead ? [card(lead)] : []),
    { kind: 'presidential', label: 'The American President', text: excerpt(s.presidential.en, 360) },
    ...others.map(card),
  ];
  const slides = [];
  for (let i = 0; i < cards.length && slides.length < 9; i += 2) slides.push(cards.slice(i, i + 2));
  return slides;
}

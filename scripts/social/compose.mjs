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

/** Versions of one country, in the site's order. */
const ofCountry = (s, country) => versionsOf(s).filter((v) => v.region.country === country);

export const PRESIDENTIAL_LABEL = 'The presidential version: how a statesmanlike president would say it';

/**
 * One French version in one post: the French text in full (cut only if the network’s limit requires
 * it), then a short English line if there is room left.
 */
function frenchPost(flag, v, max) {
  const head = `${flag} ${regionLabel(v.region)}, satire:\n`;
  const fr = quote(excerpt(v.edition.text, max - chars(head) - 2));
  const left = max - chars(head) - chars(fr) - chars('\n\nIn English: ') - 2;
  const en = v.edition.en?.length && left >= 60 ? `\n\nIn English: ${quote(excerpt(v.edition.en, left))}` : '';
  return `${head}${fr}${en}`;
}

/**
 * Bluesky and Threads: a thread of seven posts. Trump and the American President side by side, one
 * American or British satire, two Swiss and two French (one per post, in French), then the link.
 */
export const THREADS_TOPIC = '#PoliticalSatire';
export const BLUESKY_TAGS = '#Trump #PoliticalSatire #Satire';

/** Threads: one topic tag on the first post. Bluesky: three hashtags on the last post. */
export function threadFor(network, s) {
  if (network === 'threads') return threadPosts(s, 500, { firstTag: THREADS_TOPIC });
  return threadPosts(s, 300, { lastTag: BLUESKY_TAGS });
}

export function threadPosts(s, max, { firstTag = '', lastTag = '' } = {}) {
  const url = articleUrl(s);
  const head = `${s.headline}\n\nTrump on Truth Social: `;
  const mid = `\n\n${PRESIDENTIAL_LABEL} (satire): `;
  const tail = firstTag ? `\n\n${firstTag}` : '';
  const room = max - chars(head) - chars(mid) - chars(tail) - 4;
  const trumpRoom = Math.floor(room * 0.55);
  const posts = [`${head}${quote(excerpt(s.original.text, trumpRoom))}${mid}${quote(excerpt(s.presidential.en, room - trumpRoom))}${tail}`];
  const anglo = [...ofCountry(s, 'united-states'), ...ofCountry(s, 'united-kingdom')][0];
  if (anglo) {
    const h = `${regionLabel(anglo.region)}, satire: `;
    posts.push(`${h}${quote(excerpt(anglo.edition.text, max - chars(h) - 2))}`);
  }
  for (const v of ofCountry(s, 'switzerland').slice(0, 2)) posts.push(frenchPost('🇨🇭', v, max));
  for (const v of ofCountry(s, 'france').slice(0, 2)) posts.push(frenchPost('🇫🇷', v, max));
  const n = versionsOf(s).length + 1;
  const tags = lastTag ? `\n\n${lastTag}` : '';
  const last = `All ${n} versions, with three diplomats (British, French, Swiss): ${url}\n\n${SATIRE_NOTE}${tags}`;
  posts.push(chars(last) <= max ? last : `All ${n} versions: ${url}${tags}`);
  return posts;
}

/** Facebook page post: one message with the link. */
export function facebookPost(s) {
  const lead = leadSatire(s);
  const parts = [
    s.headline,
    `Trump on Truth Social: ${quote(excerpt(s.original.text, 600))}`,
    `${PRESIDENTIAL_LABEL}: ${quote(excerpt(s.presidential.en, 500))}`,
    lead ? `${regionLabel(lead.region)} (satire): ${quote(excerpt(englishOf(lead.region, lead.edition), 400))}` : '',
    `All ${versionsOf(s).length + 1} versions: ${articleUrl(s)}`,
    SATIRE_NOTE,
  ];
  return { message: parts.filter(Boolean).join('\n\n'), link: articleUrl(s) };
}

/**
 * Instagram caption (2,200 characters at most; links are not clickable there). No hashtags: Instagram
 * reads the words of the caption, so it names what the post is about plainly.
 */
export function instagramCaption(s) {
  const caption = [
    s.headline,
    `Donald Trump on Truth Social: ${quote(excerpt(s.original.text, 700))}`,
    'Swipe for the presidential version (how a statesmanlike president would say it), then the same message as political satire from Switzerland, France, the United States and the United Kingdom, and from three diplomats: British, French and Swiss.',
    'All versions on bigbeautifulflop.com (link in bio).',
    SATIRE_NOTE,
  ].join('\n\n');
  return chars(caption) <= 2200 ? caption : excerpt(caption, 2200);
}

/**
 * The Instagram carousel, one image per group: Trump and the American President; the Swiss versions;
 * the French; the American and British; the diplomats. (The closing image is added by the renderer.)
 */
export function carouselCards(s) {
  // French versions: the French text in full (the flavour), the English as a shorter summary;
  // English versions: the text itself.
  const card = ({ region, edition }, size) => {
    const french = region.lang.startsWith('fr');
    return {
      kind: region.country === 'diplomat' ? 'diplomat' : 'satire',
      label: regionLabel(region),
      local: french ? excerpt(edition.text, 520) : null,
      text: excerpt(englishOf(region, edition), french ? 170 : size),
      chip: region.chip,
    };
  };
  const groups = [
    ofCountry(s, 'switzerland').slice(0, 2),
    ofCountry(s, 'france').slice(0, 2),
    [...ofCountry(s, 'united-states').slice(0, 2), ...ofCountry(s, 'united-kingdom').slice(0, 1)],
    ofCountry(s, 'diplomat'),
  ].filter((g) => g.length);
  return [
    [
      { kind: 'original', label: 'Donald J. Trump · Truth Social', text: excerpt(s.original.text, 420) },
      { kind: 'presidential', label: 'The American President', note: PRESIDENTIAL_LABEL, text: excerpt(s.presidential.en, 360) },
    ],
    ...groups.map((g) => g.map((v) => card(v, g.length > 2 ? 300 : 360))),
  ];
}

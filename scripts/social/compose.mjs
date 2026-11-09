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

/* ---------------- videos ---------------- */

/** The video series, in their order of rotation. */
export const VIDEO_SERIES = [
  { id: 'diplomat', kicker: 'The Diplomat Desk', countries: ['diplomat'], prefer: ['british-diplomat'], lang: 'en', box: 'What he really means' },
  { id: 'swiss', kicker: 'Le Suisse de la semaine', countries: ['switzerland'], lang: 'fr', box: 'In English' },
  { id: 'uk', kicker: 'Meanwhile in Britain', countries: ['united-kingdom'], lang: 'en', box: 'In plain English' },
  { id: 'france', kicker: 'Pendant ce temps en France', countries: ['france'], lang: 'fr', box: 'In English' },
  { id: 'us', kicker: 'Across America', countries: ['united-states'], lang: 'en', box: 'In plain English' },
];

/** The version a series shows for a statement (null if the statement has none in that series). */
export function seriesVersion(s, series) {
  const list = versionsOf(s).filter((v) => series.countries.includes(v.region.country));
  if (series.prefer) return list.find((v) => series.prefer.includes(v.region.id) && v.edition.en?.length) || null;
  return list.find((v) => v.edition.en?.length) || null;
}

/**
 * The two video series of a statement: the first one, from position `start` of VIDEO_SERIES, that the
 * statement has a version for, then the next one in the other language, so that there is always one
 * video in English and one in French (when the statement has both). The renderer keeps the position in
 * content/social/video-rotation.json, so series take turns from one statement to the next.
 */
export function videoSeriesFor(s, start = 0) {
  const n = VIDEO_SERIES.length;
  const from = (i, ok) => {
    for (let k = 0; k < n; k += 1) {
      const series = VIDEO_SERIES[(i + k) % n];
      if (ok(series) && seriesVersion(s, series)) return series;
    }
    return null;
  };
  const first = from(start, () => true);
  if (!first) return [];
  const at = VIDEO_SERIES.indexOf(first) + 1;
  const second = from(at, (x) => x.lang !== first.lang) || from(at, (x) => x !== first);
  return second ? [first, second] : [first];
}

/** Text of the second video's post (posted about four hours after the first). */
export function secondVideoPost(s, series, max, tags = '') {
  const v = seriesVersion(s, series);
  const head = `${series.kicker}: ${s.headline}`;
  const body = `${regionLabel(v.region)} (satire), then Trump’s original and the presidential version.`;
  const tail = `All versions: ${articleUrl(s)}\n\n${SATIRE_NOTE}${tags ? `\n\n${tags}` : ''}`;
  const full = `${head}\n\n${body}\n\n${tail}`;
  return chars(full) <= max ? full : `${head}\n\n${tail}`.slice(0, max);
}

export const SOCIAL_NETWORKS = ['bluesky', 'threads', 'facebook', 'instagram'];

/**
 * Whether a statement still needs its videos: published since `start` and not posted yet on some
 * network, or posted with video 1 and still waiting for video 2. Other statements keep no video files.
 */
export function videosPending(s, log, start) {
  if (!(s.published >= start)) return false;
  const entry = log?.[s.slug] || {};
  return SOCIAL_NETWORKS.some((name) => !entry[name] || (entry[name].video && !entry[`${name}:video2`]));
}

/** The title card that opens a video: in the version's language, with an English line under it. */
const VIDEO_TITLES = {
  vaudois: ['Les Vaudoiseries de Trump', 'in Vaud'],
  valaisan: ['Trump à la valaisanne', 'in Valais'],
  genevois: ['Trump à la genevoise', 'in Geneva'],
  fribourgeois: ['Trump à la fribourgeoise', 'in Fribourg'],
  neuchatelois: ['Trump à la neuchâteloise', 'in Neuchâtel'],
  parisien: ['Trump à la parisienne', 'in Paris'],
  sud: ['Trump avec l’accent du Sud', 'in the South of France'],
  chti: ['Trump chez les Ch’tis', 'in the North of France'],
  lyonnais: ['Trump à la lyonnaise', 'in Lyon'],
  breton: ['Trump à la bretonne', 'in Brittany'],
  'new-york': ['Trump, New York style', 'in New York'],
  texas: ['Trump, Texas style', 'in Texas'],
  'deep-south': ['Trump, Deep South style', 'in the Deep South'],
  california: ['Trump, California style', 'in California'],
  boston: ['Trump, Boston style', 'in Boston'],
  midwest: ['Trump, Midwest style', 'in the Midwest'],
  london: ['Trump, London style', 'in London'],
  liverpool: ['Trump, Scouse style', 'in Liverpool'],
  manchester: ['Trump, Manc style', 'in Manchester'],
  yorkshire: ['Trump, Yorkshire style', 'in Yorkshire'],
  scotland: ['Trump, Scottish style', 'in Scotland'],
  wales: ['Trump, Welsh style', 'in Wales'],
};

export function videoTitle(s, series) {
  if (series.id === 'diplomat') return { title: 'Trump and the Diplomats', sub: 'The same post, the diplomatic way' };
  const { region } = seriesVersion(s, series);
  const [title, where] = VIDEO_TITLES[region.id] || [`Trump, ${region.name} style`, `in ${region.name}`];
  return { title, sub: `The same post, retold ${where}` };
}

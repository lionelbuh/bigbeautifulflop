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
import { CANTONS } from '../../src/site/cantons.js';

export const SITE_URL = 'https://bigbeautifulflop.com';
/** The article’s address; `source` marks where the visitor came from (utm_source, for the visit counts). */
export const articleUrl = (s, source = '') => `${SITE_URL}/statements/${s.slug}/${source ? `?utm_source=${source}` : ''}`;
const siteUrl = (source = '') => `${SITE_URL}/${source ? `?utm_source=${source}` : ''}`;
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
export const NEUTRAL_LABEL = 'The Neutral Swiss: the same message, the neutral way';

/** The calm version: the Neutral Swiss (from November 2026) or, earlier, the presidential version. */
export function calmOf(s) {
  if (s.episode) return { label: 'Swiss Neutrality', short: 'Swiss Neutrality', en: s.neutral.en, key: s.neutral.key };
  return s.neutral
    ? { label: NEUTRAL_LABEL, short: 'The Neutral Swiss', en: s.neutral.en, key: s.neutral.key }
    : { label: PRESIDENTIAL_LABEL, short: 'The presidential version', en: s.presidential.en, key: s.presidential.key };
}

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
  if (network === 'threads') return threadPosts(s, 500, { firstTag: THREADS_TOPIC, source: 'threads' });
  return threadPosts(s, 300, { lastTag: BLUESKY_TAGS, source: 'bluesky' });
}

/** Episode lines without the *emphasis* marks. */
const plain = (list) => list.map((x) => x.replace(/\*/g, ''));

export function threadPosts(s, max, { firstTag = '', lastTag = '', source = '' } = {}) {
  const url = articleUrl(s, source);
  const head = `${s.headline}\n\nTrump on Truth Social: `;
  const mid = `\n\n${calmOf(s).label} (satire): `;
  const tail = firstTag ? `\n\n${firstTag}` : '';
  const room = max - chars(head) - chars(mid) - chars(tail) - 4;
  const trumpRoom = Math.floor(room * 0.55);
  // the Swiss format quotes the key line (word for word), the earlier one the start of the post
  const said = s.neutral && s.original.key ? s.original.key : s.original.text;
  const posts = [`${head}${quote(excerpt(said, trumpRoom))}${mid}${quote(excerpt(calmOf(s).en, room - trumpRoom))}${tail}`];
  const anglo = [...ofCountry(s, 'united-states'), ...ofCountry(s, 'united-kingdom')][0];
  if (anglo) {
    const h = `${regionLabel(anglo.region)}, satire: `;
    posts.push(`${h}${quote(excerpt(anglo.edition.text, max - chars(h) - 2))}`);
  }
  if (s.episode) {
    const h = `🇨🇭 ${CANTONS[s.episode.canton].name} (satire): `;
    posts.push(`${h}${quote(excerpt(plain(s.episode.reaction), max - chars(h) - 2))}`);
  }
  for (const v of ofCountry(s, 'switzerland').slice(0, 2)) posts.push(frenchPost('🇨🇭', v, max));
  for (const v of ofCountry(s, 'france').slice(0, 2)) posts.push(frenchPost('🇫🇷', v, max));
  const n = versionsOf(s).length + 1;
  const tags = lastTag ? `\n\n${lastTag}` : '';
  const last = s.episode
    ? `${plain(s.episode.tagline || []).join(' ')}\n\nThe full episode: ${url}\n\n${SATIRE_NOTE}${tags}`
    : s.neutral
    ? `Trump’s post, made neutral, and the cantons: ${url}\n\n${SATIRE_NOTE}${tags}`
    : `All ${n} versions, with three diplomats (British, French, Swiss): ${url}\n\n${SATIRE_NOTE}${tags}`;
  posts.push(chars(last) <= max ? last : `${s.episode ? 'The full episode' : `All ${n} versions`}: ${url}${tags}`);
  return posts;
}

/** Facebook page post: one message with the link. */
export function facebookPost(s) {
  const lead = leadSatire(s);
  const parts = [
    s.headline,
    `Trump on Truth Social: ${quote(excerpt(s.original.text, 600))}`,
    `${calmOf(s).label}: ${quote(excerpt(calmOf(s).en, 500))}`,
    lead ? `${regionLabel(lead.region)} (satire): ${quote(excerpt(englishOf(lead.region, lead.edition), 400))}` : '',
    s.episode ? `${CANTONS[s.episode.canton].name} (satire): ${quote(excerpt(plain(s.episode.reaction), 400))}` : '',
    s.episode ? `${plain(s.episode.tagline || []).join(' ')}\n\nThe full episode: ${articleUrl(s, 'facebook')}` : `All ${versionsOf(s).length + 1} versions: ${articleUrl(s, 'facebook')}`,
    SATIRE_NOTE,
  ];
  return { message: parts.filter(Boolean).join('\n\n'), link: articleUrl(s, 'facebook') };
}

/**
 * Instagram caption (2,200 characters at most; links are not clickable there). No hashtags: Instagram
 * reads the words of the caption, so it names what the post is about plainly.
 */
export function instagramCaption(s) {
  const caption = [
    s.headline,
    `Donald Trump on Truth Social: ${quote(excerpt(s.original.text, 700))}`,
    s.episode
      ? 'Switzerland has reviewed the request: Swiss Neutrality, then the reaction of a Swiss canton. Switzerland: neutral since 1815.'
      : s.neutral
      ? 'Then the same message, the neutral Swiss way, and as it would sound in the cantons of French-speaking Switzerland. Which canton does the best Trump? Tell us in the comments.'
      : 'Swipe for the presidential version (how a statesmanlike president would say it), then the same message as political satire from Switzerland, France, the United States and the United Kingdom, and from three diplomats: British, French and Swiss.',
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
      { kind: 'presidential', label: s.neutral ? 'The Neutral Swiss' : 'The American President', note: calmOf(s).label, text: excerpt(calmOf(s).en, 360) },
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

/** The Swiss format (from November 2026): two videos, one canton each. */
export const CANTON_SERIES = [
  { id: 'canton1', kicker: 'Certifié neutre', countries: ['switzerland'], nth: 0, lang: 'fr', box: 'In English' },
  { id: 'canton2', kicker: 'Certifié neutre', countries: ['switzerland'], nth: 1, lang: 'fr', box: 'In English' },
];
/** An episode (from 13 November 2026): one video, the post, Swiss Neutrality, one canton. */
export const EPISODE_SERIES = { id: 'episode', kicker: 'Switzerland has reviewed the request', countries: [], box: '' };
export const ALL_SERIES = [...VIDEO_SERIES, ...CANTON_SERIES, EPISODE_SERIES];

/** The version a series shows for a statement (null if the statement has none in that series). */
export function seriesVersion(s, series) {
  const list = versionsOf(s).filter((v) => series.countries.includes(v.region.country));
  if (series.nth != null) return list.filter((v) => v.edition.en?.length)[series.nth] || null;
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
  if (s.episode) return [EPISODE_SERIES];
  if (s.neutral) return CANTON_SERIES.filter((series) => seriesVersion(s, series));
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
export function secondVideoPost(s, series, max, tags = '', source = '') {
  const v = seriesVersion(s, series);
  const head = `${series.kicker}: ${s.headline}`;
  const body = s.neutral
    ? `Trump’s original, made neutral, then ${regionLabel(v.region)} (satire).`
    : `${regionLabel(v.region)} (satire), then Trump’s original and the presidential version.`;
  const tail = `All versions: ${articleUrl(s, source)}\n\n${SATIRE_NOTE}${tags ? `\n\n${tags}` : ''}`;
  const full = `${head}\n\n${body}\n\n${tail}`;
  return chars(full) <= max ? full : `${head}\n\n${tail}`.slice(0, max);
}

export const SOCIAL_NETWORKS = ['bluesky', 'threads', 'facebook', 'instagram'];

/**
 * Whether a statement still needs its videos: published since `start` and not posted yet on some
 * network, or posted with video 1 and still waiting for video 2. Other statements keep no video files.
 */
export function videosPending(s, log, start, youtubeStart = null) {
  if (!(s.published >= start)) return false;
  const entry = log?.[s.slug] || {};
  // an episode has a single video
  if (s.episode) return [...SOCIAL_NETWORKS, ...(youtubeStart && s.published >= youtubeStart ? ['youtube'] : [])].some((name) => !entry[name]);
  // YouTube counts only from the day it was switched on (content/social/config.json, youtubeStart)
  // (or for an older statement whose videos were sent to YouTube afterwards, by hand)
  const networks = (youtubeStart && s.published >= youtubeStart) || entry.youtube ? [...SOCIAL_NETWORKS, 'youtube'] : SOCIAL_NETWORKS;
  return networks.some((name) => !entry[name] || (entry[name].video && !entry[`${name}:video2`]));
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
  return regionTitle(seriesVersion(s, series).region);
}

/** “Les Vaudoiseries de Trump”, “Trump, Texas style”, with its English line. */
export function regionTitle(region) {
  const [title, where] = VIDEO_TITLES[region.id] || [`Trump, ${region.name} style`, `in ${region.name}`];
  return { title, sub: `The same post, retold ${where}` };
}

/* ---------------- YouTube Shorts ---------------- */

/**
 * The title of a Short (100 characters at most): the series’ title and the headline, or, in the short
 * format, a question (“What if Trump were from Vaud?”).
 */
export function youtubeTitle(s, series, { question = false } = {}) {
  if (series?.id === 'episode' || s.episode) {
    const t = `Switzerland has reviewed the request: ${s.headline} #Shorts`;
    return chars(t) <= 100 ? t : `${excerpt(`Switzerland has reviewed: ${s.headline}`, 91)} #Shorts`;
  }
  const where = series && series.id !== 'diplomat' ? regionTitle(seriesVersion(s, series).region).sub.replace(/^The same post, retold in /, '') : '';
  const ask = series?.id === 'diplomat' ? 'What would a diplomat say to Trump? ' : `What if Trump were from ${where}? `;
  const head = question && series ? ask : series ? `${videoTitle(s, series).title}: ` : '';
  const title = `${head}${s.headline} #Shorts`;
  return chars(title) <= 100 ? title : `${excerpt(`${head}${s.headline}`, 91)} #Shorts`;
}

/** The description of a Short: the original, the presidential version, the link. */
export function youtubeDescription(s, series) {
  const v = series && !s.episode ? seriesVersion(s, series) : null;
  return [
    `Donald Trump on Truth Social: ${quote(excerpt(s.original.text, 900))}`,
    `${calmOf(s).label} (satire): ${quote(excerpt(calmOf(s).en, 700))}`,
    v ? `Then: ${regionLabel(v.region)} (satire).` : '',
    s.episode ? `${CANTONS[s.episode.canton].name} (satire): ${quote(excerpt(plain(s.episode.reaction), 400))}` : '',
    s.episode ? plain(s.episode.tagline || []).join(' ') : '',
    `${s.episode ? 'The full episode' : 'All versions'}: ${articleUrl(s, 'youtube')}`,
    SATIRE_NOTE,
    '#PoliticalSatire #Satire',
  ].filter(Boolean).join('\n\n');
}

/* ---------------- the Sunday video ---------------- */

const addDays = (date, n) => new Date(Date.parse(`${date}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/**
 * The Sunday video: Trump’s post of the week with the presidential version, then one Swiss and one
 * French version (with a hook if possible, from other statements than the first when there are some).
 * `statements` newest first; `sunday` YYYY-MM-DD; `override` from content/social/weekly.json:
 * { "original": "<slug>", "swiss": "<slug>/<region>", "france": "<slug>/<region>" }.
 */
export function weeklyPicks(statements, sunday, override = {}) {
  const from = addDays(sunday, -6);
  const week = statements.filter((s) => s.published >= from && s.published <= sunday);
  if (!week.length) return null;
  const bySlug = (slug) => statements.find((s) => s.slug === slug);
  const ref = (r) => {
    const [slug, id] = (r || '').split('/');
    const s = bySlug(slug);
    return s?.editions?.[id] ? { s, ...versionsOf(s).find((v) => v.region.id === id) } : null;
  };
  const original = bySlug(override.original) || week.find((s) => s.featured) || week[0];
  const pick = (country, avoid) => {
    const all = week.flatMap((s) => versionsOf(s).filter((v) => v.region.country === country && v.edition.en?.length).map((v) => ({ s, ...v })));
    // a hook first, then another statement than the original, then than the Swiss version
    const score = (x) => (x.edition.hook ? 4 : 0) + (x.s.slug !== avoid[0] ? 2 : 0) + (x.s.slug !== avoid[1] ? 1 : 0);
    return all.sort((a, b) => score(b) - score(a))[0] || null;
  };
  const swiss = ref(override.swiss) || pick('switzerland', [original.slug]);
  const france = ref(override.france) || pick('france', [original.slug, swiss?.s.slug]);
  return { from, to: sunday, original, swiss, france };
}

const DAY = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });

/** The post that goes with the Sunday video. */
export function weeklyPost(p, max, tags = '', source = '') {
  const who = [p.swiss, p.france].filter(Boolean).map((v) => regionTitle(v.region).title);
  const head = `The Flop of the week (${DAY(p.from)} – ${DAY(p.to)}): Trump’s post and the presidential version${who.length ? `, then ${who.join(' and ')}` : ''}.`;
  const ask = who.length > 1 ? 'Switzerland or France: which one wins? Tell us in the comments.' : '';
  const tail = `All versions: ${siteUrl(source)}\n\n${SATIRE_NOTE}${tags ? `\n\n${tags}` : ''}`;
  const full = [head, ask, tail].filter(Boolean).join('\n\n');
  return chars(full) <= max ? full : `${excerpt(head, max - chars(tail) - 2)}\n\n${tail}`;
}

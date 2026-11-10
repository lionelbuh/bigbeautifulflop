/**
 * Every version of a statement is shown as a post card: the original, the American President's
 * version, then the four editorial sections as tabs (Switzerland & France, United States, United
 * Kingdom, The Diplomat). Light on purpose: no photo, no long explanations. The English adaptation of
 * each version sits behind a link ("English version", "In plain English", "What he really means").
 */
import { e, paras, formatDate, frenchSpacing } from './html.js';
import { chip, flag, SITE_URL } from './layout.js';
import { REGIONS, CATEGORIES, getCountry, englishLabel } from '../../content/regions.js';
import { editionsFor } from './content.js';
import { editionIndex } from './rotation.js';
import { regionTitle } from '../../scripts/social/compose.mjs';

export const articlePath = (s) => `/statements/${s.slug}/`;
export const editionPath = (s, region) => `/statements/${s.slug}/${region.id}/`;

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${SHORT_MONTHS[m - 1]} ${y}`;
}

/** "13:51" → "1:51 PM ET" (times are entered in US Eastern time, as published). */
function clock(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  return ` · ${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'} ET`;
}

const initials = (name) => name.replace(/\b[A-Z]\.\s*/g, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2);

/** The post card shared by all versions. */
function post({ variant, avatar, name, meta, badge, body, translate, translateLabel = 'English version', footer, lang }) {
  return `<article class="post post--${variant}">
  <header class="post-head">
    ${avatar}
    <p class="post-who"><span class="post-name">${name}</span><span class="post-meta">${meta}</span></p>
    <span class="post-badge">${badge}</span>
  </header>
  <div class="post-text"${lang ? ` lang="${lang}"` : ''}>${body}</div>
  ${translate ? `<details class="post-translate"><summary>${e(translateLabel)}</summary><div lang="en">${translate}</div></details>` : ''}
  ${footer ? `<footer class="post-foot">${footer}</footer>` : ''}
</article>`;
}

/** The original: verbatim, attributed and sourced. The only quotation on the site. */
export function originalPost(s) {
  const o = s.original;
  const source = o.source.url ? `<a href="${e(o.source.url)}" rel="noopener external">${e(o.source.label)}</a>` : e(o.source.label);
  const check = o.verification?.status !== 'verified' ? ' · <span class="verify-flag">wording to be checked</span>' : '';
  return post({
    variant: 'original',
    avatar: `<span class="avatar avatar--original" aria-hidden="true">${e(initials(o.speaker))}</span>`,
    name: e(o.speaker),
    meta: `${o.handle ? `${e(o.handle)} · ` : ''}${e(o.channel || o.medium)} · <time datetime="${o.date}">${shortDate(o.date)}${clock(o.time)}</time>`,
    badge: 'Original',
    body: `<blockquote cite="${e(o.source.url || '')}">${paras(o.text)}</blockquote>`,
    footer: `Source: ${source}${check}`,
  });
}

/** How a measured, statesmanlike president would have said it. */
export function presidentialPost(s) {
  const p = s.presidential;
  return post({
    variant: 'presidential',
    avatar: '<span class="avatar avatar--presidential" aria-hidden="true">★</span>',
    name: 'The American President',
    meta: 'The presidential version: how a statesmanlike president would say it',
    badge: 'Satire',
    body: paras(p.en),
    // the French presidential version, behind the same kind of link
    translate: null,
    footer: p.fr?.length ? `<details class="post-translate post-translate--inline"><summary>Version française</summary><div lang="fr">${paras(p.fr, '', { french: true })}</div></details>` : '',
  });
}

/** "Valaisan (Switzerland)", "Parisien (France)"; no country when the name already says it ("Sud de la France"). */
function regionLabel(region) {
  const country = getCountry(region.country).name;
  return region.country === 'diplomat' || region.name.includes(country) ? e(region.name) : `${e(region.name)} <span class="post-country">(${e(country)})</span>`;
}

/** One version (regional or diplomatic), with its English adaptation behind the region's link. */
export function regionalPost(s, region, { permalink = true, notes = false, english = false } = {}) {
  const ed = s.editions[region.id];
  const isFrench = region.lang.startsWith('fr');
  const noteList = notes && ed.notes?.length
    ? `<details class="post-translate post-translate--inline"><summary>Lost in translation</summary><ul>${ed.notes.map((n) => `<li>${e(n)}</li>`).join('')}</ul></details>`
    : '';
  const french = !isFrench && ed.fr?.length
    ? `<details class="post-translate post-translate--inline"><summary>Version française</summary><div lang="fr">${paras(ed.fr, '', { french: true })}</div></details>`
    : '';
  const draft = ed.review !== 'approved' ? '<span class="verify-flag">draft</span>' : '';
  const link = permalink ? `<a href="${editionPath(s, region)}">Permalink</a>` : '';
  const share = whatsappLink(s, region, ed);
  // English edition: the English adaptation of French versions; English-language versions as written
  const showEnglish = english && isFrench;
  const label = englishLabel(region);
  return post({
    variant: region.country === 'diplomat' ? 'diplomat' : 'regional',
    avatar: `<span class="avatar avatar--regional" aria-hidden="true" style="--chip-a:${region.chip[0]};--chip-b:${region.chip[1]}"></span>`,
    name: regionLabel(region),
    meta: e(region.place),
    badge: 'Satire',
    lang: showEnglish ? 'en' : region.lang,
    body: showEnglish ? paras(ed.en) : paras(ed.text, '', { french: isFrench }),
    translate: english || !label || !ed.en?.length ? null : paras(ed.en),
    translateLabel: label,
    footer: [link, share, draft].filter(Boolean).join(' · ') + french + noteList,
  });
}

/**
 * “Share on WhatsApp”: the version’s punchline (or its first words) and the link to its page, in the
 * version’s language. Opens WhatsApp (app or web) with the message ready; nothing is sent by the site.
 */
export function whatsappLink(s, region, ed) {
  const french = region.lang.startsWith('fr');
  const words = (ed.hook || '').replace(/\*/g, '') || cut(ed.text.join(' '), 160);
  const who = region.country === 'diplomat' ? region.name : regionTitle(region).title;
  const text = `« ${words} »\n— ${who} (satire)\n${SITE_URL}${editionPath(s, region)}?utm_source=whatsapp`.replace(/^« (.*) »/, french ? '« $1 »' : '“$1”');
  return `<a class="share-wa" href="https://wa.me/?text=${encodeURIComponent(text)}" rel="noopener" target="_blank">${french ? 'Partager sur WhatsApp' : 'Share on WhatsApp'}</a>`;
}

const cut = (t, max) => {
  const x = t.replace(/\s+/g, ' ').trim();
  if (x.length <= max) return x;
  const c = x.slice(0, max - 1);
  return `${c.slice(0, c.lastIndexOf(' ')).replace(/[\s,;:.–—-]+$/, '')}…`;
};

/**
 * The versions of a statement in the given countries, in the order of the day. `grouped` (for display):
 * country by country, each with today's region first. Otherwise (to pick a region to show first):
 * today's region of every country first, then the others.
 */
export function regionsInOrder(s, day, countries = ['switzerland', 'france'], { grouped = false } = {}) {
  const first = [];
  const rest = [];
  const groups = [];
  for (const country of countries) {
    const list = editionsFor(s, country).map((x) => x.region);
    // the statesmen keep a fixed order; the regions take turns opening their country
    const i = country === 'diplomat' ? Math.min(0, list.length - 1) : editionIndex(list.length, day);
    if (i >= 0) groups.push([list[i], ...list.filter((_, j) => j !== i)]);
    list.forEach((r, j) => (j === i ? first : rest).push(r));
  }
  return grouped ? groups.flat() : [...first, ...rest];
}

/**
 * The four editorial sections of a statement as tabs. All four are always shown; a section without
 * versions yet is greyed out ("coming soon"). The same tabs are repeated below the versions, so
 * readers can switch section without scrolling back up.
 */
function sectionTabs(s, { day, first, idPrefix }) {
  const sections = CATEGORIES.map((cat) => {
    // country by country; the region chosen to open the statement leads, with its country first
    const lead = REGIONS.find((r) => r.id === first && cat.countries.includes(r.country));
    const countries = lead ? [lead.country, ...cat.countries.filter((c) => c !== lead.country)] : cat.countries;
    let list = regionsInOrder(s, day, countries, { grouped: true });
    if (lead && list.includes(lead)) list = [lead, ...list.filter((r) => r !== lead)];
    return { cat, list };
  });
  const open = sections.findIndex((x) => x.list.length);
  if (open < 0) return '';
  const flags = (cat) => cat.flags.map((f) => flag(f)).join('');
  const tabs = (where) => sections.map(({ cat, list }, i) => {
    const inner = `<span class="sections-flags">${flags(cat)}</span><span class="sections-name">${e(cat.name)}</span>`;
    if (!list.length) return `<span class="sections-tab sections-tab--soon" aria-disabled="true">${inner}<span class="sections-soon">Coming soon</span></span>`;
    const id = `${idPrefix}-${where}-${cat.id}`;
    return `<button type="button" role="tab" class="sections-tab" id="${id}" aria-controls="${idPrefix}-${cat.id}" aria-selected="${i === open}" tabindex="${i === open ? 0 : -1}">${inner}<span class="sections-count">${list.length}</span></button>`;
  }).join('');
  const panels = sections.filter((x) => x.list.length).map(({ cat, list }) => `<section class="sections-panel" role="tabpanel" id="${idPrefix}-${cat.id}" aria-labelledby="${idPrefix}-top-${cat.id}"${cat === sections[open].cat ? '' : ' data-inactive'}>
    <p class="thread-step sections-heading">${flags(cat)} ${e(cat.name)}</p>
    ${cat.id === 'diplomat' ? '<p class="sections-note">The American President is just above. Here, the other statesmen.</p>' : ''}
    ${list.map((r) => regionalPost(s, r)).join('')}
  </section>`).join('');
  return `<div class="sections" data-tabs>
  <p class="thread-step">Around the world</p>
  <div class="sections-tabs" role="tablist" aria-label="Editorial sections">${tabs('top')}</div>
  ${panels}
  <div class="sections-tabs sections-tabs--bottom" role="tablist" aria-label="Editorial sections, again">${tabs('bottom')}</div>
</div>`;
}

/** The whole thread: the original, the American President, then the four sections as tabs. */
export function thread(s, { day, regions = true, first = null } = {}) {
  return `<div class="thread">
  ${originalPost(s)}
  <p class="thread-step">The presidential version</p>
  ${presidentialPost(s)}
  ${regions ? sectionTabs(s, { day, first, idPrefix: `t-${s.slug}` }) : ''}
</div>`;
}

/**
 * Which regional version opens each statement of a list, so that a page shows a different style
 * each time (as long as there are enough regions): the first of its order of the day not yet used.
 */
export function firstRegions(statements, day) {
  const used = new Set();
  return statements.map((s, i) => {
    const list = regionsInOrder(s, day + i);
    const pick = list.find((r) => !used.has(r.id)) || list[0];
    if (pick) used.add(pick.id);
    return pick?.id || null;
  });
}

/**
 * The calendar of the archives, like Morges.info's agenda: one month per grid, each day a tile, the
 * days with statements in colour and linked to their page. Only months with statements are shown,
 * newest first; in the browser one month at a time, with arrows.
 */
export function archiveCalendar(statements, today) {
  const byDay = new Map();
  for (const s of statements) {
    if (!byDay.has(s.original.date)) byDay.set(s.original.date, []);
    byDay.get(s.original.date).push(s);
  }
  const months = [...new Set([...byDay.keys()].map((d) => d.slice(0, 7)))].sort().reverse();
  const heads = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<li>${d}</li>`).join('');
  const pad = (n) => String(n).padStart(2, '0');
  const grids = months.map((key, i) => {
    const [y, m] = key.split('-').map(Number);
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday first
    const cells = Array.from({ length: offset }, () => '<li class="cal-blank" aria-hidden="true"></li>');
    for (let d = 1; d <= days; d += 1) {
      const iso = `${key}-${pad(d)}`;
      const list = byDay.get(iso) || [];
      const cls = ['cal-day'];
      if (iso === today) cls.push('is-today');
      if (iso > today) cls.push('is-future');
      const num = `<span class="cal-num">${d}</span>`;
      const labels = list.slice(0, 2).map((s) => `<span class="cal-ev">${e(s.headline)}</span>`).join('');
      const more = list.length > 2 ? `<span class="cal-ev cal-more">+${list.length - 2}</span>` : '';
      cells.push(list.length
        ? `<li><a class="${cls.join(' ')}" href="${dayPath(iso)}" aria-label="${e(`${formatDate(iso)}: ${list.map((s) => s.headline).join(', ')}`)}">${num}${labels}${more}</a></li>`
        : `<li><span class="${cls.join(' ')}">${num}</span></li>`);
    }
    return `<section class="cal-month" data-cal-month${i ? ' data-inactive' : ''} aria-label="${MONTHS_LONG[m - 1]} ${y}">
      <h3 class="cal-month-title">${MONTHS_LONG[m - 1]} ${y}</h3>
      <ol class="cal-weekdays" aria-hidden="true">${heads}</ol>
      <ol class="cal-grid">${cells.join('')}</ol>
    </section>`;
  });
  if (!grids.length) return '';
  return `<div class="cal" data-cal>
    <div class="cal-nav" hidden>
      <button type="button" class="cal-btn" data-cal-step="1" aria-label="Earlier month">‹</button>
      <span class="cal-pos" aria-live="polite"></span>
      <button type="button" class="cal-btn" data-cal-step="-1" aria-label="Later month">›</button>
    </div>
    ${grids.join('')}
  </div>`;
}

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const dayPath = (iso) => `/archives/${iso}/`;

/** Links to every regional version of a statement. */
export function regionLinks(s) {
  return REGIONS.filter((r) => s.editions?.[r.id])
    .map((r) => `<a href="${editionPath(s, r)}">${chip(r)}${e(r.name)}</a>`)
    .join('');
}

export { formatDate };

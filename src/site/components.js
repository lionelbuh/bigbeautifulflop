/**
 * Every version of a statement is shown as a post card, one under the other: the original, the
 * presidential version, then the regional ones. Light on purpose: no photo, no long explanations.
 * The English adaptation sits behind "Translate post", as on social networks.
 */
import { e, paras, formatDate, frenchSpacing } from './html.js';
import { chip } from './layout.js';
import { REGIONS } from '../../content/regions.js';
import { editionsFor } from './content.js';
import { editionIndex } from './rotation.js';

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
function post({ variant, avatar, name, meta, badge, body, translate, footer, lang }) {
  return `<article class="post post--${variant}">
  <header class="post-head">
    ${avatar}
    <p class="post-who"><span class="post-name">${name}</span><span class="post-meta">${meta}</span></p>
    <span class="post-badge">${badge}</span>
  </header>
  <div class="post-text"${lang ? ` lang="${lang}"` : ''}>${body}</div>
  ${translate ? `<details class="post-translate"><summary>Translate post</summary><div lang="en">${translate}</div></details>` : ''}
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
    name: 'The Presidential Version',
    meta: 'How a real president would say it',
    badge: 'Satire',
    body: paras(p.en),
    // the French presidential version, behind the same kind of link
    translate: null,
    footer: p.fr?.length ? `<details class="post-translate post-translate--inline"><summary>Version française</summary><div lang="fr">${paras(p.fr, '', { french: true })}</div></details>` : '',
  });
}

/** One regional version, with its English adaptation behind "Translate post". */
export function regionalPost(s, region, { permalink = true, notes = false, english = false } = {}) {
  const ed = s.editions[region.id];
  const noteList = notes && ed.notes?.length
    ? `<details class="post-translate post-translate--inline"><summary>Lost in translation</summary><ul>${ed.notes.map((n) => `<li>${e(n)}</li>`).join('')}</ul></details>`
    : '';
  const draft = ed.review !== 'approved' ? '<span class="verify-flag">draft</span>' : '';
  const link = permalink ? `<a href="${editionPath(s, region)}">Permalink</a>` : '';
  return post({
    variant: 'regional',
    avatar: `<span class="avatar avatar--regional" aria-hidden="true" style="--chip-a:${region.chip[0]};--chip-b:${region.chip[1]}"></span>`,
    name: e(region.name),
    meta: e(region.place),
    badge: 'Satire',
    lang: english ? 'en' : region.lang,
    body: english ? paras(ed.en) : paras(ed.fr, '', { french: true }),
    translate: english ? null : paras(ed.en),
    footer: [link, draft].filter(Boolean).join(' · ') + noteList,
  });
}

/**
 * The regional versions of a statement, in the order of the day: today's Swiss and French
 * editions first, then the others.
 */
export function regionsInOrder(s, day) {
  const first = [];
  const rest = [];
  for (const country of ['switzerland', 'france']) {
    const list = editionsFor(s, country).map((x) => x.region);
    const i = editionIndex(list.length, day);
    list.forEach((r, j) => (j === i ? first : rest).push(r));
  }
  return [...first, ...rest];
}

/** The whole thread: original, presidential, then every regional version. */
export function thread(s, { day, regions = true, first = null } = {}) {
  const list = regions ? regionsInOrder(s, day) : [];
  const lead = list.find((r) => r.id === first) || list[0];
  const rest = list.filter((r) => r !== lead);
  return `<div class="thread">
  ${originalPost(s)}
  ${lead ? `<p class="thread-step">${e(lead.name)}, the satirical version</p>${regionalPost(s, lead)}` : ''}
  <p class="thread-step">The presidential version</p>
  ${presidentialPost(s)}
  ${rest.length ? `<p class="thread-step">Around the world</p>${rest.map((r) => regionalPost(s, r)).join('')}` : ''}
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

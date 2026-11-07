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
    meta: `${o.handle ? `${e(o.handle)} · ` : ''}${e(o.channel || o.medium)} · <time datetime="${o.date}">${shortDate(o.date)}</time>`,
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
export function thread(s, { day, regions = true } = {}) {
  const list = regions ? regionsInOrder(s, day) : [];
  return `<div class="thread">
  ${originalPost(s)}
  <p class="thread-step">The presidential version</p>
  ${presidentialPost(s)}
  ${list.length ? `<p class="thread-step">Around the world</p>${list.map((r) => regionalPost(s, r)).join('')}` : ''}
</div>`;
}

/** Links to every regional version of a statement. */
export function regionLinks(s) {
  return REGIONS.filter((r) => s.editions?.[r.id])
    .map((r) => `<a href="${editionPath(s, r)}">${chip(r)}${e(r.name)}</a>`)
    .join('');
}

export { formatDate };

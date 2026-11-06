/** Reusable blocks: the original, the presidential version, regional editions and their switcher. */
import { e, paras, formatDate, truncate, frenchSpacing } from './html.js';
import { flag, chip } from './layout.js';
import { getCountry, regionPath } from '../../content/regions.js';
import { editionsFor } from './content.js';
import { editionIndex } from '../client/rotation.js';

export const articlePath = (s) => `/statements/${s.slug}/`;
export const editionPath = (s, region) => `/statements/${s.slug}/${region.id}/`;

/** The original statement: verbatim, attributed, sourced, and visibly not ours. */
export function originalBlock(s, { size = 'large', link = false } = {}) {
  const o = s.original;
  const source = o.source.url
    ? `<a href="${e(o.source.url)}" rel="noopener external">${e(o.source.label)}</a>`
    : e(o.source.label);
  const pending = o.verification?.status !== 'verified'
    ? `<p class="verify-flag" title="${e(o.verification?.note || '')}">Wording to be checked against the source before launch</p>`
    : '';
  return `<figure class="original original--${size}">
  <p class="stamp stamp--original">Original statement <span>· verbatim, not satire</span></p>
  <blockquote cite="${e(o.source.url || '')}">${paras(o.text)}</blockquote>
  <figcaption>
    <span class="original-speaker">${e(o.speaker)}</span>
    <span class="original-meta">${e(o.medium)}, <time datetime="${o.date}">${formatDate(o.date)}</time></span>
    <span class="original-source">Source: ${source}</span>
    ${size === 'large' && o.context ? `<span class="original-context">${e(o.context)}</span>` : ''}
    ${pending}
  </figcaption>
  ${link ? `<a class="more" href="${articlePath(s)}">Read the full edition</a>` : ''}
</figure>`;
}

/** How a measured, statesmanlike president would have said the same thing. */
export function presidentialBlock(s, { size = 'large', idPrefix = 'p' } = {}) {
  const p = s.presidential;
  const changes = size === 'large' && p.changes?.length
    ? `<div class="changes"><p class="changes-title">What changed</p><ul>${p.changes.map((c) => `<li>${e(c)}</li>`).join('')}</ul></div>`
    : '';
  const french = size === 'large' && p.fr?.length
    ? `<details class="in-french" id="${idPrefix}-fr"><summary>Lire la version présidentielle en français</summary><div lang="fr">${paras(p.fr, '', { french: true })}</div></details>`
    : '';
  return `<section class="presidential presidential--${size}">
  <p class="stamp stamp--presidential">${flag('us')} The presidential version <span>· satire</span></p>
  <div class="presidential-text">${paras(size === 'large' ? p.en : [truncate(p.en.join(' '), 220)])}</div>
  ${changes}
  ${french}
</section>`;
}

/** One regional version: the French original, its English adaptation, and the notes that explain the jokes. */
export function editionBody(s, region, ed, { notes = true } = {}) {
  const noteList = notes && ed.notes?.length
    ? `<details class="edition-notes"><summary>Lost in translation: the notes</summary><ul>${ed.notes.map((n) => `<li>${e(n)}</li>`).join('')}</ul></details>`
    : '';
  const review = ed.review !== 'approved'
    ? '<p class="review-flag">Draft: awaiting review by a local speaker</p>'
    : '';
  return `<div class="edition-columns">
    <div class="edition-fr" lang="${region.lang}">
      <p class="col-label">${e(region.name)}, in the original</p>
      ${paras(ed.fr, '', { french: true })}
    </div>
    <div class="edition-en" lang="en">
      <p class="col-label">The English adaptation</p>
      ${paras(ed.en)}
    </div>
  </div>
  ${noteList}
  ${review}`;
}

/**
 * The country's editions of a statement, as tabs. Opens on the edition of the day; without
 * JavaScript every edition is shown one after the other.
 */
export function editionSwitcher(s, countryId, { day, idPrefix, headingLevel = 3, title } = {}) {
  const country = getCountry(countryId);
  const list = editionsFor(s, countryId);
  if (!list.length) return '';
  const selected = editionIndex(list.length, day);
  const h = `h${headingLevel}`;
  const tabs = list
    .map(({ region }, i) => `<button type="button" role="tab" id="${idPrefix}-tab-${region.id}" aria-controls="${idPrefix}-${region.id}" aria-selected="${i === selected}" tabindex="${i === selected ? 0 : -1}">${chip(region)}${e(region.name)}</button>`)
    .join('');
  const panels = list
    .map(({ region, edition }, i) => `<section class="edition" role="tabpanel" id="${idPrefix}-${region.id}" aria-labelledby="${idPrefix}-tab-${region.id}"${i === selected ? '' : ' data-inactive'}>
    <${h} class="edition-title">${chip(region)}<span>${e(region.name)}</span> <small>${e(region.place)}</small></${h}>
    ${editionBody(s, region, edition)}
    <p class="edition-link"><a href="${editionPath(s, region)}">Permalink: the ${e(region.name)} edition</a></p>
  </section>`)
    .join('');
  return `<div class="switcher" data-switcher>
  <div class="switcher-head">
    <p class="stamp stamp--world">${flag(country.flag)} ${e(title || `${country.name}: edition of the day`)}</p>
    <div class="switcher-tabs" role="tablist" aria-label="${e(country.name)} editions">${tabs}</div>
  </div>
  ${panels}
</div>`;
}

/** Card for a statement in lists and on the home page. */
export function statementCard(s, { day } = {}) {
  const all = [...editionsFor(s, 'switzerland'), ...editionsFor(s, 'france')];
  const pick = all[editionIndex(all.length, day)];
  const teaser = pick
    ? `<div class="card-edition"><p class="card-edition-label">${chip(pick.region)}${e(pick.region.name)}</p><p lang="${pick.region.lang}">${e(frenchSpacing(truncate(pick.edition.fr[0], 150)))}</p></div>`
    : '';
  return `<article class="card">
  <p class="kicker">${e((s.original.channel || s.original.medium))} · <time datetime="${s.original.date}">${formatDate(s.original.date)}</time></p>
  <h3 class="card-title"><a href="${articlePath(s)}">${e(s.headline)}</a></h3>
  <blockquote class="card-quote">${e(truncate(s.original.text.join(' '), 160))}</blockquote>
  <div class="card-presidential"><p class="card-edition-label">${flag('us')} Presidential</p><p>${e(truncate(s.presidential.en.join(' '), 170))}</p></div>
  ${teaser}
  <p class="card-regions">${all.map(({ region }) => `<a href="${editionPath(s, region)}">${chip(region)}${e(region.name)}</a>`).join('')}</p>
</article>`;
}

export function regionLink(region) {
  return `<a class="region-link" href="${regionPath(region)}">${chip(region)}${e(region.name)}</a>`;
}

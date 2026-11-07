/** Every page of the site, as { path, lang, html } objects (see scripts/build.mjs). */
import { e, formatDate, truncate } from './html.js';
import { renderPage, flag, chip, DISCLAIMER, SITE_URL, SITE_NAME, MOTTO, TAGLINE } from './layout.js';
import { COUNTRIES, REGIONS, getCountry, regionsOf, regionPath } from '../../content/regions.js';
import { editionsFor, leadStatement } from './content.js';
import { editionIndex } from './rotation.js';
import {
  articlePath, editionPath, originalPost, presidentialPost, regionalPost, regionsInOrder, regionLinks, thread,
} from './components.js';

/** Builds every page. `day` is the day number used for the editions of the day. */
export function buildPages({ statements, day, today, assets }) {
  const lead = leadStatement(statements);
  const todays = (countryId) => {
    const list = editionsFor(lead, countryId);
    return list[editionIndex(list.length, day)]?.region.name;
  };
  const header = {
    dateLabel: formatDate(today),
    editionsLabel: `Today: ${[todays('switzerland'), todays('france')].filter(Boolean).join(' & ')} editions`,
  };
  const page = (o) => ({
    path: o.path,
    html: renderPage({
      pageId: o.pageId,
      lang: o.lang || 'en',
      header,
      head: { title: o.title, description: o.description, path: o.path, type: o.type, alternates: o.alternates, jsonLd: o.jsonLd, assets },
      main: o.main,
      bodyClass: o.bodyClass,
    }),
    lang: o.lang || 'en',
    listed: o.listed !== false,
    lastmod: o.lastmod,
  });
  const ctx = { statements, lead, day };

  const pages = [
    page({ pageId: 'home', path: '/', title: SITE_NAME, description: `${MOTTO} What Trump says, what a real president would say, and how the rest of the world would put it.`, main: home(ctx), bodyClass: 'home' }),
    page({ pageId: 'originals', path: '/originals/', title: 'The Originals', description: 'Every statement we adapt, quoted verbatim with its date and source.', main: originals(ctx) }),
    page({ pageId: 'presidential', path: '/presidential/', title: 'The Presidential Edition', description: 'The same messages, as a measured and statesmanlike American president would deliver them.', main: presidential(ctx) }),
    page({ pageId: 'english', path: '/english/', title: 'The English Edition', description: 'The regional versions, adapted back into natural English with the jokes explained.', main: english(ctx) }),
    page({ pageId: 'about', path: '/about/', title: 'About', description: DISCLAIMER, main: about(ctx) }),
    { path: '/404.html', lang: 'en', listed: false, html: renderPage({ pageId: '', header, head: { title: 'Page not found', description: 'This page does not exist.', path: '/404.html', assets }, main: notFound() }) },
  ];

  for (const country of COUNTRIES) {
    pages.push(page({ pageId: country.id, path: country.path, title: country.name, description: country.description, main: countryPage(ctx, country) }));
    for (const region of regionsOf(country.id)) {
      pages.push(page({ pageId: country.id, path: regionPath(region), title: `The ${region.name} edition`, description: `${region.name} (${region.place}): ${region.voice}`, main: regionPage(ctx, region) }));
    }
  }

  for (const s of statements) {
    const regions = REGIONS.filter((r) => s.editions?.[r.id]);
    pages.push(page({
      pageId: '', path: articlePath(s), type: 'article', title: s.headline, description: s.dek, main: article(ctx, s), lastmod: s.published,
      jsonLd: articleLd(s),
    }));
    for (const region of regions) {
      pages.push(page({
        pageId: region.country, path: editionPath(s, region), lang: region.lang, type: 'article', lastmod: s.published,
        title: `${s.headline}: the ${region.name} edition`,
        description: truncate(s.editions[region.id].en.join(' '), 155),
        main: editionPage(ctx, s, region),
      }));
    }
  }
  return pages;
}

function articleLd(s) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SatiricalArticle',
    headline: s.headline,
    description: s.dek,
    datePublished: s.published,
    url: `${SITE_URL}${articlePath(s)}`,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    citation: { '@type': 'CreativeWork', author: { '@type': 'Person', name: s.original.speaker }, dateCreated: s.original.date, name: s.original.medium, ...(s.original.source.url ? { url: s.original.source.url } : {}) },
  };
}

/* ---------- home ---------- */

function home({ statements, lead, day }) {
  const others = statements.filter((s) => s !== lead).slice(0, 6);
  return `<section class="story" aria-labelledby="lead-title">
  <p class="kicker">The lead</p>
  <h1 id="lead-title" class="story-title"><a href="${articlePath(lead)}">${e(lead.headline)}</a></h1>
  ${thread(lead, { day })}
</section>
${others.map((s) => `<section class="story story--short">
  <h2 class="story-title"><a href="${articlePath(s)}">${e(s.headline)}</a></h2>
  ${thread(s, { day, regions: false })}
  <p class="story-more"><a href="${articlePath(s)}">Around the world</a>${regionLinks(s)}</p>
</section>`).join('')}
<p class="disclaimer">${e(DISCLAIMER)}</p>`;
}

/* ---------- article ---------- */

function article({ day }, s) {
  return `<article class="story">
  <p class="kicker">${e(s.original.channel || s.original.medium)} · ${formatDate(s.original.date)}</p>
  <h1 class="story-title">${e(s.headline)}</h1>
  ${thread(s, { day })}
  <p class="disclaimer">${e(DISCLAIMER)}</p>
</article>`;
}

function editionPage(_ctx, s, region) {
  const country = getCountry(region.country);
  const siblings = REGIONS.filter((r) => s.editions?.[r.id] && r.id !== region.id);
  return `<article class="story" lang="en">
  <p class="kicker">${flag(country.flag)} ${e(country.name)} · The ${e(region.name)} edition</p>
  <h1 class="story-title"><a href="${articlePath(s)}">${e(s.headline)}</a></h1>
  <div class="thread">
    ${originalPost(s)}
    <p class="thread-step">The ${e(region.name)} version</p>
    ${regionalPost(s, region, { permalink: false, notes: true })}
  </div>
  <p class="story-more"><a href="${articlePath(s)}">All versions</a>${siblings.map((r) => `<a href="${editionPath(s, r)}">${chip(r)}${e(r.name)}</a>`).join('')}</p>
  <p class="disclaimer">${e(DISCLAIMER)}</p>
</article>`;
}

/* ---------- sections ---------- */

function sectionHead(kicker, title, intro) {
  return `<header class="section-head"><p class="kicker">${kicker}</p><h1>${e(title)}</h1><p class="section-intro">${e(intro)}</p></header>`;
}

const storyTitle = (s) => `<h2 class="story-title story-title--small"><a href="${articlePath(s)}">${e(s.headline)}</a></h2>`;

function originals({ statements }) {
  return `${sectionHead('Verbatim · sourced · dated', 'The Originals', 'What was actually said or posted, word for word. The only part of the site that is not satire.')}
  ${statements.map((s) => `<section class="story story--short">${storyTitle(s)}<div class="thread">${originalPost(s)}</div></section>`).join('')}`;
}

function presidential({ statements }) {
  return `${sectionHead(`${flag('us')} Satire`, 'The Presidential Edition', 'The same message, the way a measured, diplomatic president would say it.')}
  ${statements.map((s) => `<section class="story story--short">${storyTitle(s)}${thread(s, { regions: false })}</section>`).join('')}`;
}

function english({ statements }) {
  return `${sectionHead(`${flag('world')} For the world audience`, 'The English Edition', 'Every regional version, adapted back into natural English so the joke still lands.')}
  ${statements.map((s) => `<section class="story story--short">${storyTitle(s)}<div class="thread">
    ${presidentialPost(s)}
    ${REGIONS.filter((r) => s.editions?.[r.id]).map((r) => regionalPost(s, r, { english: true })).join('')}
  </div></section>`).join('')}`;
}

function countryPage({ statements, day }, country) {
  const regions = regionsOf(country.id);
  const index = regions.map((r) => {
    const n = statements.filter((s) => s.editions?.[r.id]).length;
    return `<a class="region-pill${n ? '' : ' region-pill--empty'}" href="${regionPath(r)}">${chip(r)}${e(r.name)}<small>${n || 'soon'}</small></a>`;
  }).join('');
  const items = statements.filter((s) => editionsFor(s, country.id).length).map((s) => `<section class="story story--short">${storyTitle(s)}<div class="thread">
    ${originalPost(s)}
    <p class="thread-step">${e(country.name)}</p>
    ${regionsInOrder(s, day).filter((r) => r.country === country.id).map((r) => regionalPost(s, r)).join('')}
  </div></section>`);
  return `${sectionHead(`${flag(country.flag)} ${e(country.native)}`, country.name, country.description)}
  <nav class="region-pills" aria-label="${e(country.name)} regions">${index}</nav>
  ${items.join('')}`;
}

function regionPage({ statements }, region) {
  const country = getCountry(region.country);
  const list = statements.filter((s) => s.editions?.[region.id]);
  return `${sectionHead(`${flag(country.flag)} <a href="${country.path}">${e(country.name)}</a> · ${e(region.place)}`, `The ${region.name} edition`, region.voice)}
  ${list.length ? list.map((s) => `<section class="story story--short">${storyTitle(s)}<div class="thread">
    ${originalPost(s)}
    <p class="thread-step">The ${e(region.name)} version</p>
    ${regionalPost(s, region)}
  </div></section>`).join('') : `<p class="empty">No ${e(region.name)} edition yet. The desk is looking for a local voice.</p>`}`;
}

function about() {
  const regions = COUNTRIES.map((c) => `<li>${flag(c.flag)} <strong>${e(c.name)}</strong>: ${regionsOf(c.id).map((r) => `<a href="${regionPath(r)}">${e(r.name)}</a>`).join(', ')}</li>`).join('');
  return `${sectionHead('About', 'An independent satirical publication', TAGLINE)}
  <div class="prose">
    <p>Big Beautiful Flop takes public statements by Donald Trump and shows them three ways: the original, word for word; the same message as a measured, statesmanlike president would put it; and the way people around the world would actually say it.</p>
    <h2>Our rules</h2>
    <ul>
      <li><strong>The original is quoted verbatim</strong>, dated and sourced. No source, no statement.</li>
      <li><strong>We never invent quotes.</strong> Our versions are never attributed to Donald Trump and are always labelled as satire.</li>
      <li><strong>Same message, different manners.</strong> The presidential version keeps the facts and drops the insults.</li>
      <li><strong>Local means local.</strong> Each regional version is read by someone from the region before it is approved.</li>
      <li><strong>Humans publish.</strong> AI helps us draft; an editor approves everything.</li>
    </ul>
    <h2>Regions</h2>
    <ul class="about-regions">${regions}</ul>
    <h2>Disclaimer</h2>
    <p>${e(DISCLAIMER)} Big Beautiful Flop is not affiliated with any government, party, campaign, news agency or social network.</p>
  </div>`;
}

function notFound() {
  return `${sectionHead('404', 'This page flopped', 'It does not exist, or it never did. Nobody knew a website could be so complicated.')}
  <p><a class="button" href="/">Back to the front page</a></p>`;
}

/** Every page of the site, as { path, lang, html } objects (see scripts/build.mjs). */
import { e, paras, formatDate, truncate } from './html.js';
import { renderPage, flag, chip, DISCLAIMER, SITE_URL, SITE_NAME, MOTTO, TAGLINE } from './layout.js';
import { COUNTRIES, REGIONS, getCountry, regionsOf, regionPath } from '../../content/regions.js';
import { editionsFor, leadStatement } from './content.js';
import { editionIndex } from '../client/rotation.js';
import {
  articlePath, editionPath, originalBlock, presidentialBlock, editionBody, editionSwitcher, statementCard, regionLink,
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
  const others = statements.filter((s) => s !== lead).slice(0, 4);
  return `<section class="front-lead" aria-labelledby="lead-title">
  <p class="kicker">The lead · ${e((lead.original.channel || lead.original.medium))}, ${formatDate(lead.original.date)}</p>
  <h1 id="lead-title" class="front-title"><a href="${articlePath(lead)}">${e(lead.headline)}</a></h1>
  <p class="lead">${e(lead.dek)}</p>
  <div class="versus">
    ${originalBlock(lead)}
    ${presidentialBlock(lead, { idPrefix: 'home-p' })}
  </div>
</section>

<section class="world" aria-labelledby="world-title">
  <h2 id="world-title" class="rubric">${flag('world')} Around the world</h2>
  <p class="rubric-intro">The same message, as it would actually be said in Morges, Sion, Geneva, Paris and Marseille. Each version comes with its English adaptation, and the notes explain what got lost on the way.</p>
  ${editionSwitcher(lead, 'switzerland', { day, idPrefix: 'home-ch' })}
  ${editionSwitcher(lead, 'france', { day, idPrefix: 'home-fr' })}
  <p class="world-more"><a class="button" href="${articlePath(lead)}">Read the full edition of “${e(lead.headline)}”</a></p>
</section>

${others.length ? `<section class="also" aria-labelledby="also-title">
  <h2 id="also-title" class="rubric">Also in this edition</h2>
  <div class="cards">${others.map((s) => statementCard(s, { day })).join('')}</div>
</section>` : ''}

${howItWorks()}`;
}

function howItWorks() {
  return `<section class="how" aria-labelledby="how-title">
  <h2 id="how-title" class="rubric">How it works</h2>
  <ol class="how-steps">
    <li><p class="how-label">1 · The original</p><p>A real statement, quoted word for word, with its date and source. We never change it and never invent one.</p></li>
    <li><p class="how-label">2 · The presidential version</p><p>The same political message, as a measured and diplomatic president would put it: no insults, no capital letters, the facts intact.</p></li>
    <li><p class="how-label">3 · Around the world</p><p>The message retold by a Vaudois, a Valaisan, a Parisian or a Marseillais, then adapted back into English so everyone gets the joke.</p></li>
  </ol>
  <p class="disclaimer">${e(DISCLAIMER)}</p>
</section>`;
}

/* ---------- article ---------- */

function article({ day }, s) {
  const ch = editionsFor(s, 'switzerland').length;
  const fr = editionsFor(s, 'france').length;
  const jump = [
    ['original', 'Original'],
    ['presidential', 'Presidential'],
    ch && ['switzerland', 'Switzerland'],
    fr && ['france', 'France'],
  ].filter(Boolean).map(([id, label]) => `<a href="#${id}">${label}</a>`).join('');
  return `<article class="article">
  <header class="article-head">
    <p class="kicker">${e((s.original.channel || s.original.medium))} · ${formatDate(s.original.date)}</p>
    <h1>${e(s.headline)}</h1>
    <p class="lead">${e(s.dek)}</p>
    <p class="article-meta">Adapted by the Big Beautiful Flop desk · <time datetime="${s.published}">${formatDate(s.published)}</time></p>
    <nav class="jump" aria-label="Versions">${jump}</nav>
  </header>
  <section id="original" class="article-section"><h2 class="rubric rubric--num">The original</h2>${originalBlock(s)}</section>
  <section id="presidential" class="article-section"><h2 class="rubric rubric--num">The presidential version</h2>${presidentialBlock(s, { idPrefix: 'a-p' })}</section>
  ${ch ? `<section id="switzerland" class="article-section"><h2 class="rubric rubric--num">The Swiss edition</h2>${editionSwitcher(s, 'switzerland', { day, idPrefix: 'a-ch' })}</section>` : ''}
  ${fr ? `<section id="france" class="article-section"><h2 class="rubric rubric--num">The French edition</h2>${editionSwitcher(s, 'france', { day, idPrefix: 'a-fr' })}</section>` : ''}
  <p class="disclaimer">${e(DISCLAIMER)}</p>
</article>`;
}

function editionPage(_ctx, s, region) {
  const country = getCountry(region.country);
  const siblings = REGIONS.filter((r) => s.editions?.[r.id] && r.id !== region.id);
  return `<article class="article article--edition">
  <header class="article-head">
    <p class="kicker" lang="en">${flag(country.flag)} ${e(country.name)} · The ${e(region.name)} edition</p>
    <h1 lang="en">${e(s.headline)} ${chip(region)}</h1>
    <p class="lead" lang="en">${e(region.voice)}</p>
  </header>
  <div lang="en">${originalBlock(s, { size: 'compact' })}</div>
  <section class="edition edition--page">
    <h2 class="rubric" lang="en">${chip(region)} The ${e(region.name)} version</h2>
    ${editionBody(s, region, s.editions[region.id])}
  </section>
  <div lang="en">
    <h2 class="rubric">For comparison</h2>
    ${presidentialBlock(s, { size: 'compact' })}
    <p class="other-editions">Other editions: ${siblings.map((r) => `<a href="${editionPath(s, r)}">${chip(r)}${e(r.name)}</a>`).join('')} · <a href="${articlePath(s)}">All versions</a></p>
    <p class="disclaimer">${e(DISCLAIMER)}</p>
  </div>
</article>`;
}

/* ---------- sections ---------- */

function sectionHead(kicker, title, intro) {
  return `<header class="section-head"><p class="kicker">${kicker}</p><h1>${e(title)}</h1><p class="lead">${e(intro)}</p></header>`;
}

function originals({ statements }) {
  return `${sectionHead('Verbatim · sourced · dated', 'The Originals', 'What was actually said or posted, word for word. This is the only part of the site that is not satire.')}
  <div class="list">${statements.map((s) => `<div class="list-item"><h2 class="list-title"><a href="${articlePath(s)}">${e(s.headline)}</a></h2>${originalBlock(s, { size: 'compact' })}</div>`).join('')}</div>`;
}

function presidential({ statements }) {
  return `${sectionHead(`${flag('us')} Satire`, 'The Presidential Edition', 'The same political message, delivered the way a measured, diplomatic American president would: the substance kept, the insults and exaggerations left out.')}
  <div class="list">${statements.map((s) => `<div class="list-item"><h2 class="list-title"><a href="${articlePath(s)}">${e(s.headline)}</a></h2>
    <p class="list-original">Original: “${e(s.original.text.join(' '))}”</p>${presidentialBlock(s, { idPrefix: `l-${s.slug}` })}</div>`).join('')}</div>`;
}

function english({ statements }) {
  const items = statements.map((s) => {
    const regions = REGIONS.filter((r) => s.editions?.[r.id]);
    return `<div class="list-item"><h2 class="list-title"><a href="${articlePath(s)}">${e(s.headline)}</a></h2>
      <div class="english-grid">
        <div class="english-block"><p class="card-edition-label">${flag('us')} Presidential</p>${paras(s.presidential.en)}</div>
        ${regions.map((r) => `<div class="english-block"><p class="card-edition-label">${chip(r)}<a href="${editionPath(s, r)}">${e(r.name)}</a>, adapted</p>${paras(s.editions[r.id].en)}</div>`).join('')}
      </div></div>`;
  });
  return `${sectionHead(`${flag('world')} For the world audience`, 'The English Edition', 'Every regional version adapted back into natural English. Not translated word for word: the jokes are rebuilt so they still land.')}
  <div class="list">${items.join('')}</div>`;
}

function countryPage({ statements, day }, country) {
  const regions = regionsOf(country.id);
  const items = statements.filter((s) => editionsFor(s, country.id).length).map((s) => `<div class="list-item">
    <h2 class="list-title"><a href="${articlePath(s)}">${e(s.headline)}</a></h2>
    <p class="list-original">Original: “${e(s.original.text.join(' '))}”</p>
    ${editionSwitcher(s, country.id, { day, idPrefix: `${country.id}-${s.slug}`, title: `${country.name}: the editions` })}
  </div>`);
  return `${sectionHead(`${flag(country.flag)} ${e(country.native)}`, country.name, country.description)}
  <nav class="region-index" aria-label="${e(country.name)} regions">${regions.map((r) => {
    const n = statements.filter((s) => s.editions?.[r.id]).length;
    return `<div class="region-card">${regionLink(r)}<p>${e(r.place)}</p><p class="region-count">${n ? `${n} edition${n > 1 ? 's' : ''}` : 'Coming soon'}</p></div>`;
  }).join('')}</nav>
  <div class="list">${items.join('')}</div>`;
}

function regionPage({ statements }, region) {
  const country = getCountry(region.country);
  const list = statements.filter((s) => s.editions?.[region.id]);
  return `${sectionHead(`${flag(country.flag)} <a href="${country.path}">${e(country.name)}</a> · ${e(region.place)}`, `The ${region.name} edition`, region.voice)}
  <div class="list">${list.length ? list.map((s) => `<div class="list-item">
    <h2 class="list-title"><a href="${editionPath(s, region)}">${e(s.headline)}</a></h2>
    <p class="list-original">Original: “${e(s.original.text.join(' '))}”</p>
    <section class="edition edition--page">${editionBody(s, region, s.editions[region.id], { notes: false })}</section>
  </div>`).join('') : `<p class="empty">No ${e(region.name)} edition yet. The desk is looking for a local voice.</p>`}</div>`;
}

function about() {
  const regions = COUNTRIES.map((c) => `<li>${flag(c.flag)} <strong>${e(c.name)}</strong>: ${regionsOf(c.id).map((r) => regionLink(r)).join(' ')}</li>`).join('');
  return `${sectionHead('About', 'An independent satirical publication', TAGLINE)}
  <div class="prose">
    <p>Big Beautiful Flop takes public statements by Donald Trump, his posts, speeches and announcements, and asks two questions. How would a normal, measured American president have said the same thing? And how would people around the world actually say it, in their own words?</p>
    <h2>Our rules</h2>
    <ul>
      <li><strong>The original is sacred.</strong> Every original statement is quoted verbatim, dated and linked to its source. If we cannot source it, we do not publish it.</li>
      <li><strong>We never invent quotes.</strong> Our adaptations are never attributed to Donald Trump or anyone else, and they are always labelled as satire.</li>
      <li><strong>Same message, different manners.</strong> The presidential version keeps the political message and the facts; it drops insults, exaggerations and personal attacks.</li>
      <li><strong>Local means local.</strong> Regional versions aim to sound like a real person from Morges, Sion or Marseille, not standard French with a few quaint words added. Each one is reviewed by a local speaker before it is marked as approved.</li>
      <li><strong>Humans publish.</strong> AI helps us draft. Nothing it writes is published without an editor reading, correcting and approving it.</li>
    </ul>
    <h2>The editions of the day</h2>
    <p>Each statement has several regional versions. Every day, the home page and each article open on a different Swiss and French edition; the others are one click away, and each one has its own page.</p>
    <ul class="about-regions">${regions}</ul>
    <h2>Disclaimer</h2>
    <p>${e(DISCLAIMER)} Big Beautiful Flop is not affiliated with any government, party, campaign or news agency.</p>
  </div>`;
}

function notFound() {
  return `${sectionHead('404', 'This page flopped', 'It does not exist, or it never did. Nobody knew a website could be so complicated.')}
  <p><a class="button" href="/">Back to the front page</a></p>`;
}

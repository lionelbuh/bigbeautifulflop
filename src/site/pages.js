/** Every page of the site, as { path, lang, html } objects (see scripts/build.mjs). */
import { e, formatDate, truncate } from './html.js';
import { renderPage, flag, chip, emailLink, DISCLAIMER, SITE_URL, SITE_NAME, MOTTO, TAGLINE } from './layout.js';
import { COUNTRIES, REGIONS, getCountry, regionsOf, regionPath } from '../../content/regions.js';
import { editionsFor, leadStatement, splitLatest } from './content.js';
import {
  articlePath, editionPath, originalPost, presidentialPost, regionalPost, regionsInOrder, regionLinks, thread,
  firstRegions, archiveCalendar, dayPath,
} from './components.js';

/** Builds every page. `day` is the day number used for the editions of the day. */
export function buildPages({ statements, day, today, assets }) {
  const { recent, archived } = splitLatest(statements);
  const lead = leadStatement(recent);
  const header = {
    dateLabel: formatDate(today),
    editionsLabel: 'Satire from Switzerland & France',
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
  const ctx = { statements, recent, archived, lead, day, today };

  const pages = [
    page({ pageId: 'home', path: '/', title: SITE_NAME, description: `${MOTTO} What Trump says, what a real president would say, and how the rest of the world would put it.`, main: home(ctx), bodyClass: 'home' }),
    page({ pageId: 'originals', path: '/originals/', title: 'The Originals', description: 'Every statement we adapt, quoted verbatim with its date and source.', main: originals(ctx) }),
    page({ pageId: 'presidential', path: '/presidential/', title: 'The Presidential Edition', description: 'The same messages, as a measured and statesmanlike American president would deliver them.', main: presidential(ctx) }),
    page({ pageId: 'english', path: '/english/', title: 'The English Edition', description: 'The regional versions, adapted back into natural English with the jokes explained.', main: english(ctx) }),
    page({ pageId: 'archives', path: '/archives/', title: 'Archives', description: 'Every statement, day by day, with all its versions.', main: archives(ctx) }),
    page({ pageId: 'about', path: '/about/', title: 'About', description: DISCLAIMER, main: about(ctx) }),
    { path: '/404.html', lang: 'en', listed: false, html: renderPage({ pageId: '', header, head: { title: 'Page not found', description: 'This page does not exist.', path: '/404.html', assets }, main: notFound() }) },
  ];

  const byDay = new Map();
  for (const s of statements) byDay.set(s.original.date, [...(byDay.get(s.original.date) || []), s]);
  for (const [date, list] of byDay) {
    pages.push(page({ pageId: 'archives', path: dayPath(date), title: `Statements of ${formatDate(date)}`, description: list.map((s) => s.headline).join(' · '), main: dayPage(ctx, date, list) }));
  }

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

function home({ statements, recent, lead, day, today }) {
  const slides = [lead, ...recent.filter((s) => s !== lead)];
  const firsts = firstRegions(slides, day);
  const n = slides.length;
  const tabs = slides.map((s, i) => `<li><button type="button" class="carousel-tab" data-go="${i}" aria-current="${i === 0}"><span class="carousel-num">${i + 1}</span><span class="carousel-name">${e(s.headline)}</span></button></li>`).join('');
  const items = slides.map((s, i) => `<article class="slide story" data-slide id="slide-${i + 1}" aria-roledescription="slide" aria-label="${i + 1} of ${n}"${i ? ' data-inactive' : ''}>
    <p class="kicker">${i ? `${i + 1} of ${n}` : 'The lead'} · ${e(s.original.channel || s.original.medium)}, ${formatDate(s.original.date)}</p>
    ${i ? `<h2 class="story-title">` : `<h1 class="story-title">`}<a href="${articlePath(s)}">${e(s.headline)}</a>${i ? '</h2>' : '</h1>'}
    ${thread(s, { day: day + i, first: firsts[i] })}
  </article>`).join('');
  return `<section class="carousel" data-carousel aria-roledescription="carousel" aria-label="The latest ${n} statements">
  <div class="carousel-bar" hidden>
    <p class="carousel-label">The latest ${n}</p>
    <ol class="carousel-tabs">${tabs}</ol>
  </div>
  ${items}
  <div class="carousel-foot" hidden>
    <button type="button" class="carousel-btn" data-step="-1"><span aria-hidden="true">‹</span> Previous</button>
    <span class="carousel-pos" aria-live="polite">1 / ${n}</span>
    <button type="button" class="carousel-btn carousel-btn--next" data-step="1">Next <span aria-hidden="true">›</span></button>
  </div>
</section>
<section class="archive-box" aria-labelledby="archive-title">
  <h2 id="archive-title" class="archive-heading">The archives</h2>
  <p class="section-intro">Every statement, day by day. Pick a day.</p>
  ${archiveCalendar(statements, today)}
  <p class="story-more"><a href="/archives/">All the archives</a></p>
</section>
<p class="disclaimer">${e(DISCLAIMER)}</p>`;
}

/* ---------- archives ---------- */

function archiveEntry(s) {
  return `<div class="story story--short">${storyTitle(s)}<div class="thread">${originalPost(s)}</div>
    <p class="story-more"><a href="${articlePath(s)}">All versions</a>${regionLinks(s)}</p></div>`;
}

function archives({ statements, today }) {
  const byDate = new Map();
  for (const s of statements) byDate.set(s.original.date, [...(byDate.get(s.original.date) || []), s]);
  const days = [...byDate].map(([date, list]) => `<section class="archive-day">
    <h2 class="archive-date"><a href="${dayPath(date)}">${formatDate(date)}</a></h2>
    ${list.map(archiveEntry).join('')}
  </section>`).join('');
  return `${sectionHead('Archives', 'Archives', 'Every statement, day by day, newest first. Pick a day in the calendar, or scroll.')}
  <div class="archive-box">${archiveCalendar(statements, today)}</div>
  ${days || '<p class="empty">Nothing in the archives yet.</p>'}`;
}

function dayPage({ day }, date, list) {
  return `${sectionHead('<a href="/archives/">Archives</a>', formatDate(date), `${list.length} statement${list.length > 1 ? 's' : ''} that day.`)}
  ${list.map((s, i) => `<article class="story">${storyTitle(s)}${thread(s, { day: day + i })}</article>`).join('')}
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
    <h2>Parody and commentary</h2>
    <p>Big Beautiful Flop is parody and commentary. Original statements are quoted verbatim for the purpose of criticism and commentary (fair use, 17 U.S.C. § 107; Swiss Copyright Act, art. 25; French Intellectual Property Code, art. L122-5). Satire of public figures is protected speech under the First Amendment to the U.S. Constitution, the Swiss Federal Constitution (art. 16–17), French law on parody and caricature (art. L122-5, 4°) and the European Convention on Human Rights (art. 10).</p>
    <h2>Disclaimer</h2>
    <p>${e(DISCLAIMER)} Big Beautiful Flop is not affiliated with the White House, Truth Social, or any government, party, campaign, news agency or social network.</p>
    <h2>Contact and corrections</h2>
    <p>Write to ${emailLink()}. If we have quoted a statement inaccurately, tell us: we check it against the source and correct it promptly.</p>
    <h2>Privacy</h2>
    <p>This site sets no cookies, uses no analytics or advertising trackers, and collects no personal data. It is hosted on GitHub Pages (GitHub, Inc.), whose servers may keep technical logs, such as IP addresses, for security; see GitHub’s privacy statement.</p>
  </div>`;
}

function notFound() {
  return `${sectionHead('404', 'This page flopped', 'It does not exist, or it never did. Nobody knew a website could be so complicated.')}
  <p><a class="button" href="/">Back to the front page</a></p>`;
}

/** Every page of the site, as { path, lang, html } objects (see scripts/build.mjs). */
import { e, formatDate, truncate } from './html.js';
import { renderPage, flag, chip, emailLink, CONTACT_EMAIL, DEFAULT_IMAGE, DISCLAIMER, SITE_URL, SITE_NAME, MOTTO, TAGLINE } from './layout.js';
import { COUNTRIES, REGIONS, CATEGORIES, getCountry, categoryOf, regionsOf, regionPath } from '../../content/regions.js';
import { editionsFor, leadStatement, splitLatest } from './content.js';
import {
  articlePath, editionPath, originalPost, presidentialPost, regionalPost, regionsInOrder, regionLinks, thread,
  firstRegions, archiveCalendar, dayPath,
} from './components.js';

/** Builds every page. `day` is the day number used for the editions of the day. */
export function buildPages({ statements, day, today, assets, ogImages = new Set() }) {
  const imageOf = (s) => (ogImages.has(`${s.slug}.png`) ? { path: `/og/${s.slug}.png`, alt: `${s.headline}: Trump’s post and its satirical versions` } : DEFAULT_IMAGE);
  const { recent, archived } = splitLatest(statements);
  const lead = leadStatement(recent);
  const header = {
    dateLabel: formatDate(today),
    editionsLabel: 'Swiss · French · American · British',
  };
  const page = (o) => ({
    path: o.path,
    html: renderPage({
      pageId: o.pageId,
      lang: o.lang || 'en',
      header,
      head: { title: o.title, docTitle: o.docTitle, description: o.description, path: o.path, type: o.type, alternates: o.alternates, jsonLd: o.jsonLd, image: o.image, published: o.published, assets },
      main: o.main,
      bodyClass: o.bodyClass,
    }),
    lang: o.lang || 'en',
    listed: o.listed !== false,
    lastmod: o.lastmod,
    image: o.image,
  });
  const ctx = { statements, recent, archived, lead, day, today };

  const pages = [
    page({ pageId: 'home', path: '/', title: SITE_NAME, description: `${MOTTO} What Trump says, what a real president would say, and how the rest of the world would put it.`, main: home(ctx), bodyClass: 'home', jsonLd: siteLd(), lastmod: statements[0]?.published }),
    page({ pageId: 'originals', path: '/originals/', title: 'The Originals', description: 'Every statement we adapt, quoted verbatim with its date and source.', main: originals(ctx) }),
    // the former "Presidential Edition" now lives in The Diplomat
    { path: '/presidential/', lang: 'en', listed: false, html: redirectPage('/diplomat/') },
    page({ pageId: 'english', path: '/english/', title: 'The English Edition', description: 'The regional versions, adapted back into natural English with the jokes explained.', main: english(ctx) }),
    page({ pageId: 'archives', path: '/archives/', title: 'Archives', description: 'Every statement, day by day, with all its versions.', main: archives(ctx) }),
    page({ pageId: 'about', path: '/about/', title: 'About', description: DISCLAIMER, main: about(ctx) }),
    page({ pageId: 'about', path: '/privacy/', title: 'Privacy policy', description: 'Big Beautiful Flop sets no cookies, shows no advertising and collects no personal data.', main: privacy() }),
    page({ pageId: 'press', path: '/press/', title: 'Press', description: 'Big Beautiful Flop in brief, for journalists: what it is, who makes it, images and contact. En français aussi.', main: press(ctx) }),
    { path: '/404.html', lang: 'en', listed: false, html: renderPage({ pageId: '', header, head: { title: 'Page not found', description: 'This page does not exist.', path: '/404.html', noindex: true, assets }, main: notFound() }) },
  ];

  const byDay = new Map();
  for (const s of statements) byDay.set(s.original.date, [...(byDay.get(s.original.date) || []), s]);
  for (const [date, list] of byDay) {
    pages.push(page({ pageId: 'archives', path: dayPath(date), title: `Statements of ${formatDate(date)}`, description: list.map((s) => s.headline).join(' · '), main: dayPage(ctx, date, list), lastmod: list.map((s) => s.published).sort().pop() }));
  }

  for (const cat of CATEGORIES) {
    const description = cat.countries.length > 1 ? cat.countries.map((c) => getCountry(c).description).join(' ') : getCountry(cat.countries[0]).description;
    pages.push(page({ pageId: cat.id, path: cat.path, title: cat.name, description, main: categoryPage(ctx, cat) }));
  }
  for (const country of COUNTRIES) {
    const cat = categoryOf(country.id);
    // a country that is a section by itself (United States, ...) already has its page above
    if (country.path !== cat.path) {
      pages.push(page({ pageId: cat.id, path: country.path, title: country.name, description: country.description, main: countryPage(ctx, country) }));
    }
    for (const region of regionsOf(country.id)) {
      pages.push(page({ pageId: cat.id, path: regionPath(region), title: editionName(region), description: `${region.name} (${region.place}): ${region.voice}`, main: regionPage(ctx, region), listed: statements.some((s) => s.editions?.[region.id]) }));
    }
  }

  for (const s of statements) {
    const regions = REGIONS.filter((r) => s.editions?.[r.id]);
    pages.push(page({
      pageId: '', path: articlePath(s), type: 'article', title: s.headline, description: s.dek, main: article(ctx, s), lastmod: s.published,
      docTitle: `${s.headline}: Trump’s post, made presidential`, image: imageOf(s), published: s.published,
      jsonLd: articleLd(s, imageOf(s)),
    }));
    for (const region of regions) {
      pages.push(page({
        pageId: categoryOf(region.country).id, path: editionPath(s, region), lang: region.lang, type: 'article', lastmod: s.published,
        title: `${s.headline}: ${editionName(region, true)}`, image: imageOf(s), published: s.published,
        jsonLd: editionLd(s, region, imageOf(s)),
        description: truncate((s.editions[region.id].en || s.editions[region.id].text).join(' '), 155),
        main: editionPage(ctx, s, region),
      }));
    }
  }
  return pages;
}

const publisher = () => ({
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png`, width: 512, height: 512 },
  email: CONTACT_EMAIL,
});

/** Home: the site and its publisher. */
function siteLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, url: `${SITE_URL}/`, description: MOTTO, inLanguage: ['en', 'fr'], publisher: { '@id': `${SITE_URL}/#organization` } },
      publisher(),
    ],
  };
}

/** The original post the satire is based on (only it is attributed to its author). */
const basedOn = (s) => ({
  '@type': 'SocialMediaPosting',
  author: { '@type': 'Person', name: s.original.speaker },
  datePublished: s.original.date,
  ...(s.original.source.url ? { url: s.original.source.url } : {}),
  sharedContent: { '@type': 'WebPage', name: s.original.medium },
});

function breadcrumbs(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE_URL}${path}` })),
  };
}

function articleLd(s, image) {
  const url = `${SITE_URL}${articlePath(s)}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SatiricalArticle',
        headline: s.headline,
        description: s.dek,
        url,
        mainEntityOfPage: url,
        image: `${SITE_URL}${image.path}`,
        datePublished: s.published,
        dateModified: s.published,
        inLanguage: 'en',
        author: { '@id': `${SITE_URL}/#organization` },
        publisher: publisher(),
        about: { '@type': 'Person', name: s.original.speaker },
        isBasedOn: basedOn(s),
        keywords: [...(s.topics || []), 'satire', 'Donald Trump', 'Truth Social'].join(', '),
      },
      breadcrumbs([['Home', '/'], ['Archives', '/archives/'], [formatDate(s.original.date), dayPath(s.original.date)], [s.headline, articlePath(s)]]),
    ],
  };
}

function editionLd(s, region, image) {
  const url = `${SITE_URL}${editionPath(s, region)}`;
  const country = getCountry(region.country);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SatiricalArticle',
        headline: `${s.headline}: ${editionName(region, true)}`,
        url,
        mainEntityOfPage: url,
        image: `${SITE_URL}${image.path}`,
        datePublished: s.published,
        inLanguage: region.lang,
        author: { '@id': `${SITE_URL}/#organization` },
        publisher: publisher(),
        isPartOf: { '@type': 'SatiricalArticle', url: `${SITE_URL}${articlePath(s)}`, headline: s.headline },
        isBasedOn: basedOn(s),
      },
      breadcrumbs([['Home', '/'], [country.name, country.path], [region.name, regionPath(region)], [s.headline, editionPath(s, region)]]),
    ],
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
  <p class="kicker">${flag(country.flag)} ${e(country.name)} · ${e(editionName(region))}</p>
  <h1 class="story-title"><a href="${articlePath(s)}">${e(s.headline)}</a></h1>
  <div class="thread">
    ${originalPost(s)}
    <p class="thread-step">${e(versionName(region))}</p>
    ${regionalPost(s, region, { permalink: false, notes: true })}
  </div>
  <p class="story-more"><a href="${articlePath(s)}">All versions</a>${siblings.map((r) => `<a href="${editionPath(s, r)}">${chip(r)}${e(r.name)}</a>`).join('')}</p>
  <p class="disclaimer">${e(DISCLAIMER)}</p>
</article>`;
}

/* ---------- sections ---------- */

/** "The Vaudois edition", "The British Diplomat" (`lower`: "the Vaudois edition"). */
function editionName(region, lower = false) {
  const name = region.name.startsWith('The ') ? region.name : `The ${region.name} edition`;
  return lower ? name.replace(/^The /, 'the ') : name;
}

/** "The Vaudois version", "The British Diplomat". */
function versionName(region) {
  return region.name.startsWith('The ') ? region.name : `The ${region.name} version`;
}

/** A small page that sends readers (and search engines) to a page's new address. */
function redirectPage(to) {
  const url = `${SITE_URL}${to}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved</title><link rel="canonical" href="${url}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${to}"></head><body><p>This page has moved: <a href="${to}">${url}</a>.</p></body></html>\n`;
}

/**
 * One of the four editorial sections: its regions (as pills, grouped by country) and every statement
 * with versions in it. The Diplomat also shows the American President, its first statesman.
 */
function categoryPage({ statements, day }, cat) {
  const countries = cat.countries.map(getCountry);
  const pills = countries.map((c) => {
    const items = regionsOf(c.id).map((r) => {
      const n = statements.filter((s) => s.editions?.[r.id]).length;
      return `<a class="region-pill${n ? '' : ' region-pill--empty'}" href="${regionPath(r)}">${chip(r)}${e(r.name)}<small>${n || 'soon'}</small></a>`;
    }).join('');
    return `${countries.length > 1 ? `<p class="region-pills-label">${flag(c.flag)} <a href="${c.path}">${e(c.name)}</a></p>` : ''}<nav class="region-pills" aria-label="${e(c.name)}">${items}</nav>`;
  }).join('');
  const diplomat = cat.id === 'diplomat';
  const items = statements.filter((s) => diplomat || cat.countries.some((c) => editionsFor(s, c).length)).map((s) => `<section class="story story--short">${storyTitle(s)}<div class="thread">
    ${originalPost(s)}
    <p class="thread-step">${cat.flags.map((f) => flag(f)).join('')} ${e(cat.name)}</p>
    ${diplomat ? presidentialPost(s) : ''}
    ${regionsInOrder(s, day, cat.countries, { grouped: true }).map((r) => regionalPost(s, r)).join('')}
  </div></section>`);
  const intro = cat.countries.length > 1
    ? 'The same statement, retold the way people actually talk in French-speaking Switzerland and in the regions of France. Each version has its English adaptation.'
    : countries[0].description;
  return `${sectionHead(`${cat.flags.map((f) => flag(f)).join(' ')} Editorial section`, cat.name, intro)}
  <div class="section-pills">${pills}</div>
  ${items.join('')}`;
}

function sectionHead(kicker, title, intro) {
  return `<header class="section-head"><p class="kicker">${kicker}</p><h1>${e(title)}</h1><p class="section-intro">${e(intro)}</p></header>`;
}

const storyTitle = (s) => `<h2 class="story-title story-title--small"><a href="${articlePath(s)}">${e(s.headline)}</a></h2>`;

function originals({ statements }) {
  return `${sectionHead('Verbatim · sourced · dated', 'The Originals', 'What was actually said or posted, word for word. The only part of the site that is not satire.')}
  ${statements.map((s) => `<section class="story story--short">${storyTitle(s)}<div class="thread">${originalPost(s)}</div></section>`).join('')}`;
}

function english({ statements }) {
  return `${sectionHead(`${flag('world')} For the world audience`, 'The English Edition', 'Every version in English: the French ones adapted so the joke still lands, the American and British ones as written.')}
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
  return `${sectionHead(`${flag(country.flag)} <a href="${country.path}">${e(country.name)}</a> · ${e(region.place)}`, editionName(region), region.voice)}
  ${list.length ? list.map((s) => `<section class="story story--short">${storyTitle(s)}<div class="thread">
    ${originalPost(s)}
    <p class="thread-step">${e(versionName(region))}</p>
    ${regionalPost(s, region)}
  </div></section>`).join('') : `<p class="empty">No ${e(region.name)} edition yet. The desk is looking for a local voice.</p>`}`;
}

function about() {
  const regions = COUNTRIES.map((c) => `<li>${flag(c.flag)} <strong><a href="${c.path}">${e(c.name)}</a></strong>: ${[...(c.id === 'diplomat' ? ['The American President'] : []), ...regionsOf(c.id).map((r) => `<a href="${regionPath(r)}">${e(r.name)}</a>`)].join(', ')}</li>`).join('');
  return `${sectionHead('About', 'An independent satirical publication', TAGLINE)}
  <div class="prose">
    <p>Big Beautiful Flop takes public statements by Donald Trump and shows them three ways: the original, word for word; the same message as a measured, statesmanlike president would put it; and the way people around the world would actually say it.</p>
    <h2>Who’s behind this</h2>
    <p>Big Beautiful Flop is made by a Swiss-American living in California: Swiss enough to believe every disagreement can be settled over a fondue, American enough to care how the President talks. As a neutral country, Switzerland has spent centuries translating between quarrelling powers; this is our modest contribution to that tradition. We are not neutral about manners. We are neutral about fondue: moitié-moitié or pure Gruyère, both are welcome.</p>
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
    <p>See our <a href="/privacy/">privacy policy</a>. In short: this site sets no cookies, shows no advertising and collects no personal data. To count visits, it uses Cloudflare Web Analytics, which uses no cookies and does not track visitors across sites; it is not loaded if your browser asks not to be tracked (Do Not Track or Global Privacy Control). The site is hosted on GitHub Pages (GitHub, Inc.), whose servers may keep technical logs, such as IP addresses, for security.</p>
  </div>`;
}

/** The privacy policy (also required by Google for the YouTube publishing tool). */
function privacy() {
  return `${sectionHead('Privacy', 'Privacy policy', 'Short, because there is little to say: we collect nothing about you.')}
  <div class="prose">
    <h2>This website</h2>
    <p>Big Beautiful Flop sets no cookies, shows no advertising and collects no personal data. There are no accounts, no forms and no comments on the site.</p>
    <p>To count visits, the site uses Cloudflare Web Analytics, which uses no cookies, does not track visitors across sites and does not collect personal data. It is not loaded at all if your browser asks not to be tracked (Do Not Track or Global Privacy Control).</p>
    <p>The site is hosted on GitHub Pages (GitHub, Inc.), whose servers may keep technical logs, such as IP addresses, for security. See the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub privacy statement</a>.</p>
    <h2>Sharing buttons</h2>
    <p>“Share on WhatsApp” is a plain link: it opens WhatsApp with a message ready to send. The site sends nothing to WhatsApp and loads nothing from it.</p>
    <h2>Our publishing tool and YouTube</h2>
    <p>We publish our own videos on our own social media accounts with a small tool of our own (“BBF Publisher”). It uses the YouTube API Services only to upload videos to the Big Beautiful Flop YouTube channel and to read that channel’s name. It does not access, collect, store or share any data about other YouTube users or viewers.</p>
    <p>By watching our videos on YouTube, you are subject to the <a href="https://www.youtube.com/t/terms">YouTube Terms of Service</a> and the <a href="https://policies.google.com/privacy">Google Privacy Policy</a>. Access granted to our tool can be revoked at any time from the <a href="https://security.google.com/settings/security/permissions">Google security settings</a> page.</p>
    <h2>Data retention and deletion</h2>
    <p>The only YouTube data our tool keeps is the identifier and upload time of each video we uploaded to our own channel, in a log used to avoid posting twice. It is never shared and never combined with other data. It is deleted when the video is removed from our channel, and in any case on request: write to the address below and we delete it within seven days. If access to our tool is revoked in the Google security settings, the tool stops working and keeps nothing.</p>
    <p>We hold no data about visitors or viewers, so there is nothing about you to delete; if you believe otherwise, write to us and we will answer within seven days.</p>
    <h2>Social networks</h2>
    <p>When you follow or read us on Instagram, Facebook, Threads, Bluesky or YouTube, those services apply their own privacy policies; we receive only the public counts and comments they show to every account owner.</p>
    <h2>Contact</h2>
    <p>Questions about privacy: ${emailLink()}.</p>
    <p class="muted">Last updated: 10 November 2026.</p>
  </div>`;
}

/** For journalists: the project in brief, in English and in French, with images to use. */
function press({ statements }) {
  const latest = statements[0];
  const n = statements.length;
  const sample = latest ? `<figure class="press-figure"><img src="/og/${latest.slug}.png" alt="${e(latest.headline)}: share image" width="1200" height="630" loading="lazy"><figcaption>Latest statement: <a href="${articlePath(latest)}">${e(latest.headline)}</a></figcaption></figure>` : '';
  return `${sectionHead('Press', 'Big Beautiful Flop in brief', 'For journalists, editors and podcasters. Pour la presse romande et française : voir plus bas.')}
  <div class="prose">
    <h2>In one sentence</h2>
    <p>Big Beautiful Flop takes Donald Trump’s posts, word for word, and rewrites them twice: as a statesmanlike president would say them, and as if he were from Vaud, Valais, Paris, Marseille, Texas, Boston, Liverpool or Glasgow, with three diplomats (British, French and Swiss) replying.</p>
    <h2>What makes it different</h2>
    <ul>
      <li><strong>The original is never altered.</strong> Each post is quoted verbatim, dated and sourced; everything else is clearly labelled satire.</li>
      <li><strong>Same message, different manners.</strong> The presidential version keeps the political point and drops the insults: the gap between the two is the joke.</li>
      <li><strong>Local humour, written for locals.</strong> Twenty-two regional voices in French and English, each with an English adaptation that rebuilds the joke for international readers.</li>
      <li><strong>Swiss neutrality, applied to satire.</strong> Made by a Swiss-American living in California: no party, no campaign, no advertising.</li>
    </ul>
    <h2>Facts</h2>
    <ul>
      <li>Launched in November 2026; ${n} statements so far, about eleven versions each.</li>
      <li>On the site, and as short vertical videos on Instagram, Facebook, Threads and Bluesky (YouTube soon); “The Flop of the week” every Sunday.</li>
      <li>Independent, non-commercial; no cookies, no advertising.</li>
    </ul>
    <h2>Images</h2>
    <p>You may use these images to illustrate an article about Big Beautiful Flop: <a href="/icon-512.png">the logo (PNG, 512 × 512)</a>, <a href="/og/default.png">the banner (PNG, 1200 × 630)</a>, and the share image of any statement (on its page).</p>
    ${sample}
    <h2>Contact</h2>
    <p>Interviews, questions, corrections: ${emailLink()}. We usually answer within a day.</p>
    <h2 lang="fr">En bref, en français</h2>
    <div lang="fr">
      <p>Big Beautiful Flop reprend les messages de Donald Trump mot pour mot, puis les réécrit deux fois : comme les dirait un président posé et respectueux des institutions, et comme s’il était vaudois, valaisan, genevois, fribourgeois, neuchâtelois, parisien, marseillais, lyonnais, breton ou ch’ti. Trois diplomates, britannique, français et suisse, lui répondent.</p>
      <p>L’original n’est jamais modifié et tout le reste est signalé comme satire. Le projet est fait par un Suisse-Américain qui vit en Californie, sans parti ni publicité : la neutralité suisse appliquée à la satire. Chaque dimanche, « The Flop of the week » réunit en une vidéo le message de la semaine, sa version présidentielle, une version suisse et une version française.</p>
      <p>Contact : ${emailLink()}.</p>
    </div>
  </div>`;
}

function notFound() {
  return `${sectionHead('404', 'This page flopped', 'It does not exist, or it never did. Nobody knew a website could be so complicated.')}
  <p><a class="button" href="/">Back to the front page</a></p>`;
}

# Search engines and sharing

## What the site already does

- **One URL per page**: articles `/statements/<slug>/`, each regional version
  `/statements/<slug>/<region>/`, regions, days `/archives/YYYY-MM-DD/`. Canonical URL on every page.
- **Titles and descriptions**: articles are titled “<headline>: Trump’s post, made presidential”; the
  description is the article’s summary (`dek`).
- **Languages**: `lang` is set per page and per block (`en`, `fr-CH`, `fr-FR`), so search engines know
  which parts are French.
- **Share images**: 1200 × 630 per article (`public/og/<slug>.png`, made by `npm run images`), a default
  one for other pages; Open Graph and Twitter/X cards (`summary_large_image`) for WhatsApp, Facebook,
  LinkedIn, Bluesky, Threads, X.
- **Structured data** (schema.org JSON-LD): `WebSite` and `Organization` on the home page;
  `SatiricalArticle` with `isBasedOn` (the original post, the only text attributed to its author) and a
  `BreadcrumbList` on articles and regional versions.
- **sitemap.xml** (with share images and dates), **robots.txt** (everything allowed), **feed.xml** (RSS),
  **llms.txt** (summary for AI assistants), `404.html` marked `noindex`.
- Fast: static HTML, one small CSS file, one small script, self-hosted font, works without JavaScript.

## To do once the domain bigbeautifulflop.com works

1. **Google Search Console** (https://search.google.com/search-console): add the property
   `https://bigbeautifulflop.com` → method “HTML tag” → copy the `content="…"` code into
   `GOOGLE_SITE_VERIFICATION` in `src/site/layout.js` → publish → click “Verify”. Then **Sitemaps** →
   enter `sitemap.xml` → Submit.
   (Alternative: the “Domain” property with a DNS TXT record at the registrar, no code change.)
2. **Bing Webmaster Tools** (https://www.bing.com/webmasters): “Import from Google Search Console” is
   the quickest; otherwise “HTML meta tag” → `BING_SITE_VERIFICATION`. Bing also feeds DuckDuckGo,
   Ecosia and Qwant.
3. **Check a share preview**: paste an article URL in a WhatsApp chat, or in the Facebook Sharing
   Debugger (https://developers.facebook.com/tools/debug/), to see the image and title.
4. After a week or two, Search Console → **Pages** shows what is indexed, and **Performance** which
   searches bring readers.

## Good habits that matter most

- Publish regularly (search engines come back more often to sites that change).
- A clear, searchable headline per post; keep the `dek` to one or two sentences.
- Links from elsewhere: posts on Bluesky, Instagram and Threads linking to the article page.

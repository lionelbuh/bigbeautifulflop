# Big Beautiful Flop

**Making presidential statements presidential again.** *Lost in translation. Found in reality.*

An independent satirical publication. Each article takes one public statement by Donald Trump,
quoted verbatim with its source, and shows:

1. **The original**: word for word, dated, sourced. The only part that is not satire.
2. **The presidential version**: the same message from a measured, statesmanlike president (English, plus French).
3. **The Swiss edition of the day**: Vaudois, Valaisan, Genevois, Fribourgeois, Neuchâtelois.
4. **The French edition of the day**: Parisien, Sud, Ch’ti, Lyonnais, Breton.
5. **English adaptations** of every regional version, with notes on what got lost in translation.

> An independent satirical project. Original statements are sourced and attributed. All presidential
> and regional adaptations are fictional, AI-assisted editorial interpretations.

## Status: first milestone (homepage mockup)

Three sample statements; the lead one (“The very stable genius”) shows the whole concept with
Vaudois, Valaisan, Genevois, Parisien and Sud versions. **Before launch:** verify every original
against its source (the quotes were entered from memory) and have each regional version read by a
local speaker. Both are flagged on the pages until done (see `docs/EDITORIAL.md`).

## Pages and URLs

| Page | URL |
| --- | --- |
| Front page | `/` |
| Article (all versions) | `/statements/<slug>/` |
| One regional edition | `/statements/<slug>/<region>/` |
| The Originals · The Presidential Edition · English Edition | `/originals/`, `/presidential/`, `/english/` |
| Switzerland · France, and each region | `/switzerland/`, `/switzerland/vaudois/`, `/france/sud/` … |
| About | `/about/` |

Plus `sitemap.xml`, `robots.txt`, `feed.xml` (RSS), `llms.txt`, `404.html`.

## How it is built

Same principles as Morges.info, smaller toolset:

- **Static and prerendered.** `scripts/build.mjs` turns `content/statements/*.json` into plain HTML in
  `dist/`. No framework, no bundler, no database, no third-party service. Pages work without JavaScript.
- **Gazette look.** Fraunces headlines (SIL OFL, self-hosted from `@fontsource-variable/fraunces`),
  system sans-serif text, warm paper, ink rules, one red accent and a presidential navy.
- **One small script** (`src/client/`): edition tabs, the mobile menu, and the edition of the day,
  which rotates by date (`src/client/rotation.js`, shared by the build and the browser).
- **SEO.** One URL per article and per regional edition, `lang` set per page and per block
  (`fr-CH`, `fr-FR`, `en`), canonical URLs, Open Graph, schema.org `SatiricalArticle`, sitemap, RSS.

```bash
npm install
npm run dev        # build + preview at http://localhost:4321, rebuilds on change
npm test           # content checks and build test (Vitest)
npm run build      # production build in dist/
npm run new -- my-statement-slug   # start a new statement as a draft
```

## Deployment

GitHub Pages through GitHub Actions (`.github/workflows/deploy.yml`): on each push to `main` and nightly.
In the repository: Settings → Pages → Source: “GitHub Actions”, then custom domain `bigbeautifulflop.com`.

## Content

- `content/regions.js`: countries and regions (add one there; pages follow).
- `content/statements/<slug>.json`: one statement and all its versions.
- `docs/EDITORIAL.md`: rules and the review workflow, including where AI fits in.

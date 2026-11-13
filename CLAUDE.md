# Big Beautiful Flop: notes for Claude

- **Publishing:** `main` deploys automatically (GitHub Actions → GitHub Pages).
  - **New statements (content):** write them on the working branch only, send the owner one full-page
    screenshot per statement (all versions visible), and push to `main` only after the owner's “OK”
    (which also sets every version to `review: "approved"`). Always wait for that “OK” after the
    preparation, even if the owner asked in advance to post: the owner rereads every statement first.
  - **Technical and design changes the owner asked for:** push to the working branch and to `main`
    without asking.
- New statements are episodes (from 13 November 2026), see “The episode format” in `docs/EDITORIAL.md`: the
  original in full, Swiss Neutrality (`episode.neutral` + `neutral.en/key`), one canton (`episode.canton`,
  `episode.reaction`) and the tagline; English only, one video. Times pasted from Truth Social are Pacific: store them in Eastern time.
- After adding or changing a statement: `npm run images` (share images in `public/og/`, uses the
  pre-installed Playwright), then `npm run videos` (one episode video, or two for older formats, per statement waiting to be posted,
  in `public/social/<slug>/`; deletes the videos of statements already posted), and commit them with the content.
- Before pushing: `npm test` and `npm run build` must pass.
- Editorial rules are in `docs/EDITORIAL.md`: never invent or alter a quote; adaptations are always labelled satire.
- Morges.info is a separate project: never modify it from here.

# Big Beautiful Flop: notes for Claude

- **Publishing:** `main` deploys automatically (GitHub Actions → GitHub Pages).
  - **New statements (content):** write them on the working branch only, send the owner one full-page
    screenshot per statement (all versions visible), and push to `main` only after the owner's “OK”
    (which also sets every version to `review: "approved"`).
  - **Technical and design changes the owner asked for:** push to the working branch and to `main`
    without asking.
- New statements follow the standard format in `docs/EDITORIAL.md` (11 versions); pick regions with
  `npm run regions`. Times pasted from Truth Social are Pacific: store them in Eastern time.
- After adding or changing a statement: `npm run images` (share images in `public/og/`, uses the
  pre-installed Playwright), then commit them with the content.
- Before pushing: `npm test` and `npm run build` must pass.
- Editorial rules are in `docs/EDITORIAL.md`: never invent or alter a quote; adaptations are always labelled satire.
- Morges.info is a separate project: never modify it from here.

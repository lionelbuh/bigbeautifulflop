# Big Beautiful Flop: notes for Claude

- **Publishing:** the owner wants every change pushed to `main` as well as to the working branch, so it
  deploys automatically (GitHub Actions → GitHub Pages). No need to ask before pushing to `main`.
- New statements follow the standard format in `docs/EDITORIAL.md` (11 versions); pick regions with
  `npm run regions`. Times pasted from Truth Social are Pacific: store them in Eastern time.
- After adding or changing a statement: `npm run images` (share images in `public/og/`, uses the
  pre-installed Playwright), then commit them with the content.
- Before pushing: `npm test` and `npm run build` must pass.
- Editorial rules are in `docs/EDITORIAL.md`: never invent or alter a quote; adaptations are always labelled satire.
- Morges.info is a separate project: never modify it from here.

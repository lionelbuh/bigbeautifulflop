# Big Beautiful Flop: notes for Claude

- **Publishing:** `main` deploys automatically (GitHub Actions → GitHub Pages).
  - **New statements (content):** write them on the working branch only, send the owner one full-page
    screenshot per statement (all versions visible), and push to `main` only after the owner's “OK”
    (which also sets every version to `review: "approved"`). Always wait for that “OK” after the
    preparation, even if the owner asked in advance to post: the owner rereads every statement first.
  - **Technical and design changes the owner asked for:** push to the working branch and to `main`
    without asking.
- New statements are “Meanwhile” episodes (from 17 November 2026), see the first section of `docs/EDITORIAL.md`:
  the hook, the politician's post in full, Steve (a fictional regular American) in two or three lines with the
  REALITY CHECK stamp, the tagline “Politicians say it. Real people pay for it.”; English only, one video.
  Posts come from the current administration only (Trump and his government), not from the opposition.
  Times pasted from Truth Social are Pacific: store them in Eastern time. The Swiss format and the Swiss Priorities
  Report are retired (archives only).
- **Steve's voice:** after writing an episode, push the branch, run the “Voices” workflow on the working branch with
  the slug (engine kokoro, voice auto: Steve is Fenrir), pull, then `npm run videos` (it says “no voice yet” until then).
- **Reply kit:** with every new episode sent for review, also give the owner 3 short reply variants (different
  wording each, natural tone, the official figure with its source, and the episode link
  `https://bigbeautifulflop.com/statements/<slug>/`) that the owner posts by hand under relevant posts on Bluesky and
  Threads, with the video saved on the phone. Never automated, never tagging official accounts.
- After adding or changing a statement: `npm run images` (share images in `public/og/`, uses the
  pre-installed Playwright), then `npm run videos` (one episode video, or two for older formats, per statement waiting to be posted,
  in `public/social/<slug>/`; deletes the videos of statements already posted), and commit them with the content.
- Before pushing: `npm test` and `npm run build` must pass.
- Editorial rules are in `docs/EDITORIAL.md`: never invent or alter a quote; adaptations are always labelled satire.
- Morges.info is a separate project: never modify it from here.

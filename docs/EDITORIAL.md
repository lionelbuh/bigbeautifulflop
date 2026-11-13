# Editorial workflow

## The episode format (from 13 November 2026)

Each new statement is one short episode, all in English, with one video (no second video):

1. **The original**, in full and word for word (`original.text`, plus `original.key` for short posts), with
   “Switzerland has reviewed the request.” under it from the first frame. Never shorten or alter it.
2. **Swiss Neutrality** (`episode.neutral`, two or three short lines; copy them without the asterisks into
   `neutral.en`, and set `neutral.key`). The red “NEUTRAL SWISS” stamp (`scripts/social/assets/neutral-swiss-stamp.svg`)
   lands on it.
3. **One canton** (`episode.canton`: vaudois, valaisan, genevois, fribourgeois or neuchatelois, see
   `src/site/cantons.js`; vary them, `npm run regions` helps), with `episode.reaction`, two or three short lines.
4. **The tagline** (`episode.tagline`), e.g. “Switzerland: Neutral since 1815.” / “Careful with the budget since forever.”

`episode.highlight` (optional) must be exact words of the original; `*…*` marks the red italic last line.
`editions` is `{}` and there is no presidential version. Visual direction: ivory paper (#F4F0E6) with grain,
newspaper typography, red #D71920, flags and abstract maps in SVG; no photographs, no cartoon scenery,
no imitation of anyone’s face or voice.

## The Swiss format (11–12 November 2026)

Every new statement has three parts:
1. **Trump**, the original, verbatim (`original.text`, and `original.key`, one sentence of it, word for word).
2. **The Neutral Swiss** (`neutral.en`, `neutral.fr`, `neutral.key`, `neutral.keyFr`): the same message as a
   neutral Swiss would put it. Takes no side, “takes note”, acknowledges both views, suggests a compromise,
   a mediation in Geneva or a popular vote; keeps the point and the facts, drops insults and capitals;
   gentle Swiss irony. It replaces the presidential version.
3. **Two cantons** (`editions.<canton>`), in French, with their English adaptation, `hook`, `short`,
   `shortEn` and `notes`, in the first person as Trump.

Two meme videos per statement, one canton each, four hours apart: Trump’s key line, the stamp
“CERTIFIÉ NEUTRE · Swiss certified neutral · satire”, the Neutral Swiss under it (English and French),
then “Le même, s’il était valaisan :” with the canton’s prop, then the question and the ending fanfare.
The site shows only the Neutral Swiss and the cantons (menu: Home, The Originals, The Cantons, Archives,
About); the earlier sections redirect, and earlier statements keep all their versions in the archives.

## The rules

1. **The original is quoted verbatim**, with its date, channel and a source anyone can check.
   No source, no statement: the build refuses a statement without `original.source.label`.
2. **We never invent quotes** and never attribute an adaptation to Donald Trump. On the site, only the
   original sits in a `<blockquote>` and carries the stamp “Original statement · verbatim, not satire”;
   everything else is labelled as satire.
3. **The presidential version keeps the political message and the facts.** It drops insults,
   exaggerations, childish language and personal attacks. `presidential.changes` lists what changed.
4. **Regional versions must sound like a real local person**, not standard French with a few regional
   words added. Use expressions sparingly. Every version gets a `review` status and is read by a speaker
   from that region before it is marked `approved`.
5. **English adaptations rebuild the joke** rather than translating it word for word. `notes` explain the
   references (“Lost in translation” on the site).
6. **Nothing AI-generated is published without an editor’s approval.**

## From statement to publication

| Step | Who | What changes in the JSON |
| --- | --- | --- |
| 1. Add the statement | Editor | `npm run new -- <slug>`, paste `original.text` verbatim, fill `source`, `date`, `context` |
| 2. Verify the original | Editor | compare character by character with the source, then `original.verification.status: "verified"` |
| 3. Presidential version | AI draft, editor rewrites | `presidential.en` (and `fr`), `changes` |
| 4. Regional versions | AI draft, local reader | `editions.<region>.fr`, `review: "draft"` |
| 5. English adaptations | AI draft, editor | `editions.<region>.en`, `notes` |
| 6. Review | Editor + local readers | each edition `review: "approved"`; statement `status: "approved"` |
| 7. Publish | Editor | `status: "published"`, then commit and push: the site rebuilds |

Statuses: `draft` → `review` → `approved` → `published`. Only `published` statements are built.

The owner's “OK” in the conversation approves a statement and all its versions (`review: "approved"`);
corrections from local readers are welcome afterwards. On the pages, two flags show that disappear once the work is done:
“Wording to be checked against the source before launch” (until `verification.status` is `verified`)
and “Draft: awaiting review by a local speaker” (until the edition’s `review` is `approved`).

## AI assistance (optional)

The site never calls an AI service: it is plain static files. AI is a drafting tool for the editor,
used before step 6. A future `scripts/draft.mjs` can take a statement in `draft` status, ask a model for
the presidential version, the chosen regional versions and their English adaptations, and write them
back into the JSON with `review: "draft"`. It must never change `original` or `status`.

## Adding a region or a language

1. Add an entry to `content/regions.js` (id, country, name, place, lang, two swatch colours, voice).
2. Write `editions.<id>` in the statements you want. Region pages, navigation, sitemap and the daily
   rotation follow automatically. A new country is one more entry in `COUNTRIES`.

## Front page and archives

The front page shows the latest five statements as a carousel (lead first, then newest first)
(`original.time`, US Eastern, e.g. `"13:51"`). Every statement is also in `/archives/`, with a calendar
and one page per day (`/archives/YYYY-MM-DD/`). `featured: true` picks the lead among the latest five.

## Times of posts

Truth Social shows the time of a post in the reader’s own time zone (and “4h” for recent posts). The
editor reads it in California, so pasted times are **Pacific time**; they are stored in **Eastern time**
(`original.time`, add 3 hours), the time zone of Washington. For “4h”, count back from the time of
pasting. Hovering over the time on Truth Social shows the exact date and time.

## Adding statements by hand

The editor copies the post (text, date, time, link) from Truth Social or Roll Call Factbase and pastes
it into the conversation or into a new file (`npm run new -- <slug>`). Only the posts worth adapting
are added: the selection is editorial, not automatic.

## The four editorial sections

Every statement can be retold in four sections (regions in `content/regions.js`, `CATEGORIES`):

| Section | Versions | Language of the version | English link |
| --- | --- | --- | --- |
| Switzerland & France | Vaudois, Valaisan, Genevois, Fribourgeois, Neuchâtelois; Parisien, Sud, Ch’ti, Lyonnais, Breton | French | “English version”: an adaptation that keeps the joke |
| United States | New York, Texas, Deep South, California, Boston, Midwest | American English | “In plain English”: for international readers |
| United Kingdom | London, Liverpool, Manchester, Yorkshire, Scotland, Wales | British English | “In plain English” |
| The Diplomat | The American President (`presidential`), the British Diplomat, the French Diplomat, the Swiss President | English (+ a French version for the American President, the French Diplomat and the Swiss President) | British Diplomat: “What he really means” |

In a statement file, a version is `editions.<region>`: `text` (the version itself), `en` (its English
adaptation), optional `fr` (a French version of an English text) and `notes` (“Lost in translation”).

## The standard format of a new statement (11 versions)

| Section | Versions |
| --- | --- |
| The American President (`presidential`) | always, right under the original (English + French) |
| Switzerland & France | 2 Swiss cantons + 2 French regions |
| United States | 2 regions |
| United Kingdom | 1 region |
| The Diplomat | the British Diplomat, the French Diplomat, the Swiss President |

Regions rotate from one statement to the next: `npm run regions` lists, for each country, the ones not
used for the longest time. Earlier statements may have more versions (the first examples).

## Writing rules (for editors and for the AI drafting engine)

- **Preserve the original subject and meaning.** The political point survives; the tone changes.
- **Never invent facts, quotes or events.** If the original makes an unsupported factual claim, the
  rewrite says it was claimed (“he says”, “apparently”), or flags the doubt; it never presents it as
  established. Local references used for colour (a date, an invention, a dish) must be true; explain
  them in `notes`.
- **The original stays apart.** It is the only quotation; every rewrite is labelled satire, and the
  diplomats’ versions are fictional interpretations, never real statements by real officials.
- **Regional versions speak in the first person, as Trump himself**, as if he were Vaudois, Valaisan,
  Texan, Mancunian…: the same message, in that person’s words and manners (“Ce soir, je passe à
  60 Minutes…”), never a commentary about him (“Il passe à 60 Minutes…”). The diplomats are the
  exception: they speak for themselves (a government, France, the Federal Council), in reply to him.
- **Each version genuinely different.** Its own angle on the message, not the same joke with a new
  accent. Avoid recycled expressions across regions (and across statements).
- **Authentic, not caricature.** Regional vocabulary and attitudes used naturally and sparingly; for
  American and British versions, no phonetic spelling or forced accents: vocabulary, expressions and
  attitude. No stereotype that becomes offensive or ridiculous.
- **Intelligent humour**: understatement, irony and recognisable local references rather than insults.
- **English adaptations rebuild the joke** for international readers instead of translating literally.
- **Diplomats**: the American President is measured, confident and respectful of institutions; the British
  Diplomat is elegant, polite, understated and occasionally dry; the French Diplomat is eloquent, principled
  and European, with a taste for grand words and summits; the Swiss President is neutral,
  conciliatory, pragmatic and leaves the last word to the people. No insults, no self-praise.

## Social networks

After each deploy, `.github/workflows/social.yml` posts the **new** statements (published on or after
`start` in `content/social/config.json`) on Bluesky and Threads (a thread of seven posts; the first one shows image 1 of the carousel and
the last one the link preview: Trump and the
American President; one American or British satire; two Swiss and two French, one per post, in full in
French with an English line when there is room; the link),
Facebook (a post with the link) and Instagram (a carousel of six images in `public/social/<slug>/`, made
by `npm run images`: Trump and the President; Swiss; French; American and British; diplomats; link). Hashtags: none on Instagram (the caption names the subject in plain words) and Facebook; one topic
(`#PoliticalSatire`) on Threads; `#Trump #PoliticalSatire #Satire` on Bluesky. Never tag official accounts
(@realDonaldTrump, @WhiteHouse…). Each
network posts a statement once: `content/social/posted.json` keeps track. Since statements only reach
`main` after the owner’s OK, nothing is posted without it. By hand, from the Actions tab: mode
`check` (tests the keys), `preview` (shows the texts) or `publish` (optionally one `slug`). Keys are
GitHub secrets: BLUESKY_HANDLE, BLUESKY_APP_PASSWORD, THREADS_TOKEN (60 days: a reminder issue
opens from day 50; update `threadsTokenCreated` when renewed), FACEBOOK_PAGE_ID, FACEBOOK_PAGE_TOKEN,
INSTAGRAM_USER_ID, INSTAGRAM_TOKEN.

### Videos

Each new statement gets **two vertical videos** (30 s, no voice), made by `npm run videos` after
`npm run images` (`public/social/<slug>/video-1.mp4`, `video-2.mp4`). Four screens: a title card
(“Les Vaudoiseries de Trump”, “Trump, Texas style”, “Trump and the Diplomats”…, so that the second video
does not look like a repeat of the first); one version of a series, with its English; Trump’s original,
always **together with** the presidential version (never Trump alone); the end card. When a version has a
`hook` (its punchline, 80 characters at most, `*words*` in gold; plus `hookEn` for a French version), the
title card shows it from the very first frame, under “Trump, Texas style · satire”: the line that makes
people stop scrolling. The first frame is also the Reel’s cover on Instagram (`cover-1.jpg`). Write a hook
for every regional version and for the British Diplomat. The sound logo (`scripts/social/jingle.py`): a fanfare at the start,
the same fanfare that flops at the end. Series take turns from one statement to the next: The Diplomat
Desk (British Diplomat), Le Suisse de la semaine, Meanwhile in Britain, Pendant ce temps en France,
Across America. One of the two videos is always in English and the other in French (Swiss or French series).

When a statement has videos, video 1 replaces the images: a Reel on Instagram, a video post on
Facebook, the first post of the thread on Bluesky and Threads. Video 2 is posted alone about **four
hours later** (the workflow checks every hour; `<network>:video2` in `posted.json`). Video files are
kept only while a statement waits to be posted: the next `npm run videos` deletes the others.

### The meme format: “the invisible President” (statements published from 11 November 2026)

Every new video (about 24 seconds, with the music bed): a fixed scene, an empty suit with a red tie behind
a presidential desk (generic seal, flags, a window). Only the white caption at the top changes, in big bold
type, as in a meme:
- 0–9 s: “Trump, on Truth Social”, with `original.key` (word for word) and, under it, `presidential.key`;
- 9–20 s: “Le même, s’il était vaudois :” (or “Same post, if he were from Texas:”) with `short`, the last
  words in red; the region’s prop drops onto the scene (a cowbell, a beret, a cowboy hat for Texas, a
  baseball cap for the other American regions, a teacup, a red carpet for the diplomats); `shortEn` under it;
- 20–24 s: the question (“Quel canton fait le meilleur Trump ?”) and the ending fanfare.
`videos.json` records the format: statements published earlier keep theirs.

### The short format (statements published from 10 November 2026)

New statements get videos in the short format: about 18 seconds and about forty words. In order:
- the hook, on the first screen: a felt marker rewrites what he shouts in CAPITALS (“ON AURAIT GAGNÉ UN
  RAZ-DE-MARÉE !!!”), then the region answers by hand with the `*gold*` part (“↳ enfin… faut voir.”), above
  an empty suit with a red tie behind a lectern. So the hook must have both parts: the shout, then
  `*the quiet answer*`. The Reel cover is the frame where the joke is complete;
- the key lines: `original.key`, a sentence copied word for word from the original (the tests check it),
  next to `presidential.key`;
- the version’s punchline, word by word, with `*the last words*` in red: `editions.<region>.short`, 170
  characters at most, plus `shortEn`, one English line;
- a question that asks for comments and likes (“Quel canton fait le meilleur Trump ?”), with a light music
  bed between the two fanfares.

On YouTube the title is a question: “What if Trump were from Vaud? <headline> #Shorts”. Write `hook`,
`hookEn`, `short` and `shortEn` for every regional version and for the British Diplomat, and `key` for the
original and the presidential version. The full texts stay on the site. Statements published earlier keep
the classic format (`videos.json` records the format).

### YouTube, the Sunday video, WhatsApp, the press

- **YouTube Shorts:** each video also goes to YouTube (title “Les Vaudoiseries de Trump: <headline> #Shorts”,
  description with the original, the presidential version and the link). Keys: YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN; switched on by `youtubeStart` (a date) in
  `content/social/config.json`: only statements published from that day go to YouTube.
- **The Flop of the week**, every Sunday (`.github/workflows/weekly.yml`, 17:07 UTC): one video with
  Trump’s post of the week and the presidential version, one Swiss version and one French version (with
  a hook, from other statements when possible), then “Switzerland or France: which one wins?”. Chosen
  automatically; to choose yourself, add to `content/social/weekly.json`:
  `{ "2026-11-15": { "original": "<slug>", "swiss": "<slug>/<region>", "france": "<slug>/<region>" } }`.
  It is committed to `public/social/weekly/<date>/`, the site is redeployed, and the hourly run posts it
  on every network (logged under `weekly` in `posted.json`), then deletes it.
- **WhatsApp:** under each version, “Partager sur WhatsApp” / “Share on WhatsApp” opens WhatsApp with
  the hook, the title (“Les Vaudoiseries de Trump”) and the link to the version.
- **Press:** `/press/` (English and French, images to use); the message to send is in `docs/PRESS.md`.


# Editorial workflow

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

## Adding statements by hand

The editor copies the post (text, date, time, link) from Truth Social or Roll Call Factbase and pastes
it into the conversation or into a new file (`npm run new -- <slug>`). Only the posts worth adapting
are added: the selection is editorial, not automatic.

// Watches Donald Trump's Truth Social account and opens one GitHub issue per new post, with the exact
// text and the time in Eastern time, so the owner is notified (GitHub e-mail or app) and can prepare an
// episode. Nothing is published: the issue is only a notice. Run by .github/workflows/truth-watch.yml.
//
// Sources, in order: the public Mastodon-style API of truthsocial.com, then the trumpstruth.org RSS archive.
// Already reported posts are found in the issues labelled "truth-social" (the post id is in each body).
//   node scripts/watch/truth.mjs           report new posts (needs GITHUB_TOKEN and GITHUB_REPOSITORY)
//   node scripts/watch/truth.mjs --dry     only print what would be reported
const DRY = process.argv.includes('--dry');
const ACCOUNT = '107780257626128497'; // @realDonaldTrump
const MAX_AGE_H = Number(process.env.WATCH_MAX_AGE_H || 3); // older posts are never reported (first run, outages)
const LABEL = 'truth-social';
const UA = 'Mozilla/5.0 (compatible; bbf-watch/1.0; +https://bigbeautifulflop.com)';

const decode = (s) => s
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p[^>]*>/gi, '\n\n').replace(/<[^>]+>/g, '')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/[ \t]+\n/g, '\n').trim();

async function get(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json, application/rss+xml, text/xml;q=0.9, */*;q=0.5' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

/** Posts from truthsocial.com: [{ id, at (Date), text, url, media }] */
async function fromTruthSocial() {
  const list = JSON.parse(await get(`https://truthsocial.com/api/v1/accounts/${ACCOUNT}/statuses?limit=20&exclude_replies=true`));
  return list.map((p) => {
    const re = p.reblog; // a ReTruth: someone else's post
    return {
      id: String(p.id), at: new Date(p.created_at), url: p.url || `https://truthsocial.com/@realDonaldTrump/${p.id}`,
      text: decode(re ? re.content || '' : p.content || ''), retruth: re ? `@${re.account?.acct}` : '',
      media: (re || p).media_attachments?.length || 0,
    };
  });
}

/** Posts from the trumpstruth.org archive (RSS): same shape. */
async function fromArchive() {
  const xml = await get('https://trumpstruth.org/feed');
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  const tag = (x, t) => (x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1]?.replace(/^<!\[CDATA\[|\]\]>$/g, '') || '';
  return items.map((x) => {
    const original = tag(x, 'truth:originalUrl') || (x.match(/https:\/\/truthsocial\.com\/@realDonaldTrump\/(?:posts\/)?\d+/) || [])[0] || '';
    const id = (original.match(/(\d{6,})$/) || [])[1] || tag(x, 'guid') || tag(x, 'link');
    let text = decode(tag(x, 'description'));
    // a post with only a video or an image reads "View video" / "View image" in the archive
    const media = /^View (video|image)s?$/i.test(text) ? 1 : 0;
    if (media) text = '';
    return { id: String(id), at: new Date(tag(x, 'pubDate')), url: original || tag(x, 'link'), text, retruth: /^RT @/.test(text) ? 'RT' : '', media };
  });
}

const eastern = (d) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }).format(d) + ' ET';
const pacific = (d) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', timeStyle: 'short' }).format(d) + ' PT';

async function github(path, init = {}) {
  const res = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`GitHub ${path}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

let posts = null;
const errors = [];
for (const [name, source] of [['truthsocial.com', fromTruthSocial], ['trumpstruth.org', fromArchive]]) {
  try {
    posts = await source();
    console.log(`${name}: ${posts.length} posts read`);
    break;
  } catch (err) {
    errors.push(`${name}: ${err.message}`);
    console.log(`${name}: unavailable (${err.message})`);
  }
}
if (!posts) {
  console.log('No source answered; trying again at the next run.');
  process.exit(DRY ? 1 : 0);
}

const fresh = posts.filter((p) => p.id && !Number.isNaN(p.at.getTime()) && Date.now() - p.at.getTime() < MAX_AGE_H * 3600e3)
  .sort((a, b) => a.at - b.at);
const known = new Set();
if (!DRY) {
  const issues = await github(`/issues?labels=${LABEL}&state=all&per_page=100`);
  for (const i of issues) for (const m of (i.body || '').matchAll(/post id: (\S+)/g)) known.add(m[1]);
}
const news = fresh.filter((p) => !known.has(p.id));
console.log(`${fresh.length} posts in the last ${MAX_AGE_H} h, ${news.length} new`);

for (const p of news) {
  const kind = p.retruth ? `ReTruth ${p.retruth}`.trim() : p.text ? '' : p.media ? 'video or image, no text' : 'no text';
  const first = (p.text || kind).replace(/\s+/g, ' ').slice(0, 70);
  const title = `Trump on Truth Social, ${eastern(p.at)}: ${first}${(p.text || '').length > 70 ? '…' : ''}`;
  const body = [
    `**${eastern(p.at)}** (${pacific(p.at)} on truthsocial.com)${kind ? ` · ${kind}` : ''}`,
    '',
    p.text ? p.text.split('\n').map((l) => `> ${l}`).join('\n') : '_(no text)_',
    '',
    `Source: ${p.url}`,
    '',
    'To make it an episode, paste the text in the conversation (check it against the source first).',
    '',
    `<sub>post id: ${p.id}</sub>`,
  ].join('\n');
  if (DRY) { console.log(`\n--- ${title}\n${body}`); continue; }
  await github('/issues', { method: 'POST', body: JSON.stringify({ title, body, labels: [LABEL] }) });
  console.log(`issue opened: ${title}`);
}

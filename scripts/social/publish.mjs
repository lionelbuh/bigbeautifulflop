/**
 * Posts statements on Bluesky, Threads, Facebook and Instagram (run by .github/workflows/social.yml
 * after each deploy, or by hand from the Actions tab).
 *
 *   node scripts/social/publish.mjs --mode check      tests every key: which account it reaches; posts nothing
 *   node scripts/social/publish.mjs --mode preview    prints what would be posted; posts nothing
 *   node scripts/social/publish.mjs --mode publish    posts the new statements not posted yet
 *   node scripts/social/publish.mjs --mode delete --slug <slug> --networks bluesky   deletes a post (and its log entry)
 *   options: --slug <slug> (one statement, even older than the start date), --networks bluesky,threads
 *
 * Only statements published on or after `start` (content/social/config.json) are posted automatically,
 * each network once (content/social/posted.json keeps track; the workflow commits it). Keys come from
 * environment variables (GitHub secrets) and are never printed.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadStatements } from '../../src/site/content.js';
import {
  SITE_URL, articleUrl, threadFor, facebookPost, instagramCaption, secondVideoPost, VIDEO_SERIES, THREADS_TOPIC, BLUESKY_TAGS,
} from './compose.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONFIG = JSON.parse(readFileSync(path.join(root, 'content/social/config.json'), 'utf8'));
const LOG_FILE = path.join(root, 'content/social/posted.json');
const GRAPH = 'https://graph.facebook.com/v23.0';
const THREADS = 'https://graph.threads.net/v1.0';
const env = process.env;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A request whose error messages never contain the keys (they are passed in the body or a header). */
async function call(url, { method = 'GET', form, json, headers = {}, body } = {}) {
  const init = { method, headers: { ...headers } };
  if (form) {
    init.body = new URLSearchParams(form);
  } else if (json) {
    init.body = JSON.stringify(json);
    init.headers['Content-Type'] = 'application/json';
  } else if (body) {
    init.body = body;
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  if (!res.ok) throw new Error(`${method} ${url.split('?')[0]} → HTTP ${res.status}: ${JSON.stringify(data.error || data).slice(0, 400)}`);
  return data;
}
const graphGet = (base, pathAndQuery, token) => call(`${base}${pathAndQuery}${pathAndQuery.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`);
const graphPost = (base, p, token, form) => call(`${base}${p}`, { method: 'POST', form: { ...form, access_token: token } });

/* ---------------- videos (public/social/<slug>/video-1.mp4, video-2.mp4: npm run videos) ---------------- */
const SECOND_VIDEO_DELAY = 4 * 3600 * 1000; // the second video goes out about four hours after the first

/**
 * The networks fetch the share image and the video from the site: right after a deploy, GitHub Pages
 * can take a few minutes to serve the new files. Wait (up to ten minutes) until they answer.
 */
const online = new Set();
async function waitOnline(s) {
  if (online.has(s.slug)) return;
  const urls = [`${SITE_URL}/og/${s.slug}.png`, ...(hasVideo(s, 1) ? [videoUrl(s, 1)] : [])];
  for (let i = 0; i < 40; i += 1) {
    const codes = await Promise.all(urls.map((u) => fetch(u, { method: 'HEAD' }).then((r) => r.status, () => 0)));
    if (codes.every((c) => c === 200)) { online.add(s.slug); return; }
    if (i === 0) console.log(`  waiting for the site to serve ${s.slug} (${codes.join(', ')})…`);
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error('the site does not serve the share image or the video yet');
}
const videoFile = (s, n) => path.join(root, 'public/social', s.slug, `video-${n}.mp4`);
const hasVideo = (s, n) => existsSync(videoFile(s, n));
const videoUrl = (s, n) => `${SITE_URL}/social/${s.slug}/video-${n}.mp4`;
const coverFile = (s, n) => path.join(root, 'public/social', s.slug, `cover-${n}.jpg`);
const coverUrl = (s, n) => `${SITE_URL}/social/${s.slug}/cover-${n}.jpg`;
function videoSeries(s, n) {
  const meta = path.join(root, 'public/social', s.slug, 'videos.json');
  const id = existsSync(meta) ? JSON.parse(readFileSync(meta, 'utf8'))[n]?.series : null;
  return VIDEO_SERIES.find((x) => x.id === id) || null;
}

/* ---------------- Bluesky ---------------- */
const bluesky = {
  ready: () => env.BLUESKY_HANDLE && env.BLUESKY_APP_PASSWORD,
  async session() {
    const s = await call('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST', json: { identifier: env.BLUESKY_HANDLE.replace(/^@/, ''), password: env.BLUESKY_APP_PASSWORD },
    });
    const pds = s.didDoc?.service?.find((x) => x.id === '#atproto_pds')?.serviceEndpoint || 'https://bsky.social';
    return { ...s, pds };
  },
  async check() {
    const s = await this.session();
    return `@${s.handle}`;
  },
  /** Links in the text must be declared as "facets", with byte positions. */
  facets(text) {
    const bytes = (t) => new TextEncoder().encode(t).length;
    const at = (m) => ({ byteStart: bytes(text.slice(0, m.index)), byteEnd: bytes(text.slice(0, m.index + m[0].length)) });
    const links = [...text.matchAll(/https?:\/\/\S+/g)].map((m) => ({ index: at(m), features: [{ $type: 'app.bsky.richtext.facet#link', uri: m[0] }] }));
    // hashtags, clickable (and picked up by the feeds that follow them)
    const tags = [...text.matchAll(/(?<=^|\s)#([A-Za-z][A-Za-z0-9_]*)/g)].map((m) => ({ index: at(m), features: [{ $type: 'app.bsky.richtext.facet#tag', tag: m[1] }] }));
    return [...links, ...tags];
  },
  async uploadBlob(session, url, type) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`could not fetch ${url} (HTTP ${res.status})`);
    const up = await call(`${session.pds}/xrpc/com.atproto.repo.uploadBlob`, {
      method: 'POST', headers: { Authorization: `Bearer ${session.accessJwt}`, 'Content-Type': type }, body: Buffer.from(await res.arrayBuffer()),
    });
    return up.blob;
  },
  /**
   * Videos go through Bluesky's video service (which prepares them for playback): a short-lived
   * service key from our server, the upload, then the processed blob. Falls back to a plain upload.
   */
  async uploadVideo(session, file) {
    const bytes = readFileSync(file);
    try {
      const aud = `did:web:${new URL(session.pds).host}`;
      const exp = Math.floor(Date.now() / 1000) + 1800;
      const { token } = await call(`${session.pds}/xrpc/com.atproto.server.getServiceAuth?aud=${encodeURIComponent(aud)}&lxm=com.atproto.repo.uploadBlob&exp=${exp}`, { headers: { Authorization: `Bearer ${session.accessJwt}` } });
      const res = await fetch(`https://video.bsky.app/xrpc/app.bsky.video.uploadVideo?did=${encodeURIComponent(session.did)}&name=${encodeURIComponent(path.basename(file))}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'video/mp4' }, body: bytes,
      });
      const job = JSON.parse(await res.text());
      const jobId = job.jobId || job.jobStatus?.jobId;
      if (!jobId) throw new Error(`video service: ${JSON.stringify(job).slice(0, 200)}`);
      for (let i = 0; i < 60; i += 1) {
        const { jobStatus } = await call(`https://video.bsky.app/xrpc/app.bsky.video.getJobStatus?jobId=${encodeURIComponent(jobId)}`);
        if (jobStatus?.blob) return jobStatus.blob;
        if (jobStatus?.state === 'JOB_STATE_FAILED') throw new Error(`video processing failed: ${jobStatus.error || ''}`);
        await sleep(3000);
      }
      throw new Error('video processing took more than 3 minutes');
    } catch (err) {
      console.log(`  (Bluesky video service: ${err.message}; plain upload instead)`);
      const up = await call(`${session.pds}/xrpc/com.atproto.repo.uploadBlob`, {
        method: 'POST', headers: { Authorization: `Bearer ${session.accessJwt}`, 'Content-Type': 'video/mp4' }, body: bytes,
      });
      return up.blob;
    }
  },
  videoEmbed(blob, s) {
    return { $type: 'app.bsky.embed.video', video: blob, aspectRatio: { width: 1080, height: 1920 }, alt: `${s.headline}: Donald Trump’s post and its satirical versions (video, no voice).` };
  },
  /** The second video, alone, about four hours after the thread. */
  async publishVideo(s, n, text) {
    const session = await this.session();
    const record = { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString(), langs: ['en'], embed: this.videoEmbed(await this.uploadVideo(session, videoFile(s, n)), s) };
    const facets = this.facets(text);
    if (facets.length) record.facets = facets;
    const res = await call(`${session.pds}/xrpc/com.atproto.repo.createRecord`, { method: 'POST', headers: { Authorization: `Bearer ${session.accessJwt}` }, json: { repo: session.did, collection: 'app.bsky.feed.post', record } });
    return { id: res.uri };
  },
  /** Deletes a thread of ours: the first post and every reply of the same account. */
  async remove(entry) {
    const session = await this.session();
    const thread = await call(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(entry.id)}&depth=20`);
    const uris = [];
    const walk = (node) => {
      if (!node?.post) return;
      if (node.post.author?.did === session.did) uris.push(node.post.uri);
      (node.replies || []).forEach(walk);
    };
    walk(thread.thread);
    for (const uri of uris.reverse()) {
      const rkey = uri.split('/').pop();
      await call(`${session.pds}/xrpc/com.atproto.repo.deleteRecord`, {
        method: 'POST', headers: { Authorization: `Bearer ${session.accessJwt}` }, json: { repo: session.did, collection: 'app.bsky.feed.post', rkey },
      });
    }
    return `${uris.length} posts deleted`;
  },
  /**
   * The first post carries image 1 of the carousel (Trump and the American President side by side);
   * the last one, with the link, the article's link card.
   */
  async publish(s) {
    const session = await this.session();
    const auth = { Authorization: `Bearer ${session.accessJwt}` };
    const posts = threadFor('bluesky', s);
    let image = null;
    let video = null;
    let thumb = null;
    if (hasVideo(s, 1)) video = await this.uploadVideo(session, videoFile(s, 1));
    try {
      if (!video && existsSync(path.join(root, 'public/social', s.slug, '01.jpg'))) image = await this.uploadBlob(session, `${SITE_URL}/social/${s.slug}/01.jpg`, 'image/jpeg');
    } catch (err) {
      console.log(`  (first post without image: ${err.message})`);
    }
    try {
      thumb = await this.uploadBlob(session, `${SITE_URL}/og/${s.slug}.png`, 'image/png');
    } catch (err) {
      console.log(`  (link card without image: ${err.message})`);
    }
    let threadRoot = null;
    let parent = null;
    for (const [i, text] of posts.entries()) {
      const record = { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString(), langs: ['en'] };
      const facets = this.facets(text);
      if (facets.length) record.facets = facets;
      if (i === 0 && image) {
        record.embed = { $type: 'app.bsky.embed.images', images: [{ image, alt: `${s.headline}: Donald Trump’s post on Truth Social and the presidential version, side by side (satire).`, aspectRatio: { width: 1080, height: 1350 } }] };
      }
      if (i === 0 && video) record.embed = this.videoEmbed(video, s);
      if (i === posts.length - 1 || (i === 0 && !image && !video)) {
        record.embed = { $type: 'app.bsky.embed.external', external: { uri: articleUrl(s), title: s.headline, description: s.dek, ...(thumb ? { thumb } : {}) } };
      }
      if (threadRoot) record.reply = { root: threadRoot, parent };
      const res = await call(`${session.pds}/xrpc/com.atproto.repo.createRecord`, { method: 'POST', headers: auth, json: { repo: session.did, collection: 'app.bsky.feed.post', record } });
      parent = { uri: res.uri, cid: res.cid };
      if (!threadRoot) threadRoot = parent;
    }
    return { id: threadRoot.uri, ...(video ? { video: 1 } : {}) };
  },
};

/* ---------------- Threads ---------------- */
const threads = {
  ready: () => env.THREADS_TOKEN,
  async check() {
    const me = await graphGet(THREADS, '/me?fields=id,username', env.THREADS_TOKEN);
    return `@${me.username}`;
  },
  /** Deletes the first post of a thread (Meta requires the threads_delete permission). */
  async remove(entry) {
    await call(`${THREADS}/${entry.id}?access_token=${encodeURIComponent(env.THREADS_TOKEN)}`, { method: 'DELETE' });
    return 'first post deleted (replies, if any remain, can be deleted in the app)';
  },
  /** Media containers need a moment before they can be published. */
  async waitReady(id, tries = 20) {
    for (let i = 0; i < tries; i += 1) {
      const { status } = await graphGet(THREADS, `/${id}?fields=status`, env.THREADS_TOKEN);
      if (status === 'FINISHED') return;
      if (status === 'ERROR' || status === 'EXPIRED') throw new Error(`Threads container ${status}`);
      await sleep(i < 5 ? 3000 : 6000);
    }
    throw new Error('Threads container not ready in time');
  },
  /** The second video, alone, about four hours after the thread. */
  async publishVideo(s, n, text) {
    const container = await graphPost(THREADS, '/me/threads', env.THREADS_TOKEN, { media_type: 'VIDEO', video_url: videoUrl(s, n), text });
    await this.waitReady(container.id, 60);
    const post = await graphPost(THREADS, '/me/threads_publish', env.THREADS_TOKEN, { creation_id: container.id });
    return { id: post.id };
  },
  async publish(s) {
    const posts = threadFor('threads', s);
    // the first post carries image 1 of the carousel (Trump and the American President side by side);
    // the last one, with the link, shows the article's preview card
    const image = existsSync(path.join(root, 'public/social', s.slug, '01.jpg')) ? `${SITE_URL}/social/${s.slug}/01.jpg` : `${SITE_URL}/og/${s.slug}.png`;
    let first = null;
    let previous = null;
    for (const [i, text] of posts.entries()) {
      const form = { text, ...(previous ? { reply_to_id: previous } : {}) };
      if (i === 0 && hasVideo(s, 1)) Object.assign(form, { media_type: 'VIDEO', video_url: videoUrl(s, 1) });
      else if (i === 0) Object.assign(form, { media_type: 'IMAGE', image_url: image });
      else form.media_type = 'TEXT';
      if (i === posts.length - 1) form.link_attachment = articleUrl(s);
      const container = await graphPost(THREADS, '/me/threads', env.THREADS_TOKEN, form);
      if (i === 0) await this.waitReady(container.id, hasVideo(s, 1) ? 60 : 20);
      else await sleep(4000); // Threads asks for a short wait between creating and publishing
      const post = await graphPost(THREADS, '/me/threads_publish', env.THREADS_TOKEN, { creation_id: container.id });
      previous = post.id;
      first = first || post.id;
    }
    return { id: first, ...(hasVideo(s, 1) ? { video: 1 } : {}) };
  },
};

/* ---------------- Facebook page ---------------- */
const facebook = {
  ready: () => env.FACEBOOK_PAGE_ID && env.FACEBOOK_PAGE_TOKEN,
  async check() {
    const page = await graphGet(GRAPH, `/${env.FACEBOOK_PAGE_ID}?fields=id,name`, env.FACEBOOK_PAGE_TOKEN);
    console.log(`  (FACEBOOK_PAGE_ID ends with …${String(env.FACEBOOK_PAGE_ID).slice(-4)})`);
    // a page key answers /me with the page itself: only such a key can post
    const token = await this.pageToken();
    const me = await graphGet(GRAPH, '/me?fields=id,name', token);
    if (this.pageId && String(me.id) === String(this.pageId)) {
      const note = String(this.pageId) !== String(env.FACEBOOK_PAGE_ID) ? ` — FACEBOOK_PAGE_ID could be updated to the ID ending …${String(this.pageId).slice(-4)}` : '';
      return `page “${this.pageName}” (page key ✓, can post${note})`;
    }
    if (String(me.id) !== String(env.FACEBOOK_PAGE_ID)) {
      let perms = '';
      try {
        const granted = await graphGet(GRAPH, '/me/permissions', env.FACEBOOK_PAGE_TOKEN);
        perms = granted.data.filter((x) => x.status === 'granted').map((x) => x.permission).join(', ');
      } catch {
        perms = '(could not list)';
      }
      throw new Error(`the key can read page “${page.name}” but is not its page key (it belongs to “${me.name}”), so it cannot post. Asking Facebook for the page key failed: ${this.lastError}. Permissions of the key: ${perms}.`);
    }
    return `page “${page.name}” (page key ✓, can post)`;
  },
  /**
   * Posting needs the page's own key. If the secret holds a user or system-user key, ask Facebook for
   * the page key it gives access to; otherwise use the secret as it is.
   */
  async pageToken() {
    try {
      const page = await graphGet(GRAPH, `/${env.FACEBOOK_PAGE_ID}?fields=access_token`, env.FACEBOOK_PAGE_TOKEN);
      if (page.access_token) return page.access_token;
      this.lastError = 'Facebook returned no access_token for the page';
    } catch (err) {
      // already a page key, or no access to the field: try the list of pages below
      this.lastError = err.message;
    }
    // second way: the pages this (system) user manages
    try {
      const { data = [] } = await graphGet(GRAPH, '/me/accounts?fields=id,name,access_token', env.FACEBOOK_PAGE_TOKEN);
      // the page of the secret, or else the only page this key manages (e.g. FACEBOOK_PAGE_ID holds a
      // profile number instead of the page's)
      const match = data.find((p) => String(p.id) === String(env.FACEBOOK_PAGE_ID)) || (data.length === 1 ? data[0] : null);
      if (match?.access_token) {
        this.pageId = match.id;
        this.pageName = match.name;
        return match.access_token;
      }
      this.lastError += data.length
        ? ` / the key manages other pages: ${data.map((p) => `“${p.name}” (ID ending …${String(p.id).slice(-4)})`).join(', ')}; check FACEBOOK_PAGE_ID`
        : ' / the key manages no page at all: the page is not assigned to this system user';
    } catch (err) {
      this.lastError += ` / ${err.message}`;
    }
    return env.FACEBOOK_PAGE_TOKEN;
  },
  /** A video on the page (Facebook shows vertical videos as Reels), its text holding the link. */
  async postVideo(s, n, description) {
    const token = await this.pageToken();
    const res = await graphPost('https://graph-video.facebook.com/v23.0', `/${this.pageId || env.FACEBOOK_PAGE_ID}/videos`, token, { file_url: videoUrl(s, n), description });
    return { id: res.id };
  },
  async publish(s) {
    if (hasVideo(s, 1)) return { ...(await this.postVideo(s, 1, facebookPost(s).message)), video: 1 };
    const token = await this.pageToken();
    const post = await graphPost(GRAPH, `/${this.pageId || env.FACEBOOK_PAGE_ID}/feed`, token, facebookPost(s));
    return { id: post.id };
  },
  async publishVideo(s, n, text) {
    return this.postVideo(s, n, text);
  },
};

/* ---------------- Instagram (carousel of the images in public/social/<slug>/) ---------------- */
const instagram = {
  ready: () => env.INSTAGRAM_USER_ID && env.INSTAGRAM_TOKEN,
  async check() {
    const ig = await graphGet(GRAPH, `/${env.INSTAGRAM_USER_ID}?fields=id,username`, env.INSTAGRAM_TOKEN);
    return `@${ig.username}`;
  },
  images(s) {
    const dir = path.join(root, 'public/social', s.slug);
    return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort().map((f) => `${SITE_URL}/social/${s.slug}/${f}`) : [];
  },
  async waitReady(id, tries = 20) {
    for (let i = 0; i < tries; i += 1) {
      const { status_code: status } = await graphGet(GRAPH, `/${id}?fields=status_code`, env.INSTAGRAM_TOKEN);
      if (status === 'FINISHED') return;
      if (status === 'ERROR' || status === 'EXPIRED') throw new Error(`Instagram container ${status}`);
      await sleep(i < 5 ? 3000 : 6000);
    }
    throw new Error('Instagram container not ready in time');
  },
  /** A Reel (also shown in the feed). */
  async reel(s, n, caption) {
    const ig = env.INSTAGRAM_USER_ID;
    const container = await graphPost(GRAPH, `/${ig}/media`, env.INSTAGRAM_TOKEN, { media_type: 'REELS', video_url: videoUrl(s, n), caption, share_to_feed: 'true', ...(existsSync(coverFile(s, n)) ? { cover_url: coverUrl(s, n) } : {}) });
    await this.waitReady(container.id, 60);
    const post = await graphPost(GRAPH, `/${ig}/media_publish`, env.INSTAGRAM_TOKEN, { creation_id: container.id });
    return { id: post.id };
  },
  async publishVideo(s, n, text) {
    return this.reel(s, n, text);
  },
  async publish(s) {
    if (hasVideo(s, 1)) return { ...(await this.reel(s, 1, instagramCaption(s))), video: 1 };
    const urls = this.images(s);
    if (urls.length < 2) throw new Error(`no carousel images in public/social/${s.slug}/ (run npm run images)`);
    const ig = env.INSTAGRAM_USER_ID;
    const children = [];
    for (const url of urls.slice(0, 10)) {
      const item = await graphPost(GRAPH, `/${ig}/media`, env.INSTAGRAM_TOKEN, { image_url: url, is_carousel_item: 'true' });
      children.push(item.id);
    }
    for (const id of children) await this.waitReady(id);
    const carousel = await graphPost(GRAPH, `/${ig}/media`, env.INSTAGRAM_TOKEN, { media_type: 'CAROUSEL', children: children.join(','), caption: instagramCaption(s) });
    await this.waitReady(carousel.id);
    const post = await graphPost(GRAPH, `/${ig}/media_publish`, env.INSTAGRAM_TOKEN, { creation_id: carousel.id });
    return { id: post.id };
  },
};

export const NETWORKS = { bluesky, threads, facebook, instagram };

/* ---------------- run ---------------- */
function args() {
  const a = process.argv.slice(2);
  const get = (name) => {
    const i = a.indexOf(`--${name}`);
    return i >= 0 ? a[i + 1] : undefined;
  };
  return { mode: get('mode') || 'check', slug: get('slug') || '', networks: (get('networks') || Object.keys(NETWORKS).join(',')).split(',').map((x) => x.trim()).filter(Boolean) };
}

async function main() {
  const { mode, slug, networks } = args();
  const chosen = networks.filter((n) => NETWORKS[n]);
  const log = existsSync(LOG_FILE) ? JSON.parse(readFileSync(LOG_FILE, 'utf8')) : {};
  let failed = 0;

  if (mode === 'check') {
    for (const name of chosen) {
      const net = NETWORKS[name];
      if (!net.ready()) {
        console.log(`${name}: no key configured (skipped)`);
        continue;
      }
      try {
        console.log(`${name}: OK, posts as ${await net.check()}`);
      } catch (err) {
        failed += 1;
        console.log(`${name}: FAILED ${err.message}`);
      }
    }
    process.exitCode = failed ? 1 : 0;
    return;
  }

  if (mode === 'delete') {
    if (!slug) throw new Error('delete needs --slug');
    for (const name of chosen) {
      const entry = log[slug]?.[name];
      if (!entry) {
        console.log(`${slug} · ${name}: nothing logged, nothing to delete`);
        continue;
      }
      if (!NETWORKS[name].remove) {
        console.log(`${slug} · ${name}: deleting is not supported here, delete it in the app`);
        continue;
      }
      try {
        console.log(`${slug} · ${name}: ${await NETWORKS[name].remove(entry)}`);
        delete log[slug][name];
        writeFileSync(LOG_FILE, `${JSON.stringify(log, null, 2)}\n`);
      } catch (err) {
        failed += 1;
        console.log(`${slug} · ${name}: FAILED ${err.message}`);
      }
    }
    process.exitCode = failed ? 1 : 0;
    return;
  }

  const statements = loadStatements(path.join(root, 'content/statements'));
  const queue = slug
    ? statements.filter((s) => s.slug === slug)
    : statements.filter((s) => s.published >= CONFIG.start).reverse(); // oldest first
  if (slug && !queue.length) throw new Error(`no published statement “${slug}”`);

  for (const s of queue) {
    for (const name of chosen) {
      if (log[s.slug]?.[name]) continue;
      if (mode === 'preview') {
        console.log(`\n=== ${s.slug} · ${name} ===`);
        if (name === 'bluesky' || name === 'threads') threadFor(name, s).forEach((t, i) => console.log(`--- post ${i + 1} (${[...t].length} chars)\n${t}`));
        if (name === 'facebook') console.log(facebookPost(s).message);
        if (name === 'instagram') console.log(`${instagram.images(s).length} images\n${instagramCaption(s)}`);
        continue;
      }
      const net = NETWORKS[name];
      if (!net.ready()) continue;
      try {
        await waitOnline(s);
        const res = await net.publish(s);
        log[s.slug] = { ...log[s.slug], [name]: { at: new Date().toISOString(), id: res.id, ...(res.video ? { video: res.video } : {}) } };
        writeFileSync(LOG_FILE, `${JSON.stringify(log, null, 2)}\n`);
        console.log(`${s.slug} · ${name}: posted (${res.id})`);
      } catch (err) {
        failed += 1;
        console.log(`${s.slug} · ${name}: FAILED ${err.message}`);
      }
    }
  }
  // second videos: about four hours after a first post that carried video 1
  const LIMITS = { bluesky: [300, BLUESKY_TAGS], threads: [500, THREADS_TOPIC], facebook: [5000, ''], instagram: [2200, ''] };
  if (mode === 'publish') {
    for (const s of statements.filter((x) => !slug || x.slug === slug)) {
      const series = videoSeries(s, 2);
      if (!series || !hasVideo(s, 2)) continue;
      for (const name of chosen) {
        const first = log[s.slug]?.[name];
        const key = `${name}:video2`;
        if (!first?.video || log[s.slug][key] || !NETWORKS[name].ready()) continue;
        if (Date.now() - Date.parse(first.at) < SECOND_VIDEO_DELAY) continue;
        try {
          const [max, tags] = LIMITS[name];
          const res = await NETWORKS[name].publishVideo(s, 2, secondVideoPost(s, series, max, tags));
          log[s.slug] = { ...log[s.slug], [key]: { at: new Date().toISOString(), id: res.id } };
          writeFileSync(LOG_FILE, `${JSON.stringify(log, null, 2)}\n`);
          console.log(`${s.slug} · ${name}: second video posted (${res.id})`);
        } catch (err) {
          failed += 1;
          console.log(`${s.slug} · ${name}: second video FAILED ${err.message}`);
        }
      }
    }
  }
  if (mode === 'publish' && !queue.length) console.log(`Nothing to post (statements published since ${CONFIG.start}: none new).`);
  process.exitCode = failed ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}

/**
 * Posts statements on Bluesky, Threads, Facebook and Instagram (run by .github/workflows/social.yml
 * after each deploy, or by hand from the Actions tab).
 *
 *   node scripts/social/publish.mjs --mode check      tests every key: which account it reaches; posts nothing
 *   node scripts/social/publish.mjs --mode preview    prints what would be posted; posts nothing
 *   node scripts/social/publish.mjs --mode publish    posts the new statements not posted yet
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
import { SITE_URL, articleUrl, threadFor, facebookPost, instagramCaption } from './compose.mjs';

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
  async publish(s) {
    const session = await this.session();
    const auth = { Authorization: `Bearer ${session.accessJwt}` };
    const posts = threadFor('bluesky', s);
    // the first post carries a link card with the share image
    let thumb;
    try {
      const img = await fetch(`${SITE_URL}/og/${s.slug}.png`);
      if (img.ok) {
        const up = await call(`${session.pds}/xrpc/com.atproto.repo.uploadBlob`, { method: 'POST', headers: { ...auth, 'Content-Type': 'image/png' }, body: Buffer.from(await img.arrayBuffer()) });
        thumb = up.blob;
      }
    } catch (err) {
      console.log(`  (link card without image: ${err.message})`);
    }
    let root = null;
    let parent = null;
    for (const [i, text] of posts.entries()) {
      const record = { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString(), langs: ['en'] };
      const facets = this.facets(text);
      if (facets.length) record.facets = facets;
      if (i === 0) record.embed = { $type: 'app.bsky.embed.external', external: { uri: articleUrl(s), title: s.headline, description: s.dek, ...(thumb ? { thumb } : {}) } };
      if (root) record.reply = { root, parent };
      const res = await call(`${session.pds}/xrpc/com.atproto.repo.createRecord`, { method: 'POST', headers: auth, json: { repo: session.did, collection: 'app.bsky.feed.post', record } });
      parent = { uri: res.uri, cid: res.cid };
      if (!root) root = parent;
    }
    return { id: root.uri };
  },
};

/* ---------------- Threads ---------------- */
const threads = {
  ready: () => env.THREADS_TOKEN,
  async check() {
    const me = await graphGet(THREADS, '/me?fields=id,username', env.THREADS_TOKEN);
    return `@${me.username}`;
  },
  async publish(s) {
    let first = null;
    let previous = null;
    for (const text of threadFor('threads', s)) {
      const container = await graphPost(THREADS, '/me/threads', env.THREADS_TOKEN, { media_type: 'TEXT', text, ...(previous ? { reply_to_id: previous } : {}) });
      await sleep(4000); // Threads asks for a short wait between creating and publishing
      const post = await graphPost(THREADS, '/me/threads_publish', env.THREADS_TOKEN, { creation_id: container.id });
      previous = post.id;
      first = first || post.id;
    }
    return { id: first };
  },
};

/* ---------------- Facebook page ---------------- */
const facebook = {
  ready: () => env.FACEBOOK_PAGE_ID && env.FACEBOOK_PAGE_TOKEN,
  async check() {
    const page = await graphGet(GRAPH, `/${env.FACEBOOK_PAGE_ID}?fields=id,name`, env.FACEBOOK_PAGE_TOKEN);
    // a page key answers /me with the page itself: only such a key can post
    const token = await this.pageToken();
    const me = await graphGet(GRAPH, '/me?fields=id,name', token);
    if (String(me.id) !== String(env.FACEBOOK_PAGE_ID)) {
      throw new Error(`the key can read page “${page.name}” but is not its page key (it belongs to “${me.name}”), so it cannot post. Put the page’s own access_token in FACEBOOK_PAGE_TOKEN.`);
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
    } catch {
      // already a page key, or no access to the field: use the secret as it is
    }
    return env.FACEBOOK_PAGE_TOKEN;
  },
  async publish(s) {
    const post = await graphPost(GRAPH, `/${env.FACEBOOK_PAGE_ID}/feed`, await this.pageToken(), facebookPost(s));
    return { id: post.id };
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
  async waitReady(id) {
    for (let i = 0; i < 20; i += 1) {
      const { status_code: status } = await graphGet(GRAPH, `/${id}?fields=status_code`, env.INSTAGRAM_TOKEN);
      if (status === 'FINISHED') return;
      if (status === 'ERROR' || status === 'EXPIRED') throw new Error(`Instagram container ${status}`);
      await sleep(3000);
    }
    throw new Error('Instagram container not ready after 60 s');
  },
  async publish(s) {
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
        const res = await net.publish(s);
        log[s.slug] = { ...log[s.slug], [name]: { at: new Date().toISOString(), id: res.id } };
        writeFileSync(LOG_FILE, `${JSON.stringify(log, null, 2)}\n`);
        console.log(`${s.slug} · ${name}: posted (${res.id})`);
      } catch (err) {
        failed += 1;
        console.log(`${s.slug} · ${name}: FAILED ${err.message}`);
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

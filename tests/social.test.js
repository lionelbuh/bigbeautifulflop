import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { loadStatements } from '../src/site/content.js';
import { excerpt, threadPosts, threadFor, facebookPost, instagramCaption, carouselCards, VIDEO_SERIES, videoSeriesFor, secondVideoPost, seriesVersion, videosPending, videoTitle } from '../scripts/social/compose.mjs';

const statements = loadStatements(path.resolve('content/statements'));
const chars = (t) => [...t].length;

describe('social posts', () => {
  it('cuts long texts at a word, with an ellipsis', () => {
    expect(excerpt('one two three four', 100)).toBe('one two three four');
    const cut = excerpt('alpha beta gamma delta epsilon', 18);
    expect(chars(cut)).toBeLessThanOrEqual(18);
    expect(cut.endsWith('…')).toBe(true);
  });

  it('respects each network’s length limit and keeps the link', () => {
    for (const s of statements) {
      for (const [max] of [[300], [500]]) {
        const posts = threadPosts(s, max);
        for (const p of posts) expect(chars(p)).toBeLessThanOrEqual(max);
        expect(posts.at(-1)).toContain(`https://bigbeautifulflop.com/statements/${s.slug}/`);
        expect(posts[0]).toContain('Trump on Truth Social');
        expect(posts.slice(1).join()).toContain('satire');
      }
      expect(chars(instagramCaption(s))).toBeLessThanOrEqual(2200);
      expect(instagramCaption(s)).not.toContain('#');
      expect(facebookPost(s).message).not.toMatch(/#\w/);
      const th = threadFor('threads', s);
      expect(th[0]).toContain('#PoliticalSatire');
      expect(th.slice(1).join()).not.toContain('#PoliticalSatire');
      const bs = threadFor('bluesky', s);
      for (const p of [...th.map((x) => [x, 500]), ...bs.map((x) => [x, 300])]) expect(chars(p[0])).toBeLessThanOrEqual(p[1]);
      expect(bs.at(-1)).toContain('#Trump #PoliticalSatire #Satire');
      expect(facebookPost(s).link).toBe(`https://bigbeautifulflop.com/statements/${s.slug}/`);
    }
  });

  it('shows each version once in the carousel, the original first, at most 9 images of cards', () => {
    for (const s of statements) {
      const slides = carouselCards(s);
      expect(slides.length).toBeLessThanOrEqual(9);
      const labels = slides.flat().map((c) => c.label);
      expect(new Set(labels).size).toBe(labels.length);
      expect(slides[0][0].kind).toBe('original');
    }
  });
  it('gives each statement two different video series, in turns, with short enough posts', () => {
    statements.forEach((s, i) => {
      const series = videoSeriesFor(s, i);
      expect(series.length).toBeGreaterThan(0);
      expect(new Set(series.map((x) => x.id)).size).toBe(series.length);
      for (const sr of series) {
        expect(VIDEO_SERIES).toContain(sr);
        expect(seriesVersion(s, sr)).not.toBeNull();
        expect(videoTitle(s, sr).title).toMatch(/Trump/);
        for (const max of [300, 500, 2200]) {
          const post = secondVideoPost(s, sr, max, max === 300 ? '#Trump' : '');
          expect(chars(post)).toBeLessThanOrEqual(max);
          expect(post).toContain(`/statements/${s.slug}/`);
        }
      }
    });
  });

  it('keeps videos only for statements still waiting for a post', () => {
    const s = { slug: 'x', published: '2026-11-09' };
    const all = { bluesky: { id: 1 }, threads: { id: 2 }, facebook: { id: 3 }, instagram: { id: 4 } };
    expect(videosPending(s, {}, '2026-11-08')).toBe(true);
    expect(videosPending(s, {}, '2026-11-10')).toBe(false);
    expect(videosPending(s, { x: all }, '2026-11-08')).toBe(false);
    expect(videosPending(s, { x: { ...all, bluesky: { id: 1, video: 1 } } }, '2026-11-08')).toBe(true);
    expect(videosPending(s, { x: { ...all, bluesky: { id: 1, video: 1 }, 'bluesky:video2': { id: 5 } } }, '2026-11-08')).toBe(false);
  });
  it('keeps video hooks short, with an English line for the French ones', () => {
    for (const s of statements) {
      for (const [id, ed] of Object.entries(s.editions)) {
        if (!ed.hook) continue;
        expect(chars(ed.hook.replace(/\*/g, ''))).toBeLessThanOrEqual(80);
        if (!['british-diplomat'].includes(id) && /[àâçéèêëîïôûù’]/.test(ed.hook + ed.text.join(' ')) && ed.text.join(' ').match(/ (le|la|les|et|est) /)) expect(ed.hookEn).toBeTruthy();
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { loadStatements } from '../src/site/content.js';
import { excerpt, threadPosts, facebookPost, instagramCaption, carouselCards } from '../scripts/social/compose.mjs';

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
});

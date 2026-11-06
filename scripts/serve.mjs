/**
 * Local preview: builds, serves dist/ on http://localhost:4321 with clean URLs (like GitHub Pages),
 * and rebuilds when content/ or src/ change. Development only; the live site is plain static files.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { build } from './build.mjs';

const port = Number(process.env.PORT || 4321);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json' };

let { out } = build();
console.log(`Built. Serving ${out}`);

let timer;
for (const dir of ['content', 'src', 'public']) {
  watch(dir, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        ({ out } = build());
        console.log('Rebuilt.');
      } catch (err) {
        console.error(err.message);
      }
    }, 120);
  });
}

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(out, path.normalize(url));
  if (!file.startsWith(out)) return res.writeHead(403).end();
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'content-type': types['.html'] });
    res.end(await readFile(path.join(out, '404.html')));
  }
}).listen(port, () => console.log(`http://localhost:${port}/`));

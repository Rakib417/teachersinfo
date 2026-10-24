/**
 * Runs after `next build`: writes each page's own <html lang/dir/class> and <body class>
 * (from its WordPress page) into the exported HTML, so search engines and CSS see the right values
 * without JavaScript.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'out');
const index = JSON.parse(fs.readFileSync(path.join(root, 'src/content/routes.json'), 'utf8'));
const load = (file) => JSON.parse(fs.readFileSync(path.join(root, 'src/content/pages', file), 'utf8'));

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const attrs = (obj) => Object.entries(obj || {}).map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${esc(v)}"`)).join('');

function patch(file, page) {
  if (!fs.existsSync(file)) return false;
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<html\b[^>]*>/i, `<html${attrs(page.htmlAttrs)}>`);
  html = html.replace(/<body\b[^>]*>/i, `<body${attrs(page.bodyAttrs)}>`);
  fs.writeFileSync(file, html);
  return true;
}

let done = 0;
const missing = [];
for (const route of index.routes) {
  const file = path.join(out, ...route.segments, 'index.html');
  if (patch(file, load(route.file))) done++;
  else missing.push(route.path);
}
if (index.notFound) {
  const page = load(index.notFound);
  patch(path.join(out, '404.html'), page);
  patch(path.join(out, '404', 'index.html'), page);
}

console.log(`postbuild: set <html>/<body> attributes on ${done} pages.`);
if (missing.length) {
  console.warn(`postbuild: ${missing.length} exported pages were not found:\n  ${missing.slice(0, 20).join('\n  ')}`);
}

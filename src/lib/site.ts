import fs from 'node:fs';
import path from 'node:path';
import index from '@/content/routes.json';

/**
 * Content written by the PressBake WordPress plugin:
 *   src/content/routes.json      every route and the JSON file that holds it
 *   src/content/pages/*.json     one page each (head tags, body HTML, language)
 *   src/content/wp/*.json        the raw content (posts, pages, menus...) for your own components
 */

export type Attrs = Record<string, string>;

export type HeadTag = {
  tag: 'title' | 'meta' | 'link' | 'style' | 'script' | 'noscript';
  attrs: Attrs;
  content?: string;
};

export type PageData = {
  path: string;
  title: string;
  lang: string;
  dir: string;
  htmlAttrs: Attrs;
  bodyAttrs: Attrs;
  head: HeadTag[];
  headHtml: string;
  body: string;
};

export type Route = {
  path: string;
  segments: string[];
  file: string;
  title: string;
  lang: string;
  dir: string;
};

type RouteIndex = {
  defaultLang: string;
  defaultDir: string;
  notFound: string | null;
  routes: Route[];
};

const site = index as unknown as RouteIndex;

export const routes: Route[] = site.routes;
export const defaultLang = site.defaultLang || 'en';
export const defaultDir = site.defaultDir || 'ltr';

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

const byKey = new Map(routes.map((r) => [r.segments.join('/'), r]));

export function findRoute(segments: string[] = []): Route | undefined {
  return byKey.get(segments.map(decode).join('/'));
}

const pagesDir = path.join(process.cwd(), 'src', 'content', 'pages');

export function loadPage(file: string): PageData {
  return JSON.parse(fs.readFileSync(path.join(pagesDir, file), 'utf8')) as PageData;
}

export function notFoundPage(): PageData | null {
  return site.notFound ? loadPage(site.notFound) : null;
}

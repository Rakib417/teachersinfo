import type { HeadTag, PageData } from '@/lib/site';
import { toReactProps } from '@/lib/attrs';

/**
 * Renders one WordPress page.
 *
 *  - <title>, <meta>, <link> and <style> from the page head are hoisted into <head> by React.
 *  - Head scripts run first, in their original order, then the page body (theme markup) follows.
 *  - Links are plain <a> tags, so every page is a full page load and the theme's own scripts
 *    run exactly as they did in WordPress.
 *
 * To turn a part of the page into a real React component, render it before or after the body,
 * or split `page.body` and replace a section.
 */
export function WpPage({ page }: { page: PageData }) {
  return (
    <>
      {page.head.map((item, i) => (
        <HeadItem key={i} item={item} index={i} />
      ))}
      <script dangerouslySetInnerHTML={{ __html: documentAttributes(page) }} />
      <div data-wp-root="" style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: page.body }} />
    </>
  );
}

function HeadItem({ item, index }: { item: HeadTag; index: number }) {
  const props = toReactProps(item.attrs);

  switch (item.tag) {
    case 'title':
      return <title>{item.content ?? ''}</title>;
    case 'meta':
      return <meta {...props} />;
    case 'link': {
      // "<link media=print onload=this.media='all'>" loads CSS without blocking; React drops inline handlers, so apply the final media now.
      const deferred = /this\.media\s*=\s*['"]([^'"]+)['"]/.exec(item.attrs.onload ?? '');
      if (deferred) props.media = deferred[1];
      const rel = String(item.attrs.rel ?? '').toLowerCase();
      if (rel.split(/\s+/).includes('stylesheet') && item.attrs.href) {
        return <link {...props} precedence="wp" />;
      }
      return <link {...props} />;
    }
    case 'style':
      return <style href={`wp-style-${index}`} precedence="wp" dangerouslySetInnerHTML={{ __html: item.content ?? '' }} />;
    case 'script':
      return item.content ? <script {...props} dangerouslySetInnerHTML={{ __html: item.content }} /> : <script {...props} />;
    case 'noscript':
      return <noscript dangerouslySetInnerHTML={{ __html: item.content ?? '' }} />;
    default:
      return null;
  }
}

/** Sets <html> and <body> attributes while the page loads (the build also writes them into the HTML). */
function documentAttributes(page: PageData) {
  const json = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');
  return `(function(h,b){var d=document,k;for(k in h)d.documentElement.setAttribute(k,h[k]);for(k in b)d.body.setAttribute(k,b[k]);})(${json(page.htmlAttrs)},${json(page.bodyAttrs)});`;
}

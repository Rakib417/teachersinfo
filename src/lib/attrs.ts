/** Turn HTML attribute names into React prop names (class → className, crossorigin → crossOrigin, ...). */

const RENAME: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  charset: 'charSet',
  'http-equiv': 'httpEquiv',
  'accept-charset': 'acceptCharset',
  crossorigin: 'crossOrigin',
  referrerpolicy: 'referrerPolicy',
  fetchpriority: 'fetchPriority',
  hreflang: 'hrefLang',
  itemprop: 'itemProp',
  itemscope: 'itemScope',
  itemtype: 'itemType',
  imagesrcset: 'imageSrcSet',
  imagesizes: 'imageSizes',
  nomodule: 'noModule',
  srcset: 'srcSet',
  tabindex: 'tabIndex',
  autocomplete: 'autoComplete',
  blocking: 'blocking',
};

const BOOLEAN = new Set(['async', 'defer', 'nomodule', 'itemscope', 'disabled', 'hidden', 'novalidate']);

export function parseStyle(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 1) continue;
    const prop = decl.slice(0, i).trim();
    const name = prop.startsWith('--') ? prop : prop.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[name] = decl.slice(i + 1).trim();
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toReactProps(attrs: Record<string, string>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (/^on/i.test(key)) continue; // inline event handlers are not allowed as strings in React
    if (key === 'style') {
      props.style = parseStyle(value);
      continue;
    }
    props[RENAME[key] ?? key] = BOOLEAN.has(key) ? true : value;
  }
  return props;
}

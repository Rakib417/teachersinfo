/**
 * Static export: `npm run build` writes plain HTML/CSS/JS to out/, which any static host can serve.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'export',
  trailingSlash: true, // /about/ → out/about/index.html, the same addresses WordPress used
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;

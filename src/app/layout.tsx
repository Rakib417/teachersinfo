import type { ReactNode } from 'react';
import { defaultDir, defaultLang } from '@/lib/site';

/**
 * Root layout. Each page brings its own head tags (title, meta, styles) from its JSON file.
 * The real <html lang/dir> and <body class> of every page are set by scripts/postbuild.mjs after the build
 * (and by a tiny inline script in development), hence suppressHydrationWarning.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={defaultLang} dir={defaultDir} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

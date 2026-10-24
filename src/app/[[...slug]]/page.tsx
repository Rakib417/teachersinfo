import { notFound } from 'next/navigation';
import { WpPage } from '@/components/WpPage';
import { findRoute, loadPage, routes } from '@/lib/site';

type Props = { params: Promise<{ slug?: string[] }> };

/** Only the routes exported from WordPress exist. Titles and meta tags come from each page's own head. */
export const dynamicParams = false;

export function generateStaticParams() {
  return routes.map((route) => ({ slug: route.segments }));
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const route = findRoute(slug);
  if (!route) notFound();
  return <WpPage page={loadPage(route.file)} />;
}

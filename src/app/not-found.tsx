import { WpPage } from '@/components/WpPage';
import { notFoundPage } from '@/lib/site';

export default function NotFound() {
  const page = notFoundPage();
  if (page) return <WpPage page={page} />;
  return (
    <main style={{ padding: '6rem 1.5rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Page not found</h1>
      <p>
        <a href="/">Back to the home page</a>
      </p>
    </main>
  );
}

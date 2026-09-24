import { useEffect } from 'react';
import { useData } from '../components/ui';
import { pageDefaults, mergeContent } from '../../../../shared/siteContent';

export function usePageContent(slug) {
  const result = useData('/catalog/pages');
  const page = result.data?.find((item) => item.slug === slug);
  const content = page ? mergeContent(pageDefaults[slug]?.config || {}, page.config) : null;
  useEffect(() => {
    if (!page) return;
    document.title = page.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = page.body;
  }, [page?.title, page?.body]);
  return { ...result, page, content };
}

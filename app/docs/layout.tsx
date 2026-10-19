import type { ReactNode } from 'react';
import { DocsSidebar } from '@/components/docs/sidebar';
import { docGroups, getAllDocs, getSearchItems } from '@/content/docs/docs-server';

export default function DocsLayout({ children }: { children: ReactNode }) {
  // Read the tree per request so a new chapter shows up without a server restart.
  // getSearchItems no longer includes page.body in the searchable index,
  // keeping the serialized client payload well under Vercel's 20 MB limit.
  const pages = getAllDocs();
  const searchItems = getSearchItems(pages);
  const nav = pages.map(({ slug, title, group, parentSlug, parentTitle, isChapterOverview }) => ({
    slug,
    title,
    group,
    parentSlug,
    parentTitle,
    isChapterOverview,
  }));

  return (
    <div
      id="nd-docs-layout"
      className="grid min-h-dvh w-full grid-cols-1 overflow-x-clip lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_268px]"
    >
      <DocsSidebar docs={nav} groups={docGroups} searchItems={searchItems} />
      {children}
    </div>
  );
}

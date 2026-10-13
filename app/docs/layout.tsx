import type { ReactNode } from 'react';
import { DocsSidebar } from '@/components/docs/sidebar';
import { docNavItems, docGroups, docPages, getSearchItems } from '@/content/docs/docs-server';

export default function DocsLayout({ children }: { children: ReactNode }) {
  // getSearchItems no longer includes page.body in the searchable index,
  // keeping the serialized client payload well under Vercel's 20 MB limit.
  const searchItems = getSearchItems(docPages);

  return (
    <div
      id="nd-docs-layout"
      className="grid min-h-dvh w-full grid-cols-1 overflow-x-clip lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_268px]"
    >
      <DocsSidebar docs={docNavItems} groups={docGroups} searchItems={searchItems} />
      {children}
    </div>
  );
}

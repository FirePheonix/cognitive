'use client';

import { ChevronRight, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

type SearchItem = {
  id: string;
  type: 'page' | 'heading' | 'text';
  breadcrumbs: string[];
  content: string;
  description: string;
  url: string;
  searchable: string;
};
type SearchPanelProps = {
  className?: string;
  embedded?: boolean;
  autoType?: boolean;
  initialSearch?: string | string[];
  onClose?: () => void;
};

export function CognitiveSearchPanel({
  className,
  embedded = false,
  autoType = false,
  initialSearch = ['agentic', 'mcp', 'graph engineering'],
  onClose,
  searchItems,
}: SearchPanelProps & { searchItems: SearchItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState<string>(() => {
    if (autoType) return '';
    if (Array.isArray(initialSearch)) return initialSearch[0] || '';
    return initialSearch || '';
  });

  const initialSearchKey = Array.isArray(initialSearch)
    ? initialSearch.join(',')
    : initialSearch || '';

  useEffect(() => {
    if (!autoType) return;

    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;
    let isMounted = true;

    const queries = Array.isArray(initialSearch)
      ? initialSearch.length > 0
        ? initialSearch
        : ['']
      : [initialSearch || ''];

    const root = rootRef.current;
    if (!root) return;

    let queryIndex = 0;

    const typeQuery = () => {
      if (!isMounted) return;
      const currentQuery = queries[queryIndex] || '';
      let charIndex = 0;
      let isDeleting = false;

      interval = setInterval(() => {
        if (!isDeleting) {
          charIndex += 1;
          setSearch(currentQuery.slice(0, charIndex));

          if (charIndex >= currentQuery.length) {
            clearInterval(interval);
            timeout = setTimeout(() => {
              isDeleting = true;
              // Restart interval for deleting
              interval = setInterval(() => {
                charIndex -= 1;
                setSearch(currentQuery.slice(0, charIndex));
                if (charIndex <= 0) {
                  clearInterval(interval);
                  queryIndex = (queryIndex + 1) % queries.length;
                  timeout = setTimeout(typeQuery, 500); // Wait 500ms before typing next
                }
              }, 75); // Deleting is usually faster
            }, 2000); // Wait 2s before deleting
          }
        }
      }, 115);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect(); // Only trigger once to start the typing loop
        typeQuery();
      },
      { threshold: 0.45 },
    );

    observer.observe(root);
    return () => {
      isMounted = false;
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [autoType, initialSearchKey]);

  const filteredResults = useMemo<SearchItem[]>(() => {
    const query = (typeof search === 'string' ? search : '').trim().toLowerCase();
    if (query.length < 2) return [];

    return searchItems
      .map((item) => ({ item, score: scoreSearchItem(item, query) }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 9)
      .map((result) => result.item);
  }, [search, searchItems]);

  return (
    <div
      ref={rootRef}
      id={embedded ? undefined : 'fd-search-dialog-content'}
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border bg-fd-popover text-fd-popover-foreground shadow-2xl focus-visible:outline-none',
        '*:border-b *:has-[+:last-child[data-empty=true]]:border-b-0 *:data-[empty=true]:border-b-0 *:last:border-b-0',
        embedded ? 'relative' : 'w-full max-w-screen-sm',
        className,
      )}
    >
      <div className="flex flex-row items-center gap-2 p-2.5">
        <Search className="size-4 text-fd-muted-foreground" />
        <input
          data-fd-search-dialog-input=""
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search"
          readOnly={autoType}
          className="w-0 flex-1 bg-transparent text-sm placeholder:text-fd-muted-foreground focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 items-center justify-center rounded-md border bg-fd-background px-2 font-mono text-[11px] text-fd-muted-foreground"
        >
          ESC
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden p-1.5">
        {filteredResults.length === 0 ? (
          <div data-empty="true" className="py-10 text-center text-xs text-fd-muted-foreground">
            {search.length === 0 ? 'Start typing to search articles' : 'No results found'}
          </div>
        ) : (
          filteredResults.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                window.location.href = item.url;
              }}
              aria-selected={index === 0}
              className={cn(
                'relative select-none shrink-0 px-2.5 py-2 text-start text-xs overflow-hidden rounded-lg',
                index === 0 && 'bg-fd-accent text-fd-accent-foreground',
              )}
            >
              <div className="inline-flex items-center text-[11px] text-fd-muted-foreground empty:hidden">
                {item.breadcrumbs.map((breadcrumb, breadcrumbIndex) => (
                  <span key={breadcrumb} className="inline-flex items-center">
                    {breadcrumbIndex > 0 && <ChevronRight className="size-3.5 rtl:rotate-180" />}
                    {breadcrumb}
                  </span>
                ))}
              </div>

              {item.type !== 'page' && (
                <div role="none" className="absolute inset-s-3 inset-y-0 w-px bg-fd-border" />
              )}
              <div
                className={cn(
                  'min-w-0',
                  item.type === 'text' && 'ps-4',
                  item.type === 'heading' && 'ps-4',
                  item.type === 'page' || item.type === 'heading'
                    ? 'font-medium'
                    : 'text-fd-popover-foreground/80',
                )}
              >
                <p>{item.content}</p>
                <p className="mt-1 line-clamp-1 text-[11px] font-normal text-fd-muted-foreground">
                  {item.description}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="bg-fd-secondary/50 p-2.5 text-[11px] text-fd-muted-foreground">
        Search {searchItems.length} Cognitive articles and sections
      </div>
    </div>
  );
}

function scoreSearchItem(item: SearchItem, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const title = normalizeSearchText(item.content);
  const description = normalizeSearchText(item.description);

  if (title === normalizedQuery) return 100;
  if (title.startsWith(normalizedQuery)) return 80;
  if (title.includes(normalizedQuery)) return 60;
  if (description.includes(normalizedQuery)) return 35;
  if (item.searchable.includes(normalizedQuery)) return item.type === 'page' ? 20 : 16;

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (terms.length > 1 && terms.every((term) => item.searchable.includes(term))) return 12;

  return 0;
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function CognitiveSearchTrigger({
  className,
  mode = 'modal',
  searchItems = [],
}: {
  className?: string;
  mode?: 'modal' | 'dropdown';
  searchItems?: any[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open || mode !== 'dropdown') return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [mode, open]);

  return (
    <div ref={rootRef} className={cn('relative', mode === 'modal' && 'contents')}>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-lg border bg-fd-secondary/50 px-3 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground',
          className,
        )}
      >
        <Search className="size-4" />
        <span>Search</span>
        <kbd className="ms-auto rounded-md border bg-fd-background px-1.5 py-0.5 text-[11px]">
          Ctrl K
        </kbd>
      </button>
      {open && mode === 'dropdown' ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(520px,calc(100vw-2rem))] origin-top-right animate-in fade-in slide-in-from-top-2 duration-150">
          <CognitiveSearchPanel
            initialSearch=""
            onClose={() => setOpen(false)}
            className="max-h-[360px]"
            searchItems={searchItems}
          />
        </div>
      ) : null}
      {open && mode === 'modal'
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-24 backdrop-blur-sm">
              <button
                type="button"
                aria-label="Close search"
                className="absolute inset-0 cursor-default"
                onClick={() => setOpen(false)}
              />
              <div className="relative w-full max-w-[640px]">
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => setOpen(false)}
                  className="absolute -right-2 -top-2 z-2 grid size-8 place-items-center rounded-full border bg-fd-popover text-fd-muted-foreground shadow-lg transition-colors hover:text-fd-foreground"
                >
                  <X className="size-4" />
                </button>
                <CognitiveSearchPanel
                  initialSearch=""
                  onClose={() => setOpen(false)}
                  searchItems={searchItems}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

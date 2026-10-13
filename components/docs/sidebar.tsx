'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Book,
  FlaskConical,
  Cpu,
  Check,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  SidebarIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { FumadocsIcon } from '@/components/fumadocs-icon';
import { GithubMark, ThemeToggle } from '@/components/site-header';
import { CognitiveSearchTrigger } from '@/components/cognitive-search';

const sections = [
  {
    title: 'Handbook',
    description: 'AI systems course',
    href: '/docs',
    color: 'var(--brand)',
    icon: BookOpen,
    filter: 'handbook',
  },
  {
    title: 'Long Form',
    description: 'Deep-dive chapters',
    href: '/docs/part-01-foundations/chapter-01-from-prompt-to-production',
    color: 'var(--accent)',
    icon: Book,
    filter: 'long-form',
  },
  {
    title: 'ML Fundamentals',
    description: 'Classical ML from scratch',
    href: '/docs/ml-fundamentals',
    color: 'oklch(0.7 0.15 140)',
    icon: FlaskConical,
    filter: 'ml-fundamentals',
  },
  {
    title: 'LLM Fundamentals',
    description: 'How language models work',
    href: '/docs/llm-fundamentals',
    color: 'var(--fd-primary)',
    icon: Cpu,
    filter: 'llm-fundamentals',
  },
] as const;

export function DocsSidebar({
  docs,
  groups,
  searchItems,
}: {
  docs: any[];
  groups: any[];
  searchItems: any[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const selected = useMemo(
    () => {
      if (pathname.startsWith('/docs/ml-fundamentals')) {
        return sections.find((s) => s.filter === 'ml-fundamentals')!;
      }
      if (pathname.startsWith('/docs/llm-fundamentals') || pathname.match(/^\/docs\/appendix-[a-z]-/)) {
        return sections.find((s) => s.filter === 'llm-fundamentals')!;
      }
      if (pathname.match(/^\/docs\/part-\d+-/) || pathname.startsWith('/docs/long-form')) {
        return sections.find((s) => s.filter === 'long-form')!;
      }
      return sections[0];
    },
    [pathname],
  );
  const fullSidebarTree = useMemo(() => buildSidebarTree(docs), [docs]);
  
  // Filter sidebar tree based on selected section
  const sidebarTree = useMemo(() => {
    switch (selected.filter) {
      case 'ml-fundamentals':
        return fullSidebarTree.filter((s) => s.page.slug[0] === 'ml-fundamentals');
      case 'llm-fundamentals':
        return fullSidebarTree.filter((s) =>
          s.page.slug[0] === 'llm-fundamentals' || s.page.slug[0]?.startsWith('appendix-')
        );
      case 'long-form':
        return fullSidebarTree.filter((s) =>
          s.page.slug[0]?.startsWith('part-') || s.page.slug[0] === 'long-form'
        );
      default:
        // Handbook: everything except the dedicated sections
        return fullSidebarTree.filter((s) =>
          !s.page.slug[0]?.startsWith('part-') &&
          !s.page.slug[0]?.startsWith('appendix-') &&
          s.page.slug[0] !== 'ml-fundamentals' &&
          s.page.slug[0] !== 'llm-fundamentals' &&
          s.page.slug[0] !== 'long-form'
        );
    }
  }, [fullSidebarTree, selected.filter]);

  useEffect(() => {
    // Find active section
    const activeSection = sidebarTree.find(
      (section) =>
        isActivePage(pathname, section.page.slug) ||
        section.chapters.some(
          (chapter) =>
            isActivePage(pathname, chapter.page.slug) ||
            chapter.children.some((child) => isActivePage(pathname, child.page.slug)),
        ),
    );

    if (activeSection) {
      setOpenGroups((current) => ({ ...current, [activeSection.page.slug[0]]: true }));

      // Find active chapter
      const activeChapter = activeSection.chapters.find(
        (chapter) =>
          isActivePage(pathname, chapter.page.slug) ||
          chapter.children.some((child) => isActivePage(pathname, child.page.slug)),
      );
      if (activeChapter) {
        setOpenChapters((current) => ({ ...current, [activeChapter.page.slug.join('/')]: true }));
      }
    }
  }, [sidebarTree, pathname]);

  return (
    <aside
      id="nd-sidebar"
      className="hidden w-[300px] shrink-0 border-e bg-fd-card text-sm lg:block"
    >
      <div className="fd-scroll-container sticky top-0 flex h-dvh flex-col overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3 pb-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-[0.9375rem] font-medium me-auto"
            >
              <FumadocsIcon className="size-5" />
              <span>AI Systems</span>
            </Link>
            <button
              aria-label="Toggle sidebar"
              className="inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <SidebarIcon className="size-4" />
            </button>
          </div>
          <CognitiveSearchTrigger searchItems={searchItems} />
          {/* Note: Kept the Switcher UI untouched for future extensions. It currently acts as a global quick link menu. */}
          <div className="relative">
            <button
              onClick={() => setOpen((value) => !value)}
              className="flex w-full items-center gap-2.5 rounded-lg border bg-fd-secondary/50 p-2 text-start text-fd-secondary-foreground transition-colors hover:bg-fd-accent cursor-pointer"
            >
              <span
                className="flex size-6 items-center justify-center rounded-md border"
                style={{
                  backgroundColor: `color-mix(in srgb, ${selected.color} 12%, transparent)`,
                  borderColor: `color-mix(in srgb, ${selected.color} 24%, transparent)`,
                  color: selected.color,
                }}
              >
                <selected.icon className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-none">{selected.title}</span>
                <span className="mt-1 block truncate text-[0.8125rem] text-fd-muted-foreground">
                  {selected.description}
                </span>
              </span>
              <ChevronsUpDown className="ms-auto size-4 shrink-0 text-fd-muted-foreground" />
            </button>
            {open ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-40 rounded-xl border bg-fd-popover p-1 text-fd-popover-foreground shadow-lg">
                {sections.map((section) => {
                  const active = section.title === selected.title;

                  return (
                    <Link
                      key={section.title}
                      href={section.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
                    >
                      <span
                        className="flex size-6 items-center justify-center rounded-md border"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${section.color} 12%, transparent)`,
                          borderColor: `color-mix(in srgb, ${section.color} 24%, transparent)`,
                          color: section.color,
                        }}
                      >
                        <section.icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-none">
                          {section.title}
                        </span>
                        <span className="mt-1 block truncate text-[0.8125rem] text-fd-muted-foreground">
                          {section.description}
                        </span>
                      </span>
                      <Check
                        className={cn(
                          'ms-auto size-3.5 shrink-0 text-fd-primary',
                          !active && 'invisible',
                        )}
                      />
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
        <nav className="flex-1 space-y-1.5 pt-2">
          {sidebarTree.map((sectionNode) => {
            const groupSlug = sectionNode.page.slug[0];
            const activeGroup =
              isActivePage(pathname, sectionNode.page.slug) ||
              sectionNode.chapters.some(
                (chapter) =>
                  isActivePage(pathname, chapter.page.slug) ||
                  chapter.children.some((child) => isActivePage(pathname, child.page.slug)),
              );
            const expanded = openGroups[groupSlug] ?? activeGroup;

            if (sectionNode.chapters.length === 0) {
              return (
                <div key={groupSlug} className="rounded-lg">
                  <Link
                    href={`/docs/${sectionNode.page.slug.join('/')}`}
                    className={cn(
                      'flex min-h-8 w-full items-center gap-2 rounded-lg border border-transparent px-2.5 py-1 text-start text-[0.75rem] font-bold uppercase tracking-wide transition-colors hover:border-fd-border hover:bg-fd-accent/70 hover:text-fd-accent-foreground cursor-pointer',
                      activeGroup
                        ? 'border-fd-border bg-fd-accent text-fd-accent-foreground shadow-sm'
                        : 'text-fd-foreground',
                    )}
                  >
                    <BookOpen className="size-3.5 shrink-0 text-fd-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      {formatGroupTitle(sectionNode.page.title)}
                    </span>
                  </Link>
                </div>
              );
            }

            return (
              <div key={groupSlug} className="rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((current) => ({
                      ...current,
                      [groupSlug]: !(current[groupSlug] ?? activeGroup),
                    }))
                  }
                  className={cn(
                    'flex min-h-8 w-full items-center gap-2 rounded-lg border border-transparent px-2.5 py-1 text-start text-[0.75rem] font-bold uppercase tracking-wide transition-colors hover:border-fd-border hover:bg-fd-accent/70 hover:text-fd-accent-foreground cursor-pointer',
                    activeGroup
                      ? 'border-fd-border bg-fd-accent text-fd-accent-foreground shadow-sm'
                      : 'text-fd-foreground',
                  )}
                >
                  <BookOpen className="size-3.5 shrink-0 text-fd-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">
                    {formatGroupTitle(sectionNode.page.title)}
                  </span>
                  <span className="rounded bg-fd-secondary px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-fd-muted-foreground">
                    {sectionNode.chapters.length}
                  </span>
                  <ChevronRight
                    className={cn(
                      'size-3.5 shrink-0 text-fd-muted-foreground transition-transform',
                      expanded && 'rotate-90',
                    )}
                  />
                </button>
                {expanded ? (
                  <div className="ms-3 mt-1.5 space-y-1 border-s border-fd-border/75 ps-2">
                    {sectionNode.chapters.map((chapter) => {
                      const chapterSlug = chapter.page.slug.join('/');
                      const isChapterActive =
                        isActivePage(pathname, chapter.page.slug) ||
                        chapter.children.some((child) => isActivePage(pathname, child.page.slug));

                      return (
                        <ChapterNavItem
                          key={chapterSlug}
                          chapter={chapter}
                          pathname={pathname}
                          expanded={openChapters[chapterSlug] ?? isChapterActive}
                          onToggle={() =>
                            setOpenChapters((current) => ({
                              ...current,
                              [chapterSlug]: !(current[chapterSlug] ?? isChapterActive),
                            }))
                          }
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
        <div className="sticky bottom-0 mt-8 bg-fd-card pt-4">
          <div className="flex items-center rounded-lg border bg-fd-secondary/50 p-0.5 pe-0 text-fd-muted-foreground">
            <a
              href="https://github.com/FirePheonix/cognitive"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Github"
              className="inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <GithubMark className="size-4" />
            </a>
            <ThemeToggle className="ms-auto h-8 rounded-none border-y-0 border-e-0 bg-transparent px-1" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function ChapterNavItem({
  chapter,
  pathname,
  expanded,
  onToggle,
}: {
  chapter: ChapterNode;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const href = `/docs/${chapter.page.slug.join('/')}`;
  const active = isActivePage(pathname, chapter.page.slug);
  const activeChild = chapter.children.some((child) => isActivePage(pathname, child.page.slug));
  const hasChildren = chapter.children.length > 0;

  if (!hasChildren) {
    return (
      <Link href={href} className={navLinkClass(active)}>
        <FileText className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate">{cleanTitle(chapter.page.title)}</span>
      </Link>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? 'Collapse chapter' : 'Expand chapter'}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground cursor-pointer"
        >
          <ChevronRight className={cn('size-3.5 transition-transform', expanded && 'rotate-90')} />
        </button>
        <Link
          href={href}
          className={cn(
            'min-w-0 flex-1 rounded-md border border-transparent px-2.5 py-1.5 text-[0.8125rem] font-semibold leading-5 transition-colors hover:border-fd-border hover:bg-fd-accent/60 hover:text-fd-accent-foreground',
            active || activeChild ? 'text-fd-foreground' : 'text-fd-muted-foreground',
            active && 'bg-brand/10 text-brand border-brand/20 shadow-sm',
          )}
        >
          <span className="block truncate">{cleanTitle(chapter.page.title)}</span>
        </Link>
      </div>
      {expanded ? (
        <div className="ms-3 mt-1.5 space-y-1 border-s border-dashed border-fd-border/70 ps-3">
          {chapter.children.map((child) => (
            <Link
              key={child.page.slug.join('/')}
              href={`/docs/${child.page.slug.join('/')}`}
              className={navLinkClass(isActivePage(pathname, child.page.slug), true)}
            >
              {cleanTitle(child.page.title)}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function isActivePage(pathname: string, slug: string[]) {
  const href = `/docs/${slug.join('/')}`;
  return pathname === href || (pathname === '/docs' && slug.length === 1 && slug[0] === 'overview');
}

type SubchapterNode = {
  page: any;
};

type ChapterNode = {
  page: any;
  children: SubchapterNode[];
};

type SectionNode = {
  page: any;
  chapters: ChapterNode[];
};

function buildSidebarTree(docs: any[]): SectionNode[] {
  const sections = docs.filter((p) => p.slug.length === 1);
  return sections.map((sectionPage) => {
    const chaptersForSection = docs.filter(
      (p) => p.slug.length === 2 && p.slug[0] === sectionPage.slug[0],
    );

    return {
      page: sectionPage,
      chapters: chaptersForSection.map((chapterPage) => {
        const subchaptersForChapter = docs.filter(
          (p) =>
            p.slug.length === 3 &&
            p.slug[0] === chapterPage.slug[0] &&
            p.slug[1] === chapterPage.slug[1],
        );

        return {
          page: chapterPage,
          children: subchaptersForChapter.map((p) => ({ page: p })),
        };
      }),
    };
  });
}

function navLinkClass(active: boolean, child = false) {
  return cn(
    'relative flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-[0.8125rem] font-medium leading-5 transition-colors hover:border-fd-border hover:bg-fd-accent/60 hover:text-fd-accent-foreground',
    child && 'py-1 text-[0.75rem] font-normal hover:bg-fd-accent/40',
    active
      ? 'bg-brand/10 text-brand border-brand/20 shadow-sm font-semibold'
      : 'text-fd-muted-foreground',
  );
}

function formatGroupTitle(group: string) {
  // Handle appendix titles: "Appendix A — Foundations..." -> "A. Foundations..."
  const appendixMatch = group.match(/^Appendix\s+([A-Z])\s*[—–-]\s*(.+)$/i);
  if (appendixMatch) {
    return `${appendixMatch[1]}. ${appendixMatch[2]}`;
  }
  // Handle part titles: "Part I — Foundations" -> "I. Foundations"
  const partMatch = group.match(/^Part\s+([IVX]+)\s*[—–-]\s*(.+)$/i);
  if (partMatch) {
    return `${partMatch[1]}. ${partMatch[2]}`;
  }
  return group.replace(':', ' - ');
}

function cleanTitle(title: string) {
  return title.replace(/\s+-\s+Overview$/, '').replace(/^Chapter\s+(\d+)\s*[-:]\s*/, '$1. ');
}

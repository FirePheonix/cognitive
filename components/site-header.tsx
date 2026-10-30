'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  AlbumIcon,
  BookOpen,
  Boxes,
  ChevronDown,
  FileCode2,
  LayoutTemplate,
  Moon,
  Star,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { CognitiveSearchTrigger } from '@/components/cognitive-search';

const GITHUB_REPO = 'FirePheonix/cognitive';
const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;

const navItems = [
  { href: '/books', label: 'Books', icon: BookOpen },
  { href: '/cognitive-notes', label: 'Cognitive Notes', icon: FileCode2 },
  { href: '/newsletter', label: 'Newsletter', icon: AlbumIcon },
];

const documentationItems = [
  {
    href: '/docs',
    title: 'AI Concepts',
    description: 'Explore modern AI engineering concepts and patterns.',
    icon: BookOpen,
  },
  {
    href: '/docs/appendices/appendix-b-engineering-patterns',
    title: 'Appendices',
    description: 'Core concepts, patterns, checklists, and glossary.',
    icon: LayoutTemplate,
  },
];

export function SiteHeader() {
  const pathname = usePathname();

  if (pathname.startsWith('/docs')) return null;

  return (
    <header id="nd-nav" className="sticky top-0 z-40 h-14">
      <div className="border-b bg-fd-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center px-4">
          <Link href="/" className="inline-flex items-center gap-2.5 font-semibold">
            <span
              aria-hidden="true"
              className="size-9 bg-[#1b1b1b] dark:bg-white"
              style={{
                maskImage: 'url(/no-bg-icon.svg)',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                maskSize: 'contain',
                WebkitMaskImage: 'url(/no-bg-icon.svg)',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                WebkitMaskSize: 'contain',
              }}
            />
            <span>Cognitive</span>
          </Link>

          <nav className="hidden flex-row items-center gap-2 px-6 text-sm sm:flex">
            <DocumentationMenu pathname={pathname} />
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1 p-2 text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground',
                  pathname.startsWith(item.href) && 'text-fd-primary',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ms-auto hidden flex-row items-center justify-end gap-1.5 lg:flex">
            <CognitiveSearchTrigger
              mode="dropdown"
              className="h-9 max-w-[240px] rounded-full bg-fd-secondary"
            />
            <ThemeToggle />
            <GithubStarsLink />
          </div>

          <div className="ms-auto flex flex-row items-center -me-1.5 lg:hidden">
            <CognitiveSearchTrigger className="size-10 justify-center rounded-md border-0 bg-transparent p-2 [&_kbd]:hidden [&_span]:hidden" />
            <button
              aria-label="Open menu"
              className="inline-flex size-10 items-center justify-center rounded-md p-2 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function DocumentationMenu({ pathname }: { pathname: string }) {
  const active = pathname.startsWith('/docs');

  return (
    <div className="group relative">
      <Link
        href="/docs"
        className={cn(
          'inline-flex items-center gap-1 p-2 text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground',
          active && 'text-fd-primary',
        )}
      >
        Learn
        <ChevronDown className="size-3 transition-transform group-hover:rotate-180" />
      </Link>
      <div className="invisible absolute left-0 top-full z-50 w-[620px] translate-y-2 pt-2 opacity-0 transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="rounded-xl border bg-fd-popover/90 p-3 text-fd-popover-foreground shadow-lg backdrop-blur-md">
          <div className="grid grid-cols-2 gap-2">
            {documentationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-2 rounded-lg border bg-fd-card p-3 transition-colors hover:bg-fd-accent/80 hover:text-fd-accent-foreground"
              >
                <div className="w-fit rounded-md border bg-fd-muted p-1">
                  <item.icon className="size-4" />
                </div>
                <p className="text-base font-medium">{item.title}</p>
                <p className="text-sm text-fd-muted-foreground">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const value = mounted ? resolvedTheme : 'dark';

  return (
    <div
      className={cn(
        'inline-flex h-9 items-center rounded-full border bg-fd-secondary p-1 text-fd-muted-foreground',
        className,
      )}
      data-theme-toggle=""
    >
      <button
        aria-label="Light"
        onClick={() => setTheme('light')}
        className={cn(
          'grid size-7 place-items-center rounded-full transition-colors',
          value === 'light' && 'bg-fd-background text-fd-foreground shadow-sm',
        )}
      >
        <Sun className="size-4" />
      </button>
      <button
        aria-label="Dark"
        onClick={() => setTheme('dark')}
        className={cn(
          'grid size-7 place-items-center rounded-full transition-colors',
          value === 'dark' && 'bg-fd-background text-fd-foreground shadow-sm',
        )}
      >
        <Moon className="size-4" />
      </button>
    </div>
  );
}

function formatStarCount(count: number) {
  if (count >= 1000) {
    const compact = count / 1000;
    return `${compact >= 10 ? Math.round(compact) : compact.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(count);
}

function GithubStarsLink() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data: { stargazers_count?: number }) => {
        if (cancelled) return;
        if (typeof data.stargazers_count === 'number') setStars(data.stargazers_count);
      })
      .catch(() => {
        // Non-critical social proof — keep the GitHub link without a count.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={stars === null ? 'GitHub' : `GitHub repository, ${stars} stars`}
      className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
    >
      <GithubMark className="size-4" />
      <Star className="size-3.5 fill-current" aria-hidden />
      <span className="min-w-[1.25rem] text-xs font-medium tabular-nums">
        {stars === null ? '—' : formatStarCount(stars)}
      </span>
    </a>
  );
}

export function GithubMark({ className }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <title>GitHub</title>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

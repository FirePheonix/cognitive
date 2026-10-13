import Link from 'next/link';
import Image from 'next/image';
import { marked } from 'marked';
import { createHighlighter } from 'shiki';
import katex from 'katex';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  MessageCircle,
  MoreHorizontal,
  ThumbsDown,
  ThumbsUp,
  User,
} from 'lucide-react';
import { docPages, getDocBySlug, type DocPage } from '@/content/docs/docs-server';
import { DocsDesktopToc, DocsMobileToc } from '@/components/docs/toc';
import { cn } from '@/lib/cn';
import { MermaidInitializer } from '@/components/mermaid-initializer';
import { PlotlyInitializer } from '@/components/plotly-initializer';
import { NotebookBlock } from '@/components/notebook-renderer';
import { DocAudioPlayer } from '@/components/doc-audio-player';

import { redirect } from 'next/navigation';

export default async function DocsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  if (slug.length === 0) {
    redirect(
      '/docs/part-01-foundations/chapter-01-from-prompt-to-production/11-the-lifecycle-of-an-ai-request',
    );
  }
  const page = getDocBySlug(slug);

  if (!page) {
    return (
      <main className="min-w-0 px-6 py-10 md:px-10 xl:px-8">
        <div className="mx-auto max-w-[760px]">
          <h1 className="text-2xl font-medium tracking-tight">Not found</h1>
          <p className="mt-2 text-sm text-fd-muted-foreground">This doc page does not exist.</p>
          <Link
            href="/docs"
            className="mt-6 inline-flex justify-center rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground"
          >
            Go to Getting Started
          </Link>
        </div>
      </main>
    );
  }

  const toc = page.toc ?? [];
  const { segments, notebooks } = await renderMarkdown(page.body);
  const { previous, next } = getSiblingPages(page);

  return (
    <>
      <DocsMobileToc items={toc} />

      <main className="min-w-0 px-6 py-10 md:px-10 xl:px-14">
        <article className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-[760px] flex-col">
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-fd-muted-foreground">
            <Link href="/docs" className="transition-colors hover:text-fd-foreground">
              Docs
            </Link>
            <ChevronRight className="size-3.5" />
            <span>{page.group}</span>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight text-fd-foreground md:text-4xl">
            {page.title}
          </h1>

          {page.description ? (
            <p className="mt-3 text-lg leading-relaxed text-fd-muted-foreground">
              {page.description}
            </p>
          ) : null}

          {/* Meta Line */}
          {(page.author || page.lastUpdatedDate) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-fd-muted-foreground">
              {page.author && (
                <>
                  {page.authorSocials ? (
                    <a
                      href={page.authorSocials}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-fd-foreground hover:text-brand transition-colors"
                    >
                      {page.author}
                    </a>
                  ) : (
                    <span className="font-medium text-fd-foreground">{page.author}</span>
                  )}
                </>
              )}

              {page.author && page.lastUpdatedDate && <span>·</span>}

              {page.lastUpdatedDate && <span>Updated {page.lastUpdatedDate}</span>}

              {page.group && (
                <>
                  <span>·</span>
                  <span>{page.group}</span>
                </>
              )}
            </div>
          )}

          {/* Controls Bar: Sleek Audio Pill + Action Buttons inline */}
          <div className="mt-4 mb-6 flex flex-wrap items-center gap-2.5">
            {page.audio && <DocAudioPlayer src={page.audio} />}

            <ActionButton>
              <Copy className="size-3.5" />
              md for AI Agents
            </ActionButton>
          </div>

          {/* Hero Thumbnail Banner */}
          {page.thumbnail && (
            <div className="mb-8 overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-lg">
              <Image
                src={page.thumbnail}
                alt={page.title}
                width={800}
                height={450}
                className="w-full h-auto object-cover max-h-[480px]"
              />
            </div>
          )}

          <div className="md prose flex-1 text-fd-foreground/90">
            {segments.map((seg, i) => (
              <span key={i}>
                <span dangerouslySetInnerHTML={{ __html: seg }} />
                {notebooks[i] && <NotebookBlock data={notebooks[i]} />}
              </span>
            ))}
            <MermaidInitializer html={segments.join('')} />
            <PlotlyInitializer html={segments.join('')} />
          </div>

          <div className="mt-12 border-t pt-6">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-fd-muted-foreground">Question? Give us feedback</span>
              <button className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground">
                <ThumbsUp className="size-3.5" />
                Good
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground">
                <ThumbsDown className="size-3.5" />
                Bad
              </button>
            </div>
          </div>

          <FooterNav previous={previous} next={next} />
          <p className="mt-6 text-sm text-fd-muted-foreground">
            Last updated on {page.lastUpdatedDate || 'August 5, 2026'}
          </p>
        </article>
      </main>

      <DocsDesktopToc items={toc} />

      <button className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-2xl border bg-fd-card px-4 py-3 text-sm font-medium shadow-xl transition-colors hover:bg-fd-accent">
        <MessageCircle className="size-4" />
        Ask AI
      </button>
    </>
  );
}

function ActionButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-lg border bg-fd-secondary px-3 py-2 text-sm text-fd-secondary-foreground transition-colors hover:bg-fd-accent">
      {children}
    </button>
  );
}

function ActionIcon({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-lg border bg-fd-secondary text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
    >
      {children}
    </button>
  );
}

function FooterNav({ previous, next }: { previous?: DocPage; next?: DocPage }) {
  if (!previous && !next) return null;

  return (
    <div className={cn('mt-10 grid gap-4', previous && next ? 'grid-cols-2' : 'grid-cols-1')}>
      {previous ? <FooterItem item={previous} direction="previous" /> : null}
      {next ? <FooterItem item={next} direction="next" /> : null}
    </div>
  );
}

function FooterItem({ item, direction }: { item: DocPage; direction: 'previous' | 'next' }) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
  const itemHref = item.slug.length > 0 ? `/docs/${item.slug.join('/')}` : `/docs`;

  return (
    <Link
      href={itemHref}
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-fd-accent/80 hover:text-fd-accent-foreground max-sm:col-span-full',
        direction === 'next' && 'text-end',
      )}
    >
      <div
        className={cn(
          'inline-flex items-center gap-1.5 font-medium',
          direction === 'next' && 'flex-row-reverse',
        )}
      >
        <Icon className="-mx-1 size-4 shrink-0" />
        <p>{item.title}</p>
      </div>
      <p className="truncate text-fd-muted-foreground">
        {item.description ?? (direction === 'previous' ? 'Previous Page' : 'Next Page')}
      </p>
    </Link>
  );
}

function getSiblingPages(page: DocPage) {
  const index = docPages.findIndex((item) => item.slug.join('/') === page.slug.join('/'));

  return {
    previous: index > 0 ? docPages[index - 1] : undefined,
    next: index >= 0 && index < docPages.length - 1 ? docPages[index + 1] : undefined,
  };
}

// Shiki highlighter — initialised once per request (cached by Next.js module cache)
let _highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;
async function getHighlighter() {
  if (!_highlighter) {
    _highlighter = await createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: [
        'python',
        'typescript',
        'javascript',
        'tsx',
        'jsx',
        'json',
        'bash',
        'shell',
        'text',
        'plaintext',
        'html',
        'css',
        'markdown',
        'yaml',
        'toml',
      ],
    });
  }
  return _highlighter;
}

async function renderMarkdown(markdown: string): Promise<{
  segments: string[];
  notebooks: any[];
}> {
  const notebooks: any[] = [];
  const hl = await getHighlighter();
  const renderer = new marked.Renderer();

  renderer.heading = ({ tokens, depth }) => {
    const text = tokens.map((token: any) => token.raw).join('');
    const id = slugify(text);
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };

  renderer.code = (token: any) => {
    if (token.lang === 'mermaid') {
      return `<div class="mermaid">${token.text}</div>`;
    }
    // Display math block: ```math ... ```
    if (token.lang === 'math') {
      try {
        const html = katex.renderToString(token.text.trim(), {
          displayMode: true,
          throwOnError: false,
          output: 'html',
        });
        return `<div class="math-display">${html}</div>`;
      } catch {
        return `<pre><code>${token.text}</code></pre>`;
      }
    }
    // Interactive chart block: ```plotly { "recipe": "..." } or raw Plotly JSON
    if (token.lang === 'plotly') {
      const escaped = token.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div class="plotly-chart not-prose"><script type="application/json">${token.text}</script></div>`;
    }
    if (token.lang === 'notebook') {
      try {
        const data = JSON.parse(token.text);
        // Pre-highlight every code cell so the client component can render
        // syntax-highlighted HTML without needing a client-side highlighter.
        const supportedLangs = hl.getLoadedLanguages();
        const highlightedCells = (data.cells ?? []).map((cell: any) => {
          if (cell.type !== 'code') return cell;
          const cellLang = cell.lang ?? 'python';
          const lang = supportedLangs.includes(cellLang) ? cellLang : 'python';
          const highlightedHtml = hl.codeToHtml(cell.source, {
            lang,
            themes: { light: 'github-light', dark: 'github-dark' },
            defaultColor: false,
          });
          return { ...cell, highlightedSource: highlightedHtml };
        });
        const idx = notebooks.length;
        notebooks.push({ ...data, cells: highlightedCells });
        return `<!--NOTEBOOK:${idx}-->`;
      } catch {
        return `<pre><code class="language-json">${token.text}</code></pre>`;
      }
    }

    // Resolve language — fall back to plaintext if not supported
    const rawLang = token.lang || '';
    const supportedLangs = hl.getLoadedLanguages();
    const lang = supportedLangs.includes(rawLang) ? rawLang : 'plaintext';

    const highlighted = hl.codeToHtml(token.text, {
      lang,
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false, // emit both themes via CSS vars
    });

    // Wrap in our own container so we can style it consistently
    return `<div class="shiki-wrapper">${highlighted}</div>`;
  };

  // Pre-process inline math: $...$ → rendered KaTeX span
  // Also handles $$...$$ display math written inline (not in code blocks)
  const processedMarkdown = markdown
    // $$...$$ display math (inline style, not in code blocks)
    .replace(/\$\$([^$]+?)\$\$/g, (_match, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false, output: 'html' });
      } catch {
        return `$$${tex}$$`;
      }
    })
    // $...$ inline math
    .replace(/\$([^$\n]+?)\$/g, (_match, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false, output: 'html' });
      } catch {
        return `$${tex}$`;
      }
    });

  const html = await marked.parse(processedMarkdown, { renderer });
  // Split on sentinel comments → alternating html / notebook slots
  const segments = html.split(/<!--NOTEBOOK:\d+-->/);
  return { segments, notebooks };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// No generateStaticParams — pages render on demand (SSR) and are cached
// by Vercel's CDN on first hit. Static export was exhausting build disk space.
export const dynamicParams = true;

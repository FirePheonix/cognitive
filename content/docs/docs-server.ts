import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const DOCS_ROOT = path.join(process.cwd(), "content", "docs", "mdx");

export type DocPage = {
  slug: string[];
  title: string;
  description: string;
  group: string;
  toc?: { title: string; depth: number }[];
  body: string;
  parentSlug?: string[];
  parentTitle?: string;
  isChapterOverview?: boolean;
  thumbnail?: string;
  author?: string;
  authorSocials?: string;
  audio?: string;
  lastUpdatedDate?: string;
};

export type DocCategory = {
  name: string;
  items: {
    title: string;
    href: string;
  }[];
};

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getMarkdownHeadings(markdown: string): { title: string; depth: number }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { title: string; depth: number }[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    headings.push({
      title: match[2].trim().replace(/\s+#+\s*$/, ""),
      depth: match[1].length,
    });
  }
  return headings;
}

function collectMarkdownFiles(dir: string, acc: string[]) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectMarkdownFiles(abs, acc);
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))) {
      acc.push(abs);
    }
  }
}

// Cache overview titles so we can set parentTitle correctly
const overviewTitles = new Map<string, string>();

export function getAllDocs(): DocPage[] {
  if (!fs.existsSync(DOCS_ROOT)) return [];
  const files: string[] = [];
  collectMarkdownFiles(DOCS_ROOT, files);

  // First pass: gather overview titles to map parentTitle
  const rawPages = files.map((absPath) => {
    const rel = path.relative(DOCS_ROOT, absPath);
    let noExt = rel.replace(/\.mdx?$/, "");
    let segments = noExt.split(path.sep).filter(Boolean);
    let isChapterOverview = false;

    const lastSegment = segments[segments.length - 1];
    if (lastSegment === "00-overview" || lastSegment === "index") {
      segments.pop();
      isChapterOverview = true;
    }

    if (segments.length === 1 && segments[0] === 'overview') {
      segments = [];
      isChapterOverview = true;
    }

    const source = fs.readFileSync(absPath, "utf8");
    const parsed = matter(source);
    const data = parsed.data;
    const body = parsed.content.trim();

    const title = data.title ?? titleCase(segments[segments.length - 1] ?? "Overview");

    if (isChapterOverview) {
      overviewTitles.set(segments.join("/"), title);
    }

    return {
      slug: segments,
      title,
      description: data.description ?? "",
      group: data.category ?? data.group ?? titleCase(segments[0] ?? "Start Here"),
      body,
      isChapterOverview,
      thumbnail: data.thumbnail ?? data.image ?? undefined,
      author: data.author ?? undefined,
      authorSocials: data.authorSocials ?? data.author_socials ?? data.authorSocial ?? undefined,
      audio: data.audio ?? undefined,
      lastUpdatedDate: data.lastUpdatedDate
        ? String(data.lastUpdatedDate)
        : data.last_updated
        ? String(data.last_updated)
        : undefined,
    };
  });

  return rawPages.map((page) => {
    const parentSlug = page.slug.length > 1 ? page.slug.slice(0, -1) : undefined;
    let parentTitle: string | undefined = undefined;
    if (parentSlug) {
      const parentKey = parentSlug.join("/");
      parentTitle = overviewTitles.get(parentKey) ?? titleCase(parentSlug[parentSlug.length - 1]);
    }

    return {
      ...page,
      parentSlug,
      parentTitle,
      toc: getMarkdownHeadings(page.body),
    } satisfies DocPage;
  })
  .sort((a, b) => {
    // We want the overview of each folder to be sorted first
    const aPath = a.slug.join("/");
    const bPath = b.slug.join("/");
    if (aPath === bPath) {
      return a.isChapterOverview ? -1 : 1;
    }
    return aPath.localeCompare(bPath, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export function getDocBySlug(slug: string[]) {
  const normalized = slug.length ? slug : [];
  const joinedSlug = normalized.join("/");
  return getAllDocs().find((doc) => doc.slug.join("/") === joinedSlug) ?? null;
}

export const docPages = getAllDocs();
export const docGroups = [
  'Start Here',
  ...Array.from(new Set(docPages.map((page) => page.group))).filter((group) => group !== 'Start Here'),
];

// Slim navigation-only view — no body content, safe to pass to client components
export type DocNavItem = {
  slug: string[];
  title: string;
  group: string;
  parentSlug?: string[];
  parentTitle?: string;
  isChapterOverview?: boolean;
};

export const docNavItems: DocNavItem[] = docPages.map(
  ({ slug, title, group, parentSlug, parentTitle, isChapterOverview }) => ({
    slug, title, group, parentSlug, parentTitle, isChapterOverview,
  }),
);

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function getSearchItems(docs: DocPage[]): any[] {
  return docs.flatMap((page) => {
    const url = page.slug.length > 0 ? `/docs/${page.slug.join('/')}` : `/docs`;
    const breadcrumbs = [page.group, page.parentTitle].filter(Boolean) as string[];
    const description = page.description ?? page.parentTitle ?? page.group;

    const pageItem = {
      id: `page:${page.slug.join('/')}`,
      type: 'page',
      breadcrumbs,
      content: page.title,
      description,
      url,
      // page.body intentionally excluded — it's too large to serialize into
      // the client bundle (causes 34MB+ ISR payloads on Vercel)
      searchable: normalizeSearchText(
        [page.title, description, page.group, page.parentTitle].join(' '),
      ),
    };

    const headingItems = (page.toc ?? []).map((heading) => ({
      id: `heading:${page.slug.join('/')}:${heading.title}`,
      type: 'heading',
      breadcrumbs: [...breadcrumbs, page.title],
      content: heading.title,
      description,
      url: `${url}#${slugifyHeading(heading.title)}`,
      searchable: normalizeSearchText([heading.title, page.title, description].join(' ')),
    }));

    return [pageItem, ...headingItems];
  });
}

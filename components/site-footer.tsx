import Image from 'next/image';
import Link from 'next/link';
import { GithubMark } from '@/components/site-header';

const footerGroups = [
  {
    title: 'Explore',
    links: [
      { href: '/docs', label: 'Library' },
      { href: '/books', label: 'Books' },
      { href: '/docs/overview', label: 'Overview' },
      { href: '/newsletter', label: 'Newsletter' },
    ],
  },
  {
    title: 'Topics',
    links: [
      { href: '/docs/part-01-foundations', label: 'Foundations' },
      { href: '/docs/part-04-retrieval-systems', label: 'Retrieval' },
      { href: '/docs/part-07-ai-security', label: 'Security' },
    ],
  },
  {
    title: 'Community',
    links: [
      { href: 'https://github.com/FirePheonix/cognitive', label: 'GitHub' },
      { href: 'https://x.com/shubhamm069', label: 'X' },
      { href: 'https://www.linkedin.com/in/shubham-singh-8a5643198/', label: 'LinkedIn' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-20 w-full max-w-[1400px] px-4 pb-8 md:px-6">
      <div className="overflow-hidden rounded-2xl border bg-fd-card text-fd-card-foreground shadow-sm">
        <div className="grid gap-10 px-6 py-8 md:grid-cols-[1.15fr_1.85fr] md:px-10 md:py-10">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Image
                src="/cognitive-icon-light.png"
                alt="Cognitive"
                width={96}
                height={96}
                className="size-16 rounded-xl object-cover dark:hidden"
              />
              <Image
                src="/cognitive-icon-dark.png"
                alt="Cognitive"
                width={96}
                height={96}
                className="hidden size-16 rounded-xl object-cover dark:block"
              />
              <div>
                <p className="text-3xl font-light leading-none tracking-tight">Cognitive</p>
                <p className="mt-1 text-sm text-fd-muted-foreground">
                  Open AI knowledge for engineers.
                </p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-fd-muted-foreground">
              Community-maintained explainers, diagrams, and handbooks for understanding the AI
              systems that are becoming production infrastructure.
            </p>
            <div className="flex gap-2">
              <a
                href="https://github.com/FirePheonix/cognitive"
                aria-label="GitHub"
                className="inline-flex size-9 items-center justify-center rounded-lg border bg-fd-background text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              >
                <GithubMark className="size-4" />
              </a>
              <a
                href="https://x.com/shubhamm069"
                aria-label="X (Twitter)"
                className="inline-flex size-9 items-center justify-center rounded-lg border bg-fd-background text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/shubham-singh-8a5643198/"
                aria-label="LinkedIn"
                className="inline-flex size-9 items-center justify-center rounded-lg border bg-fd-background text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              >
                <span className="text-xs font-semibold">in</span>
              </a>
            </div>
          </div>

          <nav className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-3 text-sm font-medium text-fd-foreground">{group.title}</p>
                <ul className="space-y-2 text-sm text-fd-muted-foreground">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="transition-colors hover:text-fd-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t px-6 py-4 text-xs text-fd-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
          <p>2026 Cognitive. Community-maintained AI knowledge.</p>
          <p>Built for engineers tracking what comes next.</p>
        </div>
      </div>
    </footer>
  );
}

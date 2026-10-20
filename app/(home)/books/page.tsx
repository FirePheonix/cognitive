import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Books',
  description:
    'Three Cognitive books: ML Fundamentals, LLM Fundamentals, and New Concepts. Open a cover and jump into its chapters and appendices.',
};

type BookLink = {
  label: string;
  href: string;
};

type Book = {
  title: string;
  cover: string;
  href: string;
  meta: string;
  links: BookLink[];
};

const books: Book[] = [
  {
    title: 'ML Fundamentals',
    cover: '/01-ml.png',
    href: '/docs/ml-fundamentals',
    meta: '21 chapters',
    links: [
      {
        label: 'What is machine learning',
        href: '/docs/ml-fundamentals/chapter-01-what-is-machine-learning',
      },
      {
        label: 'Linear and logistic regression',
        href: '/docs/ml-fundamentals/chapter-02-linear-regression',
      },
      {
        label: 'Trees, SVMs, and ensembles',
        href: '/docs/ml-fundamentals/chapter-04-decision-trees',
      },
      {
        label: 'Evaluation and production',
        href: '/docs/ml-fundamentals/chapter-09-model-evaluation',
      },
    ],
  },
  {
    title: 'LLM Fundamentals',
    cover: '/02-llm-fundamentals.png',
    href: '/docs/llm-fundamentals',
    meta: '8 appendices · 36 lessons',
    links: [
      {
        label: 'Appendix A — Language representation',
        href: '/docs/appendix-a-foundations-of-language-representation',
      },
      {
        label: 'Appendix B — Before transformers',
        href: '/docs/appendix-b-learning-language-before-transformers',
      },
      {
        label: 'Appendix C — The transformer',
        href: '/docs/appendix-c-the-transformer-revolution',
      },
      {
        label: 'Appendix D — Building GPT',
        href: '/docs/appendix-d-building-gpt',
      },
      {
        label: 'Appendix E — From GPT to ChatGPT',
        href: '/docs/appendix-e-from-gpt-to-chatgpt',
      },
      {
        label: 'Appendix F — Beyond the model',
        href: '/docs/appendix-f-beyond-the-model',
      },
      {
        label: 'Appendix G — Modern LLM systems',
        href: '/docs/appendix-g-modern-llm-systems',
      },
      {
        label: 'Appendix H — New architectures',
        href: '/docs/appendix-h-new-architectures',
      },
    ],
  },
  {
    title: 'New Concepts',
    cover: '/03-new.png',
    href: '/docs/long-form',
    meta: '10 parts · 29 chapters',
    links: [
      {
        label: 'Part I — Foundations',
        href: '/docs/part-01-foundations',
      },
      {
        label: 'Part IV — Retrieval systems',
        href: '/docs/part-04-retrieval-systems',
      },
      {
        label: 'Part VII — AI security',
        href: '/docs/part-07-ai-security',
      },
      {
        label: 'Part X — Field notes',
        href: '/docs/part-10-field-notes',
      },
    ],
  },
];

function BookCard({ book }: { book: Book }) {
  return (
    <article className="flex flex-col rounded-2xl border bg-fd-card p-4 text-fd-card-foreground shadow-lg">
      <Link
        href={book.href}
        className="flex justify-center overflow-hidden rounded-xl border bg-[#111] px-6 py-6 transition-transform duration-300 hover:-translate-y-0.5"
      >
        <Image
          src={book.cover}
          alt={`${book.title} cover`}
          width={1024}
          height={1536}
          className="h-[340px] w-auto max-w-full rounded-sm shadow-xl"
        />
      </Link>

      <h2 className="mt-5 text-xl font-medium tracking-tight lg:text-2xl">{book.title}</h2>

      <ul className="mt-4 flex flex-col gap-2.5 text-sm">
        {book.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex gap-2 text-fd-muted-foreground transition-colors hover:text-brand"
            >
              <span className="text-brand" aria-hidden>
                +
              </span>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-5 w-fit rounded-full border bg-fd-secondary px-3 py-1.5 text-xs tracking-tight text-fd-muted-foreground">
        {book.meta}
      </p>

      <Link
        href={book.href}
        className="mt-auto inline-flex w-fit items-center gap-2 pt-6 text-sm font-medium tracking-tight transition-colors hover:text-brand"
      >
        Open
        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

export default function BooksPage() {
  return (
    <main className="px-4 pt-4 pb-6 text-landing-foreground md:px-6 dark:text-landing-foreground-dark">
      <div className="mx-auto w-full max-w-[1400px]">
        <header className="mb-10 max-w-2xl">
          <p className="w-fit rounded-full border border-brand/50 px-3 py-2 text-xs font-medium text-brand">
            Three books. One library.
          </p>
          <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight xl:text-5xl">
            The books behind
            <br />
            <span className="text-brand">the appendices.</span>
          </h1>
          <p className="mt-4 max-w-[560px] text-base leading-7 text-landing-foreground-200">
            Open a cover, then jump straight into the chapters and appendices that book is built
            from.
          </p>
        </header>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book.title} book={book} />
          ))}
        </div>
      </div>
    </main>
  );
}

import Image from 'next/image';
import { ArrowRight, BookOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';

type LearningPath = {
  tag: string;
  tagClass: string;
  title: string;
  image: string;
  imageLight: string;
  points: string[];
  modules?: number;
  lessons?: number;
  free?: number;
  comingSoon?: boolean;
};

const learningPaths: LearningPath[] = [
  {
    tag: 'Available',
    tagClass: 'border-brand/50 text-brand',
    title: 'Handbook',
    image: '/courses-images/handbook.png',
    imageLight: '/courses-images/handbook-light.png',
    points: ['AI systems course', 'Visual explainers end to end', 'Community-written handbooks'],
    modules: 12,
    lessons: 168,
    free: 16,
  },
  {
    tag: 'Available',
    tagClass: 'border-brand/50 text-brand',
    title: 'Long Form',
    image: '/courses-images/long-form.png',
    imageLight: '/courses-images/long-form-light.png',
    points: ['Deep-dive chapters', 'Architecture diagrams throughout', 'From foundations to production'],
    modules: 18,
    lessons: 200,
    free: 27,
  },
  {
    tag: 'Available',
    tagClass: 'border-emerald-400/60 text-emerald-300',
    title: 'ML Fundamentals',
    image: '/courses-images/ml-fundamentals.png',
    imageLight: '/courses-images/ml-fundamentals-light.png',
    points: ['Classical ML from scratch', 'Math that actually sticks', 'Build intuition, then code'],
    modules: 14,
    lessons: 122,
    free: 23,
  },
  {
    tag: 'Available',
    tagClass: 'border-sky-400/60 text-sky-300',
    title: 'LLM Fundamentals',
    image: '/courses-images/llm-fundamentals.png',
    imageLight: '/courses-images/llm-fundamentals-light.png',
    points: ['How language models work', 'Tokens, attention, training', 'From scratch to systems'],
    modules: 16,
    lessons: 102,
    free: 19,
  },
  {
    tag: 'Coming Soon',
    tagClass: 'border-white/25 text-white/70',
    title: 'System Design',
    image: '/courses-images/system-design.png',
    imageLight: '/courses-images/system-design-light.png',
    points: ['Notes and case studies', 'From-scratch implementations', 'Built for senior interviews'],
    comingSoon: true,
  },
  {
    tag: 'Coming Soon',
    tagClass: 'border-white/25 text-white/70',
    title: 'Advanced ML Maths',
    image: '/courses-images/ml-maths.png',
    imageLight: '/courses-images/ml-maths-light.png',
    points: ['Sets and logic to inference', 'Linear algebra and calculus', 'Interactive checks throughout'],
    comingSoon: true,
  },
  {
    tag: 'Coming Soon',
    tagClass: 'border-white/25 text-white/70',
    title: 'Inference Engineering & CUDA',
    image: '/courses-images/inference-cuda.png',
    imageLight: '/courses-images/inference-cuda-light.png',
    points: ['Latency and cost budgets', 'KV cache and batching math', 'CUDA kernels that matter'],
    comingSoon: true,
  },
  {
    tag: 'Coming Soon',
    tagClass: 'border-white/25 text-white/70',
    title: 'Neural Networks',
    image: '/courses-images/neural-networks.png',
    imageLight: '/courses-images/neural-networks-light.png',
    points: ['Build nets from scratch', 'Backprop you can feel', 'Modern architectures, explained'],
    comingSoon: true,
  },
  {
    tag: 'Coming Soon',
    tagClass: 'border-white/25 text-white/70',
    title: 'Cloud AI Deployment',
    image: '/courses-images/cloud-ai.png',
    imageLight: '/courses-images/cloud-ai-light.png',
    points: ['Ship models to production', 'Scale, cost, and reliability', 'Ops patterns for AI systems'],
    comingSoon: true,
  },
];

export function LearningPathsSection() {
  return (
    <section className="col-span-full">
      <div className="mb-8 max-w-2xl">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-brand uppercase">
          Pick your path
        </p>
        <h2 className="text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl">
          Choose where <span className="text-brand">to start</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-fd-muted-foreground md:text-base">
          Explore curated learning paths with handbooks, visual explainers, and community resources.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {learningPaths.map((path) => (
          <article
            key={path.title}
            className={cn(
              'group flex flex-col overflow-hidden rounded-2xl border border-fd-border bg-fd-card transition-colors',
              path.comingSoon ? 'opacity-90' : 'hover:border-brand/40',
            )}
          >
            <div className="relative aspect-[1685/934] overflow-hidden bg-black">
              <Image
                src={path.imageLight}
                alt=""
                fill
                className="object-cover object-center dark:hidden"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              />
              <Image
                src={path.image}
                alt=""
                fill
                className="hidden object-cover object-center dark:block"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              />

              <span
                className={cn(
                  'absolute left-3 top-3 z-10 inline-flex rounded-full border bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase backdrop-blur-sm',
                  path.tagClass,
                )}
              >
                {path.tag}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <h3 className="mb-3 text-xl font-semibold tracking-tight">{path.title}</h3>

              <ul className="mb-5 space-y-1.5 text-sm text-fd-muted-foreground">
                {path.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="mt-0.5 text-brand" aria-hidden>
                      →
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-wrap items-center gap-2">
                {path.comingSoon ? (
                  <span className="inline-flex items-center rounded-full border border-brand/40 bg-brand/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-brand uppercase">
                    Coming Soon
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-fd-border bg-fd-secondary/40 px-2.5 py-1 text-[10px] font-medium tracking-wide text-fd-muted-foreground uppercase">
                      <BookOpen className="size-3.5 text-brand" />
                      {path.modules} Modules
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-fd-border bg-fd-secondary/40 px-2.5 py-1 text-[10px] font-medium tracking-wide text-fd-muted-foreground uppercase">
                      <FileText className="size-3.5 text-brand" />
                      {path.lessons} Lessons
                    </span>
                    <span className="inline-flex items-center rounded-full border border-brand/40 bg-brand/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-brand uppercase">
                      {path.free} Free
                    </span>
                  </>
                )}
                <span
                  className={cn(
                    'ms-auto inline-flex size-9 items-center justify-center rounded-full border border-fd-border text-fd-muted-foreground transition-colors',
                    !path.comingSoon &&
                      'group-hover:border-brand/50 group-hover:bg-brand group-hover:text-brand-foreground',
                  )}
                >
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

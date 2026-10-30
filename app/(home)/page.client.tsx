'use client';

import {
  type ComponentProps,
  Fragment,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/cn';
import Image from 'next/image';
import MainImg from './main.png';
import OpenAPIImg from './openapi.png';
import NotebookImg from './notebook.png';
import { cva } from 'class-variance-authority';
import AgentHeroImage from './agent-hero.png';
import Greek2Image from './assets/greek-2.webp';
import HeroLightImg from '@/public/hero.png';
import HeroDarkImg from '@/public/hero-dark.png';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

const buttonVariants = cva(
  'inline-flex justify-center px-5 py-3 rounded-full font-medium tracking-tight transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-foreground hover:bg-brand-200',
        secondary: 'border bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

function createSafeShaderComponent(loader: () => Promise<any>) {
  const component = dynamic(
    async () => {
      try {
        const mod = await loader();
        return { default: mod.default ?? mod };
      } catch (error) {
        console.warn('Shader component failed to load, falling back to a no-op component.', error);
        return {
          default: ({ children, ...props }: ComponentProps<'div'> & { children?: ReactNode }) => (
            <div {...props}>{children ?? null}</div>
          ),
        };
      }
    },
    {
      ssr: false,
      loading: () => null,
    },
  );

  return component as unknown as React.ComponentType<any>;
}

const GrainGradient = createSafeShaderComponent(() =>
  import('@paper-design/shaders-react').then((mod) => mod.GrainGradient),
);
const ImageDithering = createSafeShaderComponent(() =>
  import('@paper-design/shaders-react').then((mod) => mod.ImageDithering),
);

export function Hero() {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement | null>(null);
  const visible = useIsVisible(ref);
  const [mounted, setMounted] = useState(false);
  const [showShaders, setShowShaders] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setShowShaders(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showShaders && (
        <GrainGradient
          className="absolute inset-0 animate-fd-fade-in duration-800"
          colors={
            resolvedTheme === 'dark'
              ? ['#173b12', '#3f6f2d', '#00000000']
              : ['#2d5724', '#77975b', '#00000000']
          }
          colorBack="#00000000"
          softness={1}
          intensity={0.38}
          noise={0.42}
          speed={visible ? 1 : 0}
          shape="corners"
          minPixelRatio={1}
          maxPixelCount={1920 * 1080}
        />
      )}
      {showShaders && (
        <ImageDithering
          image={AgentHeroImage.src}
          width={760}
          height={510}
          colorBack="#00000000"
          type="4x4"
          size={3}
          colorSteps={4}
          originalColors
          className="absolute right-[-40px] top-[-10px] animate-fd-fade-in duration-400 max-lg:right-[-180px] max-lg:opacity-45 max-md:hidden"
          minPixelRatio={1}
          maxPixelCount={960 * 640}
        />
      )}
      <div
        ref={ref}
        className={cn(
          'absolute top-[430px] left-[28%] w-[min(1040px,72vw)] rounded-2xl border border-fd-border/80 bg-fd-card/92 p-2 shadow-[0_30px_120px_rgba(15,80,25,0.35)] backdrop-blur-xl lg:top-[385px] max-md:hidden transition-all duration-500',
          mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
        )}
      >
        <HeroArticlePreview />
      </div>
    </>
  );
}

function HeroArticlePreview() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-fd-border/70 bg-fd-card">
      <Image
        src={HeroLightImg}
        alt="Cognitive dispatch preview"
        priority
        className="block dark:hidden w-full h-auto object-cover"
      />
      <Image
        src={HeroDarkImg}
        alt="Cognitive dispatch preview"
        priority
        className="hidden dark:block w-full h-auto object-cover"
      />
    </div>
  );
}

export function CreateAppAnimation(props: ComponentProps<'div'>) {
  const installCmd = 'pnpm create fumadocs-app';
  const tickTime = 100;
  const timeCommandEnter = installCmd.length;
  const timeCommandRun = timeCommandEnter + 3;
  const timeCommandEnd = timeCommandRun + 3;
  const timeWindowOpen = timeCommandEnd + 1;
  const timeEnd = timeWindowOpen + 1;

  const [tick, setTick] = useState(timeEnd);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => (prev >= timeEnd ? prev : prev + 1));
    }, tickTime);

    return () => {
      clearInterval(timer);
    };
  }, [timeEnd]);

  const lines: ReactElement[] = [];

  lines.push(
    <span key="command_type">
      {installCmd.substring(0, tick)}
      {tick < timeCommandEnter && (
        <div className="inline-block h-3 w-1 animate-pulse bg-fd-foreground" />
      )}
    </span>,
  );

  if (tick >= timeCommandEnter) {
    lines.push(<span key="space"> </span>);
  }

  if (tick > timeCommandRun)
    lines.push(
      <Fragment key="command_response">
        {tick > timeCommandRun + 1 && (
          <>
            <span className="font-medium">◇ Project name</span>
            <span>│ my-app</span>
          </>
        )}
        {tick > timeCommandRun + 2 && (
          <>
            <span>│</span>
            <span className="font-medium">◆ Choose a framework</span>
          </>
        )}
        {tick > timeCommandRun + 3 && (
          <>
            <span>│ ● Next.js</span>
            <span>│ ○ Waku</span>
            <span>│ ○ Tanstack Start</span>
            <span>│ ○ React Router</span>
          </>
        )}
      </Fragment>,
    );

  return (
    <div
      {...props}
      onMouseEnter={() => {
        if (tick >= timeEnd) {
          setTick(0);
        }
      }}
    >
      {tick > timeWindowOpen && (
        <LaunchAppWindow className="absolute bottom-5 right-4 z-10 animate-in fade-in slide-in-from-top-10" />
      )}
      <pre className="font-mono text-sm min-h-[240px]">
        <code className="grid">{lines}</code>
      </pre>
    </div>
  );
}

function LaunchAppWindow(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('overflow-hidden rounded-md border bg-fd-popover shadow-lg', props.className)}
    >
      <p className="text-xs text-fd-muted-foreground text-center px-4 py-2 border-b">
        localhost:3000
      </p>
      <p className="text-sm px-4 py-2">New App launched!</p>
    </div>
  );
}

const previewButtonVariants = cva('w-20 h-8 text-sm font-medium transition-colors rounded-full', {
  variants: {
    active: {
      true: 'text-fd-primary-foreground',
      false: 'text-fd-muted-foreground',
    },
  },
});
export function PreviewImages(props: ComponentProps<'div'>) {
  const [active, setActive] = useState(0);
  const previews = [
    {
      image: MainImg,
      name: 'Docs',
    },
    {
      image: NotebookImg,
      name: 'Notebook',
    },
    {
      image: OpenAPIImg,
      name: 'OpenAPI',
    },
  ];

  return (
    <div {...props} className={cn('relative grid', props.className)}>
      <div className="absolute flex flex-row left-1/2 -translate-1/2 bottom-0 z-2 p-0.5 rounded-full bg-fd-card border shadow-xl">
        <div
          role="none"
          className="absolute bg-fd-primary rounded-full w-20 h-8 transition-transform z-[-1]"
          style={{
            transform: `translateX(calc(var(--spacing) * 20 * ${active}))`,
          }}
        />
        {previews.map((item, i) => (
          <button
            key={i}
            className={cn(previewButtonVariants({ active: active === i }))}
            onClick={() => setActive(i)}
          >
            {item.name}
          </button>
        ))}
      </div>
      {previews.map((item, i) => (
        <Image
          key={i}
          src={item.image}
          alt="preview"
          className={cn(
            'col-start-1 row-start-1 select-none',
            active === i ? 'animate-in fade-in slide-in-from-bottom-12 duration-800' : 'invisible',
          )}
        />
      ))}
    </div>
  );
}

export function AgnosticBackground() {
  return (
    <div
      className="absolute inset-0 -z-1 mask-[linear-gradient(to_top,white_30%,transparent_calc(100%-120px))]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 70%, #39be1c66, transparent 28%), radial-gradient(circle at 80% 30%, #91ff3d33, transparent 34%), linear-gradient(135deg, transparent 0 45%, #39be1c22 45% 55%, transparent 55% 100%)',
      }}
    />
  );
}

let observer: IntersectionObserver;

const observerTargets = new WeakMap<Element, (entry: IntersectionObserverEntry) => void>();

function useIsVisible(ref: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    observer ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        observerTargets.get(entry.target)?.(entry);
      }
    });

    const element = ref.current;
    if (!element) return;

    observerTargets.set(element, (entry) => {
      setVisible(entry.isIntersecting);
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observerTargets.delete(element);
    };
  }, [ref]);

  return visible;
}

export function ConceptFlowDiagram() {
  return (
    <div className="relative mt-auto -mr-16 -mb-2 overflow-hidden max-w-full">
      <div className="w-[125%] min-w-[550px]">
        <Image
          src="/loop-vs-graph.png"
          alt="Loop vs Graph explainer"
          width={600}
          height={350}
          className="block dark:hidden w-full h-auto object-contain"
        />
        <Image
          src="/loop-vs-graph-dark.png"
          alt="Loop vs Graph explainer"
          width={600}
          height={350}
          className="hidden dark:block w-full h-auto object-contain"
        />
      </div>
    </div>
  );
}

export function OrangeDitheredBackground() {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement | null>(null);
  const visible = useIsVisible(ref);
  const [showShader, setShowShader] = useState(false);

  useEffect(() => {
    if (visible && !showShader) {
      setShowShader(true);
    }
  }, [visible, showShader]);

  return (
    <div ref={ref} className="absolute inset-0 -z-1 overflow-hidden">
      <Image
        src={Greek2Image}
        alt=""
        role="presentation"
        fill
        className="absolute inset-0 size-full object-cover object-top opacity-55 saturate-50 dark:opacity-45"
      />
      {showShader && (
        <ImageDithering
          image={Greek2Image.src}
          width="100%"
          height="100%"
          fit="cover"
          scale={1}
          colorBack="#00000000"
          colorFront={resolvedTheme === 'dark' ? '#140802' : '#230e03'}
          colorHighlight={resolvedTheme === 'dark' ? '#ff6c00' : '#e65c00'}
          type="4x4"
          size={6}
          colorSteps={2}
          originalColors={false}
          className="absolute inset-0 opacity-95 mix-blend-screen pointer-events-none"
          minPixelRatio={1}
          maxPixelCount={1280 * 720}
        />
      )}
    </div>
  );
}


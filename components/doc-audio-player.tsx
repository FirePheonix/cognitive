'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DocAudioPlayerProps {
  src: string;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 2];
const SKIP_SECONDS = 10;

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds) || seconds <= 0 || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function DocAudioPlayer({ src }: DocAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [isDocked, setIsDocked] = useState(false);

  const updateDuration = useCallback(() => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (d && !isNaN(d) && isFinite(d)) {
        setDuration(d);
      }
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    updateDuration();

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDuration = () => updateDuration();
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleDuration);
    audio.addEventListener('durationchange', handleDuration);
    audio.addEventListener('canplay', handleDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleDuration);
      audio.removeEventListener('durationchange', handleDuration);
      audio.removeEventListener('canplay', handleDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src, updateDuration]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsDocked(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '-8px 0px 0px 0px',
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--doc-audio-dock-pad',
      isDocked ? '4.5rem' : '0px',
    );
    return () => {
      document.documentElement.style.removeProperty('--doc-audio-dock-pad');
    };
  }, [isDocked]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    updateDuration();
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipBy = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Math.min(
      Math.max(0, audio.currentTime + delta),
      Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + delta,
    );
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const toggleSpeed = () => {
    const nextIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIndex);
    const newSpeed = SPEED_OPTIONS[nextIndex];
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speed = SPEED_OPTIONS[speedIndex];

  const progress = (
    <div className="relative min-w-0 flex-1">
      <input
        type="range"
        aria-label="Audio progress"
        min={0}
        max={duration || 100}
        step={0.1}
        value={currentTime}
        onChange={handleSeek}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 focus:outline-none"
        style={{
          background: `linear-gradient(to right, #ffffff 0%, #ffffff ${progressPercent}%, #333333 ${progressPercent}%, #333333 100%)`,
        }}
      />
    </div>
  );

  const inlineControls = (
    <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950/95 px-3 py-2 text-xs text-neutral-200 shadow-sm backdrop-blur-md sm:gap-3 sm:px-4">
      <button
        type="button"
        onClick={togglePlay}
        className="flex shrink-0 items-center gap-2 font-medium transition-colors hover:text-white"
        aria-label={isPlaying ? 'Pause audiobook' : 'Play audiobook'}
      >
        {isPlaying ? (
          <Pause className="size-3.5 fill-current text-white" />
        ) : (
          <Play className="size-3.5 fill-current text-white" />
        )}
        <span>Listen to audiobook</span>
      </button>

      <span className="hidden text-neutral-700 sm:inline">·</span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => skipBy(-SKIP_SECONDS)}
          className="inline-flex size-7 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/80 text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
          aria-label={`Skip back ${SKIP_SECONDS} seconds`}
        >
          <RotateCcw className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => skipBy(SKIP_SECONDS)}
          className="inline-flex size-7 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/80 text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
          aria-label={`Skip forward ${SKIP_SECONDS} seconds`}
        >
          <RotateCw className="size-3.5" />
        </button>
      </div>

      <span className="shrink-0 font-mono text-[11px] tabular-nums text-neutral-400">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <div className="hidden w-28 sm:block sm:w-32">{progress}</div>

      <button
        type="button"
        onClick={toggleSpeed}
        className="shrink-0 font-mono text-[11px] font-medium text-neutral-400 transition-colors hover:text-white"
        aria-label={`Playback speed ${speed}x`}
      >
        {speed}x
      </button>
    </div>
  );

  // Compact docked bar: play · scrub · time · speed. No overflow on phones.
  const dockedControls = (
    <div className="flex w-full max-w-[min(28rem,calc(100vw-1.5rem))] items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950/95 px-2.5 py-1.5 text-xs text-neutral-200 shadow-2xl backdrop-blur-md sm:gap-3 sm:px-3 sm:py-2">
      <button
        type="button"
        onClick={togglePlay}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 transition-opacity hover:opacity-90"
        aria-label={isPlaying ? 'Pause audiobook' : 'Play audiobook'}
      >
        {isPlaying ? (
          <Pause className="size-3.5 fill-current" />
        ) : (
          <Play className="size-3.5 fill-current" />
        )}
      </button>

      <button
        type="button"
        onClick={() => skipBy(-SKIP_SECONDS)}
        className="hidden size-7 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white sm:inline-flex"
        aria-label={`Skip back ${SKIP_SECONDS} seconds`}
      >
        <RotateCcw className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => skipBy(SKIP_SECONDS)}
        className="hidden size-7 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white sm:inline-flex"
        aria-label={`Skip forward ${SKIP_SECONDS} seconds`}
      >
        <RotateCw className="size-3.5" />
      </button>

      {progress}

      <span className="shrink-0 font-mono text-[10px] tabular-nums text-neutral-400 sm:text-[11px]">
        <span className="sm:hidden">{formatTime(currentTime)}</span>
        <span className="hidden sm:inline">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </span>

      <button
        type="button"
        onClick={toggleSpeed}
        className="shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white sm:text-[11px]"
        aria-label={`Playback speed ${speed}x`}
      >
        {speed}x
      </button>
    </div>
  );

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={updateDuration}
        onDurationChange={updateDuration}
        onCanPlay={updateDuration}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onEnded={() => setIsPlaying(false)}
      />

      <div ref={sentinelRef} className={cn(isDocked && 'invisible pointer-events-none')}>
        {inlineControls}
      </div>

      {isDocked ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <div className="pointer-events-auto">{dockedControls}</div>
        </div>
      ) : null}
    </>
  );
}

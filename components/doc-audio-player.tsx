'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, ArrowLeft, ArrowRight } from 'lucide-react';
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
        // Dock once the inline player has scrolled fully out of the top of the viewport
        root: null,
        threshold: 0,
        rootMargin: '-8px 0px 0px 0px',
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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

  const controls = (docked: boolean) => (
    <div
      className={cn(
        'inline-flex items-center gap-2 sm:gap-3 rounded-full border border-neutral-800 bg-neutral-950/95 px-3 sm:px-4 py-2 text-xs text-neutral-200 shadow-sm backdrop-blur-md',
        docked && 'w-full max-w-xl justify-between shadow-2xl',
      )}
    >
      <button
        type="button"
        onClick={togglePlay}
        className="flex items-center gap-2 font-medium hover:text-white transition-colors shrink-0"
        aria-label={isPlaying ? 'Pause audiobook' : 'Play audiobook'}
      >
        {isPlaying ? (
          <Pause className="size-3.5 fill-current text-white" />
        ) : (
          <Play className="size-3.5 fill-current text-white" />
        )}
        <span className={cn(docked ? 'hidden sm:inline' : 'inline')}>
          Listen to audiobook
        </span>
      </button>

      <span className="text-neutral-700 hidden sm:inline">·</span>

      <button
        type="button"
        onClick={() => skipBy(-SKIP_SECONDS)}
        className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900/80 px-2 py-1 font-mono text-[11px] text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
        aria-label={`Skip back ${SKIP_SECONDS} seconds`}
        title={`−${SKIP_SECONDS} seconds`}
      >
        <ArrowLeft className="size-3.5" />
        <span>−{SKIP_SECONDS}</span>
      </button>

      <button
        type="button"
        onClick={() => skipBy(SKIP_SECONDS)}
        className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900/80 px-2 py-1 font-mono text-[11px] text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
        aria-label={`Skip forward ${SKIP_SECONDS} seconds`}
        title={`+${SKIP_SECONDS} seconds`}
      >
        <span>+{SKIP_SECONDS}</span>
        <ArrowRight className="size-3.5" />
      </button>

      <span className="font-mono text-[11px] text-neutral-400 shrink-0 tabular-nums">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <div className={cn('relative flex items-center', docked ? 'flex-1 min-w-16' : 'w-24 sm:w-32')}>
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

      <button
        type="button"
        onClick={toggleSpeed}
        className="font-mono text-[11px] font-medium text-neutral-400 hover:text-white transition-colors shrink-0"
        aria-label={`Playback speed ${SPEED_OPTIONS[speedIndex]}x`}
      >
        {SPEED_OPTIONS[speedIndex]}x
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

      {/* Sentinel keeps layout; docks when this scrolls off-screen */}
      <div ref={sentinelRef} className={cn(isDocked && 'invisible pointer-events-none')}>
        {controls(false)}
      </div>

      {isDocked ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <div className="pointer-events-auto w-full max-w-xl">{controls(true)}</div>
        </div>
      ) : null}
    </>
  );
}

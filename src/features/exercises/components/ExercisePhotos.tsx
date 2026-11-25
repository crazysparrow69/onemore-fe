import { useEffect, useState } from 'react';
import { exerciseImageUrl } from '@/features/exercises/api/exercises.service';
import { cn } from '@/shared/lib/utils';

const FRAME_MS = 1200;

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function ExercisePhotos({
  keys,
  label,
}: {
  keys: readonly string[];
  label: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(prefersReducedMotion);
  const count = keys.length;

  useEffect(() => {
    if (paused || count < 2) {
      return;
    }
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, FRAME_MS);
    return () => {
      clearInterval(timer);
    };
  }, [paused, count]);

  const current = keys[index % Math.max(count, 1)];
  if (!current) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2 bg-white pb-3 text-black">
      <button
        type="button"
        aria-label={label}
        aria-pressed={paused}
        className="block aspect-[4/3] w-full outline-none"
        onClick={() => {
          setPaused((value) => !value);
        }}
      >
        <img
          src={exerciseImageUrl(current)}
          alt=""
          className="size-full object-contain"
        />
      </button>
      {count > 1 ? (
        <div className="flex gap-2">
          {keys.map((key, position) => (
            <button
              key={key}
              type="button"
              aria-label={`${String(position + 1)} / ${String(count)}`}
              className={cn(
                'size-2 rounded-full',
                position === index % count ? 'bg-black' : 'bg-black/25',
              )}
              onClick={() => {
                setPaused(true);
                setIndex(position);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { ExercisePhotos };

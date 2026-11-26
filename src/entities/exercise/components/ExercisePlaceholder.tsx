import { Dumbbell } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const TONES = [
  'from-sky-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-600',
  'from-fuchsia-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
] as const;

function toneOf(seed: string): string {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return TONES[hash % TONES.length] ?? TONES[0];
}

function ExercisePlaceholder({
  seed,
  className,
  iconClassName,
}: {
  seed: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        'flex items-center justify-center bg-gradient-to-br text-white',
        toneOf(seed),
        className,
      )}
    >
      <Dumbbell className={cn('size-6', iconClassName)} aria-hidden />
    </span>
  );
}

export { ExercisePlaceholder };

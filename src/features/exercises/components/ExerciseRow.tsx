import { Link } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  exerciseImageUrl,
  type ExerciseListItem,
} from '@/features/exercises/api/exercises.service';
import { ExercisePlaceholder } from '@/features/exercises/components/ExercisePlaceholder';
import type { ExerciseLabels } from '@/features/exercises/model/labels';
import { cn } from '@/shared/lib/utils';

function ExerciseThumb({
  image,
  seed,
  size = 'md',
}: {
  image: string | null;
  seed: string;
  size?: 'sm' | 'md';
}) {
  const dimension = size === 'sm' ? 'size-12' : 'size-14';
  return image ? (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-black',
        dimension,
      )}
    >
      <img
        src={exerciseImageUrl(image)}
        alt=""
        loading="lazy"
        className="size-full object-cover"
      />
    </span>
  ) : (
    <ExercisePlaceholder
      seed={seed}
      className={cn('shrink-0 rounded-full', dimension)}
    />
  );
}

function ExerciseRow({
  exercise,
  labels,
  pick,
}: {
  exercise: ExerciseListItem;
  labels: ExerciseLabels;
  pick?: { selected: boolean; onToggle: () => void };
}) {
  const { t } = useTranslation();
  const muscles = exercise.primaryMuscles
    .map((id) => labels.muscle(id))
    .join(', ');

  const content = (
    <>
      <ExerciseThumb image={exercise.image} seed={exercise.id} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-medium">{exercise.name}</span>
        <span className="truncate text-sm text-muted-foreground">
          {exercise.custom
            ? `${t('catalog.customLabel')} · ${muscles}`
            : muscles}
        </span>
      </span>
    </>
  );

  return (
    <li className="border-b border-border last:border-b-0">
      {pick ? (
        <button
          type="button"
          aria-pressed={pick.selected}
          onClick={pick.onToggle}
          className={cn(
            'flex w-full items-center gap-3 py-2.5 text-left outline-none focus-visible:bg-accent',
            pick.selected ? 'bg-primary/15' : '',
          )}
        >
          {content}
          <span
            aria-hidden
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full border',
              pick.selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground/60',
            )}
          >
            {pick.selected ? <Check className="size-4" /> : null}
          </span>
        </button>
      ) : (
        <Link
          to="/exercises/$exerciseId"
          params={{ exerciseId: exercise.id }}
          className="flex items-center gap-3 py-2.5 outline-none focus-visible:bg-accent"
        >
          {content}
        </Link>
      )}
    </li>
  );
}

export { ExerciseRow, ExerciseThumb };

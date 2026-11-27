import { Link } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ExerciseListItem } from '@/entities/exercise/api/exercises.service';
import { ExercisePlaceholder } from '@/entities/exercise/components/ExercisePlaceholder';
import { mediaUrl } from '@/entities/media/model/media-url';
import type { ExerciseLabels } from '@/entities/exercise/model/labels';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

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
        src={mediaUrl(image, 'exercise_thumb')}
        alt=""
        crossOrigin="anonymous"
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
        <Text as="span" weight="medium" className="truncate">
          {exercise.name}
        </Text>
        <Text as="span" size="sm" tone="muted" className="truncate">
          {exercise.custom
            ? `${t('catalog.customLabel')} · ${muscles}`
            : muscles}
        </Text>
      </span>
    </>
  );

  return (
    <li className="border-b border-border last:border-b-0">
      {pick ? (
        <Button
          type="button"
          variant="row"
          size="row"
          aria-pressed={pick.selected}
          className="gap-3"
          onClick={pick.onToggle}
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
        </Button>
      ) : (
        <Button asChild variant="row" size="row" className="gap-3">
          <Link
            to="/exercises/$exerciseId"
            params={{ exerciseId: exercise.id }}
          >
            {content}
          </Link>
        </Button>
      )}
    </li>
  );
}

export { ExerciseRow, ExerciseThumb };

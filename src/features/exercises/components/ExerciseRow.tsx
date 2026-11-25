import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  exerciseImageUrl,
  type ExerciseListItem,
} from '@/features/exercises/api/exercises.service';
import { ExercisePlaceholder } from '@/features/exercises/components/ExercisePlaceholder';
import type { ExerciseLabels } from '@/features/exercises/model/labels';

function ExerciseThumb({
  image,
  seed,
}: {
  image: string | null;
  seed: string;
}) {
  return image ? (
    <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-black">
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
      className="size-14 shrink-0 rounded-full"
    />
  );
}

function ExerciseRow({
  exercise,
  labels,
}: {
  exercise: ExerciseListItem;
  labels: ExerciseLabels;
}) {
  const { t } = useTranslation();
  const muscles = exercise.primaryMuscles
    .map((id) => labels.muscle(id))
    .join(', ');

  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        to="/exercises/$exerciseId"
        params={{ exerciseId: exercise.id }}
        className="flex items-center gap-3 py-2.5 outline-none focus-visible:bg-accent"
      >
        <ExerciseThumb image={exercise.image} seed={exercise.id} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-base font-medium">
            {exercise.name}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {exercise.custom
              ? `${t('catalog.customLabel')} · ${muscles}`
              : muscles}
          </span>
        </span>
      </Link>
    </li>
  );
}

export { ExerciseRow, ExerciseThumb };

import { Link } from '@tanstack/react-router';
import { Dumbbell } from 'lucide-react';
import {
  exerciseImageUrl,
  type ExerciseListItem,
} from '@/features/exercises/api/exercises.service';
import type { ExerciseLabels } from '@/features/exercises/model/labels';

function ExerciseThumb({ image }: { image: string | null }) {
  return (
    <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-black">
      {image ? (
        <img
          src={exerciseImageUrl(image)}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <Dumbbell className="size-6" aria-hidden />
      )}
    </span>
  );
}

function ExerciseRow({
  exercise,
  labels,
}: {
  exercise: ExerciseListItem;
  labels: ExerciseLabels;
}) {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        to="/exercises/$exerciseId"
        params={{ exerciseId: exercise.id }}
        className="flex items-center gap-3 py-2.5 outline-none focus-visible:bg-accent"
      >
        <ExerciseThumb image={exercise.image} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-base font-medium">
            {exercise.name}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {exercise.primaryMuscles.map((id) => labels.muscle(id)).join(', ')}
          </span>
        </span>
      </Link>
    </li>
  );
}

export { ExerciseRow, ExerciseThumb };

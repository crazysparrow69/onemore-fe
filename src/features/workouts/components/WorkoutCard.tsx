import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/api/use-auth';
import type { WorkoutListItem } from '@/features/workouts/api/workouts.service';
import {
  dateLabel,
  durationLabel,
  volumeLabel,
} from '@/features/workouts/model/display';

const SHOWN_EXERCISES = 3;

function WorkoutCard({ workout }: { workout: WorkoutListItem }) {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const units = user.data?.units ?? 'kg';
  const rest = workout.exercises.length - SHOWN_EXERCISES;

  return (
    <Link
      to="/workouts/$workoutId"
      params={{ workoutId: workout.id }}
      className="flex flex-col gap-3 rounded-xl bg-card p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="flex flex-col">
        <span className="truncate text-lg font-semibold">{workout.name}</span>
        <span className="text-sm text-muted-foreground">
          {dateLabel(workout.localDate, i18n.language)}
        </span>
      </span>
      <dl className="grid grid-cols-3 text-sm">
        <div>
          <dt className="text-muted-foreground">
            {t('workout.totalDuration')}
          </dt>
          <dd className="font-medium">
            {durationLabel(workout.summary.durationS, t)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('workout.totalVolume')}</dt>
          <dd className="font-medium">
            {volumeLabel(workout.summary.volumeKg, units, i18n.language, t)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('workout.totalSets')}</dt>
          <dd className="font-medium">{workout.summary.setCount}</dd>
        </div>
      </dl>
      <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
        {workout.exercises.slice(0, SHOWN_EXERCISES).map((exercise, index) => (
          <li key={`${exercise.exerciseId}-${String(index)}`}>
            {t('workout.setsCount', { count: exercise.setCount })}{' '}
            {exercise.name}
          </li>
        ))}
        {rest > 0 ? (
          <li>{t('workout.moreExercises', { count: rest })}</li>
        ) : null}
      </ul>
    </Link>
  );
}

export { WorkoutCard };

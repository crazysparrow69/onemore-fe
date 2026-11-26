import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/entities/user/api/use-auth';
import type { WorkoutListItem } from '@/entities/training/api/workouts.service';
import {
  dateLabel,
  durationLabel,
  volumeLabel,
} from '@/entities/training/model/display';

import { Card } from '@/shared/ui/card';
import { Stat } from '@/shared/ui/stat';
import { Text } from '@/shared/ui/text';

const SHOWN_EXERCISES = 3;

function WorkoutCard({ workout }: { workout: WorkoutListItem }) {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const units = user.data?.units ?? 'kg';
  const rest = workout.exercises.length - SHOWN_EXERCISES;

  return (
    <Card asChild interactive>
      <Link to="/workouts/$workoutId" params={{ workoutId: workout.id }}>
        <span className="flex flex-col">
          <Text as="span" size="lg" weight="semibold" className="truncate">
            {workout.name}
          </Text>
          <Text as="span" size="sm" tone="muted">
            {dateLabel(workout.localDate, i18n.language)}
          </Text>
        </span>
        <dl className="grid grid-cols-3">
          <Stat label={t('workout.totalDuration')}>
            {durationLabel(workout.summary.durationS, t)}
          </Stat>
          <Stat label={t('workout.totalVolume')}>
            {volumeLabel(workout.summary.volumeKg, units, i18n.language, t)}
          </Stat>
          <Stat label={t('workout.totalSets')}>{workout.summary.setCount}</Stat>
        </dl>
        <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
          {workout.exercises
            .slice(0, SHOWN_EXERCISES)
            .map((exercise, index) => (
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
    </Card>
  );
}

export { WorkoutCard };

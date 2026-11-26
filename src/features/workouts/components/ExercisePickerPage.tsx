import { getRouteApi, Navigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/entities/user/api/use-auth';
import type { ExerciseListItem } from '@/entities/exercise/api/exercises.service';
import { useExerciseDictionaries } from '@/entities/exercise/api/use-exercises';
import { ExerciseCatalog } from '@/features/exercises/components/ExerciseListPage';
import {
  useDraftStore,
  useWorkoutDraft,
} from '@/entities/training/model/draft-store';
import { MAX_EXERCISES } from '@/entities/training/model/draft';

const route = getRouteApi('/workout/add');

function ExercisePickerPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const user = useCurrentUser();
  const draft = useWorkoutDraft(user.data?.id);
  const dictionaries = useExerciseDictionaries();
  const addExercises = useDraftStore((state) => state.addExercises);
  const [selected, setSelected] = useState<Map<string, ExerciseListItem>>(
    () => new Map(),
  );

  if (!user.isPending && !draft) {
    return <Navigate to="/" replace />;
  }

  const room = MAX_EXERCISES - (draft?.exercises.length ?? 0);

  function toggle(exercise: ExerciseListItem) {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
      } else if (next.size < room) {
        next.set(exercise.id, exercise);
      }
      return next;
    });
  }

  function confirm() {
    const types = dictionaries.data?.types ?? [];
    addExercises(
      [...selected.values()].map((item) => ({
        exerciseId: item.id,
        name: item.name,
        image: item.image,
        type: item.type,
        custom: item.custom,
        fields: types.find((type) => type.id === item.type)?.fields ?? [],
      })),
    );
    void router.navigate({ to: '/workout', replace: true });
  }

  return (
    <ExerciseCatalog
      search={search}
      onSearchChange={(update) => {
        void navigate({
          search: (previous) => update(previous),
          replace: true,
        });
      }}
      pick={{
        title: t('workout.pickerTitle'),
        onBack: () => {
          void router.navigate({ to: '/workout', replace: true });
        },
        selected,
        onToggle: toggle,
        confirmLabel: t('workout.addCount', { count: selected.size }),
        onConfirm: confirm,
      }}
    />
  );
}

export { ExercisePickerPage };

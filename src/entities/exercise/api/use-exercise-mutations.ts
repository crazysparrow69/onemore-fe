import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/entities/user/api/use-auth';
import { exercisesKeys } from '@/entities/exercise/api/exercises.keys';
import {
  createExercise,
  deleteExercise,
  updateExercise,
  type ExerciseDetails,
  type ExerciseInput,
} from '@/entities/exercise/api/exercises.service';

function useCatalogSync() {
  const language = useCurrentUser().data?.language ?? 'en';
  const queryClient = useQueryClient();

  return {
    saved: (exercise: ExerciseDetails) => {
      queryClient.setQueryData(
        exercisesKeys.detail(language, exercise.id),
        exercise,
      );
      void queryClient.invalidateQueries({
        queryKey: exercisesKeys.lists(language),
      });
      void queryClient.invalidateQueries({ queryKey: exercisesKeys.counts() });
    },
    removed: (id: string) => {
      queryClient.removeQueries({
        queryKey: exercisesKeys.detail(language, id),
      });
      void queryClient.invalidateQueries({
        queryKey: exercisesKeys.lists(language),
      });
      void queryClient.invalidateQueries({ queryKey: exercisesKeys.counts() });
    },
  };
}

export function useCreateExercise() {
  const sync = useCatalogSync();

  return useMutation({
    mutationFn: (input: ExerciseInput) => createExercise(input),
    onSuccess: sync.saved,
  });
}

export function useUpdateExercise(id: string) {
  const sync = useCatalogSync();

  return useMutation({
    mutationFn: (input: ExerciseInput) => updateExercise(id, input),
    onSuccess: sync.saved,
  });
}

export function useDeleteExercise(id: string, onDeleted?: () => unknown) {
  const sync = useCatalogSync();

  return useMutation({
    mutationFn: () => deleteExercise(id),
    onSuccess: async () => {
      await onDeleted?.();
      sync.removed(id);
    },
  });
}

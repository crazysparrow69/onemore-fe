import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { exercisesKeys } from '@/entities/exercise/api/exercises.keys';
import { workoutsKeys } from '@/entities/training/api/workouts.keys';
import {
  deleteWorkout,
  fetchWorkout,
  fetchPreviousSets,
  fetchWorkouts,
  saveWorkout,
} from '@/entities/training/api/workouts.service';
import type { WorkoutPayload } from '@/entities/training/model/draft';

export function useWorkoutList() {
  return useInfiniteQuery({
    queryKey: workoutsKeys.list(),
    queryFn: ({ pageParam }) => fetchWorkouts(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset ?? undefined,
  });
}

export function usePreviousSets(exerciseIds: readonly string[]) {
  return useQuery({
    queryKey: workoutsKeys.previous(exerciseIds),
    queryFn: () => fetchPreviousSets(exerciseIds),
    enabled: exerciseIds.length > 0,
    gcTime: 0,
    staleTime: 0,
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: workoutsKeys.detail(id),
    queryFn: () => fetchWorkout(id),
  });
}

export function useSaveWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; payload: WorkoutPayload }) =>
      saveWorkout(input.id, input.payload),
    onSuccess: (workout) => {
      queryClient.setQueryData(workoutsKeys.detail(workout.id), workout);
      void queryClient.invalidateQueries({ queryKey: workoutsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: exercisesKeys.all });
      void queryClient.invalidateQueries({
        queryKey: [...workoutsKeys.all, 'previous'],
      });
    },
  });
}

export function useDeleteWorkout(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteWorkout(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: workoutsKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: workoutsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: exercisesKeys.all });
    },
  });
}

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { exercisesKeys } from '@/features/exercises/api/exercises.keys';
import { workoutsKeys } from '@/features/workouts/api/workouts.keys';
import {
  deleteWorkout,
  fetchWorkout,
  fetchWorkouts,
  saveWorkout,
} from '@/features/workouts/api/workouts.service';
import type { WorkoutPayload } from '@/features/workouts/model/draft';

export function useWorkoutList() {
  return useInfiniteQuery({
    queryKey: workoutsKeys.list(),
    queryFn: ({ pageParam }) => fetchWorkouts(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset ?? undefined,
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

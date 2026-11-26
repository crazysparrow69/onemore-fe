export const workoutsKeys = {
  all: ['workouts'] as const,
  list: () => [...workoutsKeys.all, 'list'] as const,
  previous: (exerciseIds: readonly string[]) =>
    [...workoutsKeys.all, 'previous', exerciseIds] as const,
  detail: (id: string) => [...workoutsKeys.all, 'detail', id] as const,
};

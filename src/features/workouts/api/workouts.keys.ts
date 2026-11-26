export const workoutsKeys = {
  all: ['workouts'] as const,
  list: () => [...workoutsKeys.all, 'list'] as const,
  detail: (id: string) => [...workoutsKeys.all, 'detail', id] as const,
};

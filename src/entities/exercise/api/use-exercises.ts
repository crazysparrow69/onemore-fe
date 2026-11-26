import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { useCurrentUser } from '@/entities/user/api/use-auth';
import { exercisesKeys } from '@/entities/exercise/api/exercises.keys';
import {
  fetchExercise,
  fetchExerciseDictionaries,
  fetchExercises,
  type ExerciseDetails,
  type ExerciseList,
} from '@/entities/exercise/api/exercises.service';
import type { CatalogFilters } from '@/entities/exercise/model/catalog-search';
import {
  buildLabels,
  type ExerciseLabels,
} from '@/entities/exercise/model/labels';

const STALE_TIME_MS = 5 * 60 * 1000;

export function useExerciseList(filters: CatalogFilters) {
  const language = useCurrentUser().data?.language;

  return useInfiniteQuery({
    queryKey: exercisesKeys.list(language ?? 'en', filters),
    queryFn: ({ pageParam }) => fetchExercises(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset ?? undefined,
    enabled: language !== undefined,
    staleTime: STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });
}

export function useExerciseCount(filters: CatalogFilters, enabled = true) {
  const language = useCurrentUser().data?.language;

  return useQuery({
    queryKey: exercisesKeys.count(language ?? 'en', filters),
    queryFn: () => fetchExercises(filters, 0, 1),
    select: (data) => data.total,
    enabled: enabled && language !== undefined,
    staleTime: STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });
}

export function useExercise(id: string) {
  const language = useCurrentUser().data?.language;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: exercisesKeys.detail(language ?? 'en', id),
    queryFn: () => fetchExercise(id),
    enabled: language !== undefined,
    staleTime: STALE_TIME_MS,
    placeholderData: (): ExerciseDetails | undefined => {
      if (!language) {
        return undefined;
      }
      const cached = queryClient.getQueriesData<InfiniteData<ExerciseList>>({
        queryKey: exercisesKeys.lists(language),
      });
      for (const [, data] of cached) {
        for (const page of data?.pages ?? []) {
          const item = page.items.find((candidate) => candidate.id === id);
          if (item) {
            return {
              ...item,
              imageKeys: item.image ? [item.image] : [],
              category: null,
              force: null,
              mechanic: null,
              level: null,
              instructions: [],
              typeLocked: false,
            };
          }
        }
      }
      return undefined;
    },
  });
}

export function useExerciseDictionaries() {
  const language = useCurrentUser().data?.language;

  return useQuery({
    queryKey: exercisesKeys.dictionaries(language ?? 'en'),
    queryFn: () => fetchExerciseDictionaries(),
    enabled: language !== undefined,
    staleTime: STALE_TIME_MS,
  });
}

export function useExerciseLabels(): ExerciseLabels {
  const { data } = useExerciseDictionaries();

  return useMemo(() => buildLabels(data), [data]);
}

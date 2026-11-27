import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { bodyKeys } from '@/entities/body/api/body.keys';
import {
  deleteWeight,
  fetchBody,
  fetchGoal,
  fetchLatestWeight,
  fetchWeightLog,
  saveBody,
  saveGoal,
  saveWeight,
  WEIGHT_PAGE_SIZE,
} from '@/entities/body/api/body.service';
import type {
  BodyInput,
  GoalInput,
  WeightInput,
} from '@/entities/body/model/schemas';
import { nutritionKeys } from '@/entities/nutrition/api/nutrition.keys';
import { useToday } from '@/entities/user/api/use-today';
import { shiftLocalDate } from '@/shared/lib/local-date';

export function useBody() {
  return useQuery({ queryKey: bodyKeys.profile(), queryFn: () => fetchBody() });
}

export function useGoal() {
  return useQuery({ queryKey: bodyKeys.goal(), queryFn: () => fetchGoal() });
}

export function useLatestWeight() {
  return useQuery({
    queryKey: bodyKeys.weightLatest(),
    queryFn: () => fetchLatestWeight(),
  });
}

export function useRecentWeight(from: string) {
  return useQuery({
    queryKey: bodyKeys.weightRecent(from),
    queryFn: () => fetchWeightLog({ from, limit: 400 }),
  });
}

export function useWeightLog() {
  return useInfiniteQuery({
    queryKey: bodyKeys.weightLog(),
    queryFn: ({ pageParam }) => fetchWeightLog({ to: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => {
      const oldest = last.at(-1);
      return last.length < WEIGHT_PAGE_SIZE || !oldest
        ? undefined
        : shiftLocalDate(oldest.localDate, -1);
    },
  });
}

export function useSaveBody() {
  const queryClient = useQueryClient();
  const today = useToday();

  return useMutation({
    mutationFn: (input: BodyInput) => saveBody(input, today()),
    onSuccess: async (saved) => {
      queryClient.setQueryData(bodyKeys.profile(), saved);
      await queryClient.invalidateQueries({
        queryKey: nutritionKeys.targets(),
      });
    },
  });
}

export function useSaveGoal() {
  const queryClient = useQueryClient();
  const today = useToday();

  return useMutation({
    mutationFn: (input: GoalInput) => saveGoal(input, today()),
    onSuccess: async (saved) => {
      queryClient.setQueryData(bodyKeys.goal(), saved);
      await queryClient.invalidateQueries({
        queryKey: nutritionKeys.targets(),
      });
    },
  });
}

export function useSaveWeight() {
  const queryClient = useQueryClient();
  const today = useToday();

  return useMutation({
    mutationFn: (input: { date: string; value: WeightInput }) =>
      saveWeight(input.date, input.value, today()),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bodyKeys.weight() }),
        queryClient.invalidateQueries({ queryKey: nutritionKeys.targets() }),
      ]);
    },
  });
}

export function useDeleteWeight() {
  const queryClient = useQueryClient();
  const today = useToday();

  return useMutation({
    mutationFn: (date: string) => deleteWeight(date, today()),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bodyKeys.weight() }),
        queryClient.invalidateQueries({ queryKey: nutritionKeys.targets() }),
      ]);
    },
  });
}

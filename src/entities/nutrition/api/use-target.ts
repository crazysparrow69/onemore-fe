import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nutritionKeys } from '@/entities/nutrition/api/nutrition.keys';
import {
  fetchTarget,
  requestAutoTarget,
  setManualTarget,
} from '@/entities/nutrition/api/target.service';
import { useToday } from '@/entities/user/api/use-today';

export function useTarget(date: string) {
  return useQuery({
    queryKey: nutritionKeys.target(date),
    queryFn: () => fetchTarget(date),
  });
}

export function useSetManualTarget() {
  const queryClient = useQueryClient();
  const today = useToday();

  return useMutation({
    mutationFn: (caloriesKcal: number) =>
      setManualTarget(caloriesKcal, today()),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: nutritionKeys.targets() }),
  });
}

export function useUseAutoTarget() {
  const queryClient = useQueryClient();
  const today = useToday();

  return useMutation({
    mutationFn: () => requestAutoTarget(today()),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: nutritionKeys.targets() }),
  });
}

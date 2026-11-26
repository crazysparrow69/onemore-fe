import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exercisesKeys } from '@/features/exercises/api/exercises.keys';
import { templatesKeys } from '@/features/templates/api/templates.keys';
import {
  archiveTemplate,
  fetchTemplate,
  fetchTemplates,
  saveTemplate,
  type TemplateList,
} from '@/features/templates/api/templates.service';
import type { TemplatePayload } from '@/features/templates/model/payload';

export function useTemplates() {
  return useQuery({
    queryKey: templatesKeys.list(),
    queryFn: () => fetchTemplates(),
  });
}

export function useTemplate(id: string | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: templatesKeys.detail(id ?? ''),
    queryFn: () => fetchTemplate(id ?? ''),
    enabled: id !== undefined,
    initialData: () =>
      queryClient
        .getQueryData<TemplateList>(templatesKeys.list())
        ?.items.find((item) => item.id === id),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(templatesKeys.list())?.dataUpdatedAt,
  });
}

export function useSaveTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; payload: TemplatePayload }) =>
      saveTemplate(input.id, input.payload),
    onSuccess: (template) => {
      queryClient.setQueryData(templatesKeys.detail(template.id), template);
      void queryClient.invalidateQueries({ queryKey: templatesKeys.list() });
      void queryClient.invalidateQueries({ queryKey: exercisesKeys.all });
    },
  });
}

export function useArchiveTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveTemplate(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: templatesKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: templatesKeys.list() });
    },
  });
}

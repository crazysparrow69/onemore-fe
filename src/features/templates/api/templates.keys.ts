export const templatesKeys = {
  all: ['templates'] as const,
  list: () => [...templatesKeys.all, 'list'] as const,
  detail: (id: string) => [...templatesKeys.all, 'detail', id] as const,
};

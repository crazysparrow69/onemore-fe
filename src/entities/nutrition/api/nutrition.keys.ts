export const nutritionKeys = {
  all: ['nutrition'] as const,
  target: (date: string) => [...nutritionKeys.all, 'target', date] as const,
  targets: () => [...nutritionKeys.all, 'target'] as const,
};

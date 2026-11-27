export const bodyKeys = {
  all: ['body'] as const,
  profile: () => [...bodyKeys.all, 'profile'] as const,
  goal: () => [...bodyKeys.all, 'goal'] as const,
  weight: () => [...bodyKeys.all, 'weight'] as const,
  weightLatest: () => [...bodyKeys.weight(), 'latest'] as const,
  weightLog: () => [...bodyKeys.weight(), 'log'] as const,
  weightRecent: (from: string) =>
    [...bodyKeys.weight(), 'recent', from] as const,
};

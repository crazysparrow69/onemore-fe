import type {
  ExerciseDictionaries,
  ExerciseOption,
} from '@/features/exercises/api/exercises.service';

export interface ExerciseLabels {
  muscle: (id: string) => string;
  equipment: (id: string) => string;
  category: (id: string) => string;
  level: (id: string) => string;
  mechanic: (id: string) => string;
  force: (id: string) => string;
}

function lookup(options: readonly ExerciseOption[]): (id: string) => string {
  const labels = new Map(options.map((option) => [option.id, option.label]));
  return (id) => labels.get(id) ?? id;
}

export function buildLabels(
  dictionaries: ExerciseDictionaries | undefined,
): ExerciseLabels {
  const muscles = dictionaries
    ? dictionaries.muscleGroups.flatMap((group) => group.muscles)
    : [];
  return {
    muscle: lookup(muscles),
    equipment: lookup(dictionaries?.equipment ?? []),
    category: lookup(dictionaries?.categories ?? []),
    level: lookup(dictionaries?.levels ?? []),
    mechanic: lookup(dictionaries?.mechanics ?? []),
    force: lookup(dictionaries?.forces ?? []),
  };
}

export type TemplateSetKind = 'warmup' | 'working' | 'drop' | 'failure';

export interface TemplateSetPayload {
  kind: TemplateSetKind;
  weightKg: number | null;
  reps: number | null;
  durationS: number | null;
  distanceM: number | null;
}

export interface TemplateExercisePayload {
  exerciseId: string;
  notes: string | null;
  restSeconds: number | null;
  sets: TemplateSetPayload[];
}

export interface TemplatePayload {
  name: string;
  notes: string | null;
  exercises: TemplateExercisePayload[];
}

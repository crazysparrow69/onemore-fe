import { z } from 'zod';
import { previousSetSchema } from '@/features/workouts/model/previous';

export const templateLinkExerciseSchema = z.object({
  exerciseId: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  restSeconds: z.number().nullable(),
  sets: z.array(previousSetSchema),
});

export const templateLinkSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().nullable(),
  exercises: z.array(templateLinkExerciseSchema),
});

export type TemplateLink = z.infer<typeof templateLinkSchema>;

export interface TemplateSource {
  id: string;
  name: string;
  notes: string | null;
  exercises: {
    exerciseId: string;
    name: string;
    image: string | null;
    type: string;
    custom: boolean;
    notes: string | null;
    restSeconds: number | null;
    sets: {
      kind: 'warmup' | 'working' | 'drop' | 'failure';
      weightKg: number | null;
      reps: number | null;
      durationS: number | null;
      distanceM: number | null;
    }[];
  }[];
}

import { z } from 'zod';
import type { Units } from '@/features/auth/api/current-user.service';
import {
  draftFieldRuleSchema,
  MAX_EXERCISES,
  MAX_SETS,
  SET_KINDS,
  setValuesToMetric,
  type FieldRule,
  type IdFactory,
  type PickedExercise,
  type SetKind,
  type SetValueKey,
} from '@/features/workouts/model/draft';
import { previousValues } from '@/features/workouts/model/previous';
import type { TemplatePayload } from '@/features/templates/model/payload';

export const MAX_TEMPLATE_NAME = 80;

export const editorSetSchema = z.object({
  id: z.string(),
  kind: z.enum(SET_KINDS),
  weight: z.string(),
  reps: z.string(),
  duration: z.string(),
  distance: z.string(),
});
export type EditorSet = z.infer<typeof editorSetSchema>;

export const editorExerciseSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  type: z.string(),
  custom: z.boolean(),
  archived: z.boolean(),
  fields: z.array(draftFieldRuleSchema),
  notes: z.string(),
  restSeconds: z.number().nullable(),
  sets: z.array(editorSetSchema),
});
export type EditorExercise = z.infer<typeof editorExerciseSchema>;

export const editorSchema = z.object({
  templateId: z.string(),
  mode: z.enum(['new', 'edit']),
  units: z.enum(['kg', 'lb']),
  name: z.string(),
  notes: z.string(),
  exercises: z.array(editorExerciseSchema),
  base: z.string(),
});
export type Editor = z.infer<typeof editorSchema>;

export interface EditorSource {
  name: string;
  notes: string | null;
  exercises: {
    exerciseId: string;
    name: string;
    image: string | null;
    type: string;
    custom: boolean;
    archived?: boolean;
    notes: string | null;
    restSeconds: number | null;
    sets: {
      kind: SetKind;
      weightKg: number | null;
      reps: number | null;
      durationS: number | null;
      distanceM: number | null;
    }[];
  }[];
}

export function contentKey(editor: Editor): string {
  return JSON.stringify({
    name: editor.name.trim(),
    notes: editor.notes,
    exercises: editor.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      notes: exercise.notes,
      restSeconds: exercise.restSeconds,
      sets: exercise.sets.map((set) => [
        set.kind,
        set.weight,
        set.reps,
        set.duration,
        set.distance,
      ]),
    })),
  });
}

function withBase(editor: Editor): Editor {
  return { ...editor, base: contentKey(editor) };
}

export function isDirty(editor: Editor): boolean {
  return contentKey(editor) !== editor.base;
}

export function createEditor(templateId: string, units: Units): Editor {
  return withBase({
    templateId,
    mode: 'new',
    units,
    name: '',
    notes: '',
    exercises: [],
    base: '',
  });
}

export function emptyEditorSet(
  id: string,
  kind: SetKind = 'working',
): EditorSet {
  return { id, kind, weight: '', reps: '', duration: '', distance: '' };
}

function setFromMetric(
  set: EditorSource['exercises'][number]['sets'][number],
  units: Units,
  newId: IdFactory,
): EditorSet {
  return {
    id: newId(),
    kind: set.kind,
    ...previousValues(set, units),
  };
}

function exerciseFromSource(
  exercise: EditorSource['exercises'][number],
  units: Units,
  fieldsOf: (type: string) => FieldRule[],
  newId: IdFactory,
): EditorExercise {
  return {
    id: newId(),
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    image: exercise.image,
    type: exercise.type,
    custom: exercise.custom,
    archived: exercise.archived ?? false,
    fields: fieldsOf(exercise.type),
    notes: exercise.notes ?? '',
    restSeconds: exercise.restSeconds,
    sets: exercise.sets
      .slice(0, MAX_SETS)
      .map((set) => setFromMetric(set, units, newId)),
  };
}

export function editorFromTemplate(
  templateId: string,
  source: EditorSource,
  units: Units,
  fieldsOf: (type: string) => FieldRule[],
  newId: IdFactory,
): Editor {
  return withBase({
    templateId,
    mode: 'edit',
    units,
    name: source.name,
    notes: source.notes ?? '',
    exercises: source.exercises
      .slice(0, MAX_EXERCISES)
      .map((exercise) => exerciseFromSource(exercise, units, fieldsOf, newId)),
    base: '',
  });
}

export function editorFromWorkout(
  templateId: string,
  source: EditorSource,
  units: Units,
  fieldsOf: (type: string) => FieldRule[],
  newId: IdFactory,
): Editor {
  const editor = editorFromTemplate(templateId, source, units, fieldsOf, newId);
  return { ...editor, mode: 'new', base: contentKey(createEditor('', units)) };
}

export function addExercises(
  editor: Editor,
  picked: readonly PickedExercise[],
  newId: IdFactory,
): Editor {
  const room = MAX_EXERCISES - editor.exercises.length;
  const added = picked
    .slice(0, Math.max(0, room))
    .map((item): EditorExercise => ({
      id: newId(),
      exerciseId: item.exerciseId,
      name: item.name,
      image: item.image,
      type: item.type,
      custom: item.custom,
      archived: false,
      fields: item.fields,
      notes: '',
      restSeconds: null,
      sets: [emptyEditorSet(newId())],
    }));
  return { ...editor, exercises: [...editor.exercises, ...added] };
}

function mapExercise(
  editor: Editor,
  id: string,
  change: (exercise: EditorExercise) => EditorExercise,
): Editor {
  return {
    ...editor,
    exercises: editor.exercises.map((exercise) =>
      exercise.id === id ? change(exercise) : exercise,
    ),
  };
}

export function setName(editor: Editor, name: string): Editor {
  return { ...editor, name };
}

export function removeExercise(editor: Editor, id: string): Editor {
  return {
    ...editor,
    exercises: editor.exercises.filter((exercise) => exercise.id !== id),
  };
}

export function moveExercise(
  editor: Editor,
  id: string,
  direction: -1 | 1,
): Editor {
  const index = editor.exercises.findIndex((exercise) => exercise.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= editor.exercises.length) {
    return editor;
  }
  const exercises = [...editor.exercises];
  const [moved] = exercises.splice(index, 1);
  if (moved) {
    exercises.splice(target, 0, moved);
  }
  return { ...editor, exercises };
}

export function setExerciseNotes(
  editor: Editor,
  id: string,
  notes: string,
): Editor {
  return mapExercise(editor, id, (exercise) => ({ ...exercise, notes }));
}

export function setExerciseRest(
  editor: Editor,
  id: string,
  seconds: number | null,
): Editor {
  return mapExercise(editor, id, (exercise) => ({
    ...exercise,
    restSeconds: seconds,
  }));
}

export function addSet(editor: Editor, id: string, newId: IdFactory): Editor {
  return mapExercise(editor, id, (exercise) => {
    if (exercise.sets.length >= MAX_SETS) {
      return exercise;
    }
    const last = exercise.sets.at(-1);
    const copy: EditorSet = last
      ? { ...last, id: newId(), kind: 'working' }
      : emptyEditorSet(newId());
    return { ...exercise, sets: [...exercise.sets, copy] };
  });
}

export function removeSet(
  editor: Editor,
  exerciseId: string,
  setId: string,
): Editor {
  return mapExercise(editor, exerciseId, (exercise) =>
    exercise.sets.length <= 1
      ? exercise
      : {
          ...exercise,
          sets: exercise.sets.filter((set) => set.id !== setId),
        },
  );
}

export function updateSet(
  editor: Editor,
  exerciseId: string,
  setId: string,
  patch: Partial<Record<SetValueKey, string>> & { kind?: SetKind },
): Editor {
  return mapExercise(editor, exerciseId, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) =>
      set.id === setId ? { ...set, ...patch } : set,
    ),
  }));
}

export function canSave(editor: Editor): boolean {
  return editor.name.trim().length > 0 && editor.exercises.length > 0;
}

function orNull(text: string): string | null {
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toPayload(editor: Editor): TemplatePayload {
  return {
    name: editor.name.trim(),
    notes: orNull(editor.notes),
    exercises: editor.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      notes: orNull(exercise.notes),
      restSeconds: exercise.restSeconds,
      sets: exercise.sets.map((set) => ({
        kind: set.kind,
        ...setValuesToMetric(set, editor.units),
      })),
    })),
  };
}

export function payloadFromSource(source: EditorSource): TemplatePayload {
  return {
    name: source.name,
    notes: source.notes,
    exercises: source.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      notes: exercise.notes,
      restSeconds: exercise.restSeconds,
      sets: exercise.sets.map((set) => ({
        kind: set.kind,
        weightKg: set.weightKg,
        reps: set.reps,
        durationS: set.durationS,
        distanceM: set.distanceM,
      })),
    })),
  };
}

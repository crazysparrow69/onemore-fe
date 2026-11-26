import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import {
  addExercises,
  addSet,
  editorSchema,
  moveExercise,
  removeExercise,
  removeSet,
  setExerciseNotes,
  setExerciseRest,
  setName,
  updateSet,
  type Editor,
} from '@/features/templates/model/editor';
import type {
  PickedExercise,
  SetKind,
  SetValueKey,
} from '@/features/workouts/model/draft';

export const EDITOR_STORAGE_KEY = 'onemore.template-editor';

const persistedSchema = z.object({
  ownerId: z.string().nullable(),
  editor: editorSchema.nullable(),
});

const newId = (): string => crypto.randomUUID();

export interface EditorState {
  ownerId: string | null;
  editor: Editor | null;
  open: (ownerId: string, editor: Editor) => void;
  close: () => void;
  setName: (name: string) => void;
  addExercises: (picked: readonly PickedExercise[]) => void;
  removeExercise: (exerciseId: string) => void;
  moveExercise: (exerciseId: string, direction: -1 | 1) => void;
  setExerciseNotes: (exerciseId: string, notes: string) => void;
  setExerciseRest: (exerciseId: string, seconds: number | null) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  changeSet: (
    exerciseId: string,
    setId: string,
    patch: Partial<Record<SetValueKey, string>> & { kind?: SetKind },
  ) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => {
      function edit(change: (editor: Editor) => Editor): void {
        const current = get().editor;
        if (current) {
          set({ editor: change(current) });
        }
      }

      return {
        ownerId: null,
        editor: null,
        open: (ownerId, editor) => {
          set({ ownerId, editor });
        },
        close: () => {
          set({ ownerId: null, editor: null });
        },
        setName: (name) => {
          edit((editor) => setName(editor, name));
        },
        addExercises: (picked) => {
          edit((editor) => addExercises(editor, picked, newId));
        },
        removeExercise: (exerciseId) => {
          edit((editor) => removeExercise(editor, exerciseId));
        },
        moveExercise: (exerciseId, direction) => {
          edit((editor) => moveExercise(editor, exerciseId, direction));
        },
        setExerciseNotes: (exerciseId, notes) => {
          edit((editor) => setExerciseNotes(editor, exerciseId, notes));
        },
        setExerciseRest: (exerciseId, seconds) => {
          edit((editor) => setExerciseRest(editor, exerciseId, seconds));
        },
        addSet: (exerciseId) => {
          edit((editor) => addSet(editor, exerciseId, newId));
        },
        removeSet: (exerciseId, setId) => {
          edit((editor) => removeSet(editor, exerciseId, setId));
        },
        changeSet: (exerciseId, setId, patch) => {
          edit((editor) => updateSet(editor, exerciseId, setId, patch));
        },
      };
    },
    {
      name: EDITOR_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ ownerId: state.ownerId, editor: state.editor }),
      merge: (persisted, current) => {
        const parsed = persistedSchema.safeParse(persisted);
        return parsed.success ? { ...current, ...parsed.data } : current;
      },
    },
  ),
);

export function useTemplateEditor(userId: string | undefined): Editor | null {
  return useEditorStore((state) =>
    userId !== undefined && state.ownerId === userId ? state.editor : null,
  );
}

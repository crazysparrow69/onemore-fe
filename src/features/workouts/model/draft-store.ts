import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import {
  addExercises,
  addSet,
  createDraft,
  draftSchema,
  moveExercise,
  removeExercise,
  removeSet,
  setExerciseNotes,
  setMeta,
  toggleSet,
  updateSet,
  type Draft,
  type PickedExercise,
  type SetKind,
  type SetValueKey,
} from '@/features/workouts/model/draft';
import { uuidV7 } from '@/shared/lib/uuid';

export const DRAFT_STORAGE_KEY = 'onemore.workout-draft';

const persistedSchema = z.object({
  ownerId: z.string().nullable(),
  draft: draftSchema.nullable(),
});

const newId = (): string => crypto.randomUUID();

export interface DraftState {
  ownerId: string | null;
  draft: Draft | null;
  start: (ownerId: string) => void;
  discard: () => void;
  addExercises: (picked: readonly PickedExercise[]) => void;
  removeExercise: (exerciseId: string) => void;
  moveExercise: (exerciseId: string, direction: -1 | 1) => void;
  setExerciseNotes: (exerciseId: string, notes: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  changeSet: (
    exerciseId: string,
    setId: string,
    patch: Partial<Record<SetValueKey, string>> & { kind?: SetKind },
  ) => void;
  toggleSet: (exerciseId: string, setId: string) => boolean;
  setMeta: (meta: Partial<Pick<Draft, 'name' | 'notes' | 'startedAt'>>) => void;
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => {
      function edit(change: (draft: Draft) => Draft): void {
        const current = get().draft;
        if (current) {
          set({ draft: change(current) });
        }
      }

      return {
        ownerId: null,
        draft: null,
        start: (ownerId) => {
          set({ ownerId, draft: createDraft(uuidV7(), new Date()) });
        },
        discard: () => {
          set({ ownerId: null, draft: null });
        },
        addExercises: (picked) => {
          edit((draft) => addExercises(draft, picked, newId));
        },
        removeExercise: (exerciseId) => {
          edit((draft) => removeExercise(draft, exerciseId));
        },
        moveExercise: (exerciseId, direction) => {
          edit((draft) => moveExercise(draft, exerciseId, direction));
        },
        setExerciseNotes: (exerciseId, notes) => {
          edit((draft) => setExerciseNotes(draft, exerciseId, notes));
        },
        addSet: (exerciseId) => {
          edit((draft) => addSet(draft, exerciseId, newId));
        },
        removeSet: (exerciseId, setId) => {
          edit((draft) => removeSet(draft, exerciseId, setId));
        },
        changeSet: (exerciseId, setId, patch) => {
          edit((draft) => updateSet(draft, exerciseId, setId, patch));
        },
        toggleSet: (exerciseId, setId) => {
          const current = get().draft;
          if (!current) {
            return false;
          }
          const result = toggleSet(current, exerciseId, setId, new Date());
          set({ draft: result.draft });
          return result.done;
        },
        setMeta: (meta) => {
          edit((draft) => setMeta(draft, meta));
        },
      };
    },
    {
      name: DRAFT_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ ownerId: state.ownerId, draft: state.draft }),
      merge: (persisted, current) => {
        const parsed = persistedSchema.safeParse(persisted);
        return parsed.success ? { ...current, ...parsed.data } : current;
      },
    },
  ),
);

export function useWorkoutDraft(userId: string | undefined): Draft | null {
  return useDraftStore((state) =>
    userId !== undefined && state.ownerId === userId ? state.draft : null,
  );
}

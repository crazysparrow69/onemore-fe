import { useRouter } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useCurrentUser } from '@/features/auth/api/use-auth';
import { useExerciseDictionaries } from '@/features/exercises/api/use-exercises';
import type { Template } from '@/features/templates/api/templates.service';
import {
  createEditor,
  editorFromTemplate,
  editorFromWorkout,
  payloadFromSource,
  type EditorSource,
} from '@/features/templates/model/editor';
import { useEditorStore } from '@/features/templates/model/editor-store';
import { useSaveTemplate } from '@/features/templates/api/use-templates';
import { copyName } from '@/features/templates/model/summary';
import {
  useDraftStore,
  useWorkoutDraft,
} from '@/features/workouts/model/draft-store';
import type { FieldRule } from '@/features/workouts/model/draft';
import { uuidV7 } from '@/shared/lib/uuid';

const newId = (): string => crypto.randomUUID();

export function useFieldsOf(): ((type: string) => FieldRule[]) | null {
  const dictionaries = useExerciseDictionaries();
  const types = dictionaries.data?.types;
  const fieldsOf = useCallback(
    (type: string): FieldRule[] =>
      types?.find((item) => item.id === type)?.fields ?? [],
    [types],
  );
  return types ? fieldsOf : null;
}

export function useEditorLaunch() {
  const router = useRouter();
  const user = useCurrentUser();
  const fieldsOf = useFieldsOf();
  const open = useEditorStore((state) => state.open);
  const ready = user.data !== undefined && fieldsOf !== null;

  function newProgram() {
    if (!user.data) {
      return;
    }
    open(user.data.id, createEditor(uuidV7(), user.data.units));
    void router.navigate({ to: '/programs/new' });
  }

  function editProgram(template: Template) {
    if (!user.data || !fieldsOf) {
      return;
    }
    open(
      user.data.id,
      editorFromTemplate(
        template.id,
        template,
        user.data.units,
        fieldsOf,
        newId,
      ),
    );
    void router.navigate({
      to: '/programs/$programId/edit',
      params: { programId: template.id },
    });
  }

  function programFromWorkout(source: EditorSource) {
    if (!user.data || !fieldsOf) {
      return;
    }
    open(
      user.data.id,
      editorFromWorkout(uuidV7(), source, user.data.units, fieldsOf, newId),
    );
    void router.navigate({ to: '/programs/new' });
  }

  return { ready, newProgram, editProgram, programFromWorkout };
}

export function useDuplicateTemplate() {
  const save = useSaveTemplate();

  return {
    pending: save.isPending,
    duplicate: (
      template: Template,
      suffix: string,
      callbacks: { onSuccess: (copy: Template) => void; onError: () => void },
    ) => {
      save.mutate(
        {
          id: uuidV7(),
          payload: {
            ...payloadFromSource(template),
            name: copyName(template.name, suffix, 80),
          },
        },
        { onSuccess: callbacks.onSuccess, onError: callbacks.onError },
      );
    },
  };
}

export function useStartTemplate() {
  const router = useRouter();
  const user = useCurrentUser();
  const fieldsOf = useFieldsOf();
  const draft = useWorkoutDraft(user.data?.id);
  const startFromTemplate = useDraftStore((state) => state.startFromTemplate);
  const ready = user.data !== undefined && fieldsOf !== null;

  function launch(template: Template) {
    if (!user.data || !fieldsOf) {
      return;
    }
    startFromTemplate(user.data.id, template, fieldsOf);
    void router.navigate({ to: '/workout' });
  }

  return { ready, hasDraft: draft !== null, launch };
}

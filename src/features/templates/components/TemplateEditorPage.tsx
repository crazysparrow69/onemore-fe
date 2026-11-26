import { getRouteApi, Link, useRouter } from '@tanstack/react-router';
import { Dumbbell, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/api/use-auth';
import {
  useSaveTemplate,
  useTemplate,
} from '@/features/templates/api/use-templates';
import { TemplateExerciseCard } from '@/features/templates/components/TemplateExerciseCard';
import {
  canSave,
  createEditor,
  editorFromTemplate,
  isDirty,
  MAX_TEMPLATE_NAME,
  toPayload,
  type Editor,
} from '@/features/templates/model/editor';
import {
  useEditorStore,
  useTemplateEditor,
} from '@/features/templates/model/editor-store';
import { useFieldsOf } from '@/features/templates/model/use-launch';
import { ExerciseMenuSheet } from '@/features/workouts/components/ExerciseMenuSheet';
import { RestPickerSheet } from '@/features/workouts/components/RestPickerSheet';
import { SetKindSheet } from '@/features/workouts/components/SetKindSheet';
import { MAX_EXERCISES } from '@/features/workouts/model/draft';
import { isApiError } from '@/shared/api/error';
import { toast } from '@/shared/lib/toast';
import { uuidV7 } from '@/shared/lib/uuid';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

const editRoute = getRouteApi('/programs/$programId/edit');

type ErrorKey =
  | 'templates.errors.limit'
  | 'templates.errors.values'
  | 'templates.errors.exerciseChanged'
  | 'templates.errors.gone'
  | 'templates.errors.network'
  | 'templates.errors.generic';

function errorKey(error: unknown): ErrorKey {
  if (!isApiError(error)) {
    return 'templates.errors.generic';
  }
  switch (error.code) {
    case 'TEMPLATE_LIMIT_REACHED':
      return 'templates.errors.limit';
    case 'SET_VALUES_INVALID':
    case 'VALIDATION_FAILED':
      return 'templates.errors.values';
    case 'EXERCISE_CHANGED':
      return 'templates.errors.exerciseChanged';
    case 'TEMPLATE_NOT_FOUND':
      return 'templates.errors.gone';
    case 'NETWORK_ERROR':
      return 'templates.errors.network';
    default:
      return 'templates.errors.generic';
  }
}

const newId = (): string => crypto.randomUUID();

function EditorForm({ editor }: { editor: Editor }) {
  const { t } = useTranslation();
  const router = useRouter();
  const store = useEditorStore();
  const save = useSaveTemplate();
  const [kindSheet, setKindSheet] = useState<{
    exerciseId: string;
    setId: string;
    number: number;
    kind: string;
  } | null>(null);
  const [menuExercise, setMenuExercise] = useState<string | null>(null);
  const [restExercise, setRestExercise] = useState<string | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const menuTarget = editor.exercises.find((item) => item.id === menuExercise);
  const restTarget = editor.exercises.find((item) => item.id === restExercise);
  const menuIndex = editor.exercises.findIndex(
    (item) => item.id === menuExercise,
  );
  const editing = editor.mode === 'edit';
  const savable = canSave(editor);

  function leave() {
    const done = editing
      ? router.navigate({
          to: '/programs/$programId',
          params: { programId: editor.templateId },
          replace: true,
        })
      : router.navigate({ to: '/training', replace: true });
    void done.then(() => {
      store.close();
    });
  }

  function cancel() {
    if (isDirty(editor)) {
      setConfirmingDiscard(true);
    } else {
      leave();
    }
  }

  function submit() {
    if (!savable) {
      return;
    }
    save.mutate(
      { id: editor.templateId, payload: toPayload(editor) },
      {
        onSuccess: (template) => {
          void router
            .navigate({
              to: '/programs/$programId',
              params: { programId: template.id },
              replace: true,
            })
            .then(() => {
              store.close();
              toast.success(t('templates.saved'));
            });
        },
        onError: (error) => {
          toast.error(t(errorKey(error)));
        },
      },
    );
  }

  return (
    <main className="flex flex-1 flex-col pb-10">
      <header className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center bg-background px-4 pt-4 pb-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-self-start px-2"
          onClick={cancel}
        >
          {t('common.cancel')}
        </Button>
        <Text as="h1" size="lg" weight="semibold" className="text-center">
          {t(editing ? 'templates.editTitle' : 'templates.createTitle')}
        </Text>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-self-end px-2 text-primary"
          disabled={!savable}
          loading={save.isPending}
          onClick={submit}
        >
          {t('templates.save')}
        </Button>
      </header>

      <div className="px-4 pb-2">
        <TextField
          label={t('templates.name')}
          variant="outline"
          value={editor.name}
          maxLength={MAX_TEMPLATE_NAME}
          autoComplete="off"
          onChange={(event) => {
            store.setName(event.target.value);
          }}
        />
      </div>

      {editor.exercises.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 pt-12 pb-8 text-center">
          <Dumbbell className="size-14 text-muted-foreground" aria-hidden />
          <Text tone="muted" className="mt-3">
            {t('templates.emptyEditor')}
          </Text>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {editor.exercises.map((exercise) => (
            <TemplateExerciseCard
              key={exercise.id}
              exercise={exercise}
              units={editor.units}
              onMenu={() => {
                setMenuExercise(exercise.id);
              }}
              onNotes={(notes) => {
                store.setExerciseNotes(exercise.id, notes);
              }}
              onRest={() => {
                setRestExercise(exercise.id);
              }}
              onAddSet={() => {
                store.addSet(exercise.id);
              }}
              onSetKind={(setId, kind) => {
                const index = exercise.sets.findIndex((s) => s.id === setId);
                setKindSheet({
                  exerciseId: exercise.id,
                  setId,
                  number: index + 1,
                  kind,
                });
              }}
              onChangeSet={(setId, key, value) => {
                store.changeSet(exercise.id, setId, { [key]: value });
              }}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 px-4 pt-4">
        {editor.exercises.length < MAX_EXERCISES ? (
          <Button asChild size="lg" fullWidth leftIcon={<Plus aria-hidden />}>
            <Link to="/programs/add">{t('templates.addExercise')}</Link>
          </Button>
        ) : null}
      </div>

      <RestPickerSheet
        open={restTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setRestExercise(null);
          }
        }}
        title={t('workout.rest.exerciseTitle', {
          name: restTarget?.name ?? '',
        })}
        current={restTarget?.restSeconds ?? null}
        allowOff
        onPick={(seconds) => {
          if (restExercise) {
            store.setExerciseRest(restExercise, seconds);
          }
          setRestExercise(null);
        }}
      />

      <SetKindSheet
        open={kindSheet !== null}
        onOpenChange={(open) => {
          if (!open) {
            setKindSheet(null);
          }
        }}
        number={kindSheet?.number ?? 1}
        current={
          kindSheet?.kind === 'warmup' ||
          kindSheet?.kind === 'drop' ||
          kindSheet?.kind === 'failure'
            ? kindSheet.kind
            : 'working'
        }
        onKind={(kind) => {
          if (kindSheet) {
            store.changeSet(kindSheet.exerciseId, kindSheet.setId, { kind });
          }
          setKindSheet(null);
        }}
        onRemove={() => {
          if (kindSheet) {
            store.removeSet(kindSheet.exerciseId, kindSheet.setId);
          }
          setKindSheet(null);
        }}
      />

      <ExerciseMenuSheet
        open={menuTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setMenuExercise(null);
          }
        }}
        title={menuTarget?.name ?? ''}
        canMoveUp={menuIndex > 0}
        canMoveDown={menuIndex >= 0 && menuIndex < editor.exercises.length - 1}
        onMove={(direction) => {
          if (menuExercise) {
            store.moveExercise(menuExercise, direction);
          }
          setMenuExercise(null);
        }}
        onRemove={() => {
          if (menuExercise) {
            store.removeExercise(menuExercise);
          }
          setMenuExercise(null);
        }}
      />

      <BottomSheet
        compact
        open={confirmingDiscard}
        onOpenChange={setConfirmingDiscard}
        title={t('templates.discardTitle')}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              className="min-w-0 flex-1 px-3 text-sm"
              onClick={() => {
                setConfirmingDiscard(false);
              }}
            >
              {t('templates.keepEditing')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-w-0 flex-1 px-3 text-sm"
              onClick={() => {
                setConfirmingDiscard(false);
                leave();
              }}
            >
              {t('templates.discardConfirm')}
            </Button>
          </>
        }
      >
        <Text tone="muted">{t('templates.discardHint')}</Text>
      </BottomSheet>
    </main>
  );
}

function EditorLoading() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-6" aria-hidden>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
    </main>
  );
}

function NewEditor() {
  const user = useCurrentUser();
  const editor = useTemplateEditor(user.data?.id);
  const open = useEditorStore((state) => state.open);
  const matches = editor?.mode === 'new';

  useEffect(() => {
    if (user.data && !matches) {
      open(user.data.id, createEditor(uuidV7(), user.data.units));
    }
  }, [user.data, matches, open]);

  return editor && matches ? <EditorForm editor={editor} /> : <EditorLoading />;
}

function EditExisting({ programId }: { programId: string }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const editor = useTemplateEditor(user.data?.id);
  const template = useTemplate(programId);
  const fieldsOf = useFieldsOf();
  const open = useEditorStore((state) => state.open);
  const matches = editor?.mode === 'edit' && editor.templateId === programId;
  const data = template.data;

  useEffect(() => {
    if (user.data && data && fieldsOf && !matches) {
      open(
        user.data.id,
        editorFromTemplate(data.id, data, user.data.units, fieldsOf, newId),
      );
    }
  }, [user.data, data, fieldsOf, matches, open]);

  if (template.isError) {
    return (
      <main className="flex flex-1 flex-col items-start gap-3 px-4 pt-8">
        <Text tone="muted">{t('templates.notFound')}</Text>
        <Button asChild variant="secondary">
          <Link to="/training">{t('templates.toTraining')}</Link>
        </Button>
      </main>
    );
  }
  return editor && matches ? <EditorForm editor={editor} /> : <EditorLoading />;
}

function TemplateNewPage() {
  return <NewEditor />;
}

function TemplateEditPage() {
  const { programId } = editRoute.useParams();
  return <EditExisting programId={programId} />;
}

export { TemplateEditPage, TemplateNewPage };

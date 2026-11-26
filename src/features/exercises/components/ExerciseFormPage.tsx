import { getRouteApi, Link, useRouter } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCreateExercise,
  useUpdateExercise,
} from '@/features/exercises/api/use-exercise-mutations';
import {
  useExercise,
  useExerciseDictionaries,
  useExerciseLabels,
} from '@/features/exercises/api/use-exercises';
import {
  OptionSheet,
  type OptionSection,
} from '@/features/exercises/components/OptionSheet';
import {
  canSave,
  emptyFormValues,
  errorsOfDetails,
  formValuesOf,
  isDirty,
  toInput,
  type ExerciseFormErrors,
  type ExerciseFormField,
  type ExerciseFormValues,
} from '@/features/exercises/model/exercise-form';
import { isApiError } from '@/shared/api/error';
import { toast } from '@/shared/lib/toast';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';
import { Textarea } from '@/shared/ui/textarea';

const createRoute = getRouteApi('/exercises/new');
const editRoute = getRouteApi('/exercises/$exerciseId/edit');

type SheetName = 'equipment' | 'type' | 'primary' | 'secondary';

function SelectRow({
  label,
  value,
  placeholder,
  invalid,
  disabled = false,
  onClick,
}: {
  label: string;
  value: string;
  placeholder: string;
  invalid: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-invalid={invalid || undefined}
      disabled={disabled}
      onClick={onClick}
      className="disabled:pointer-events-none disabled:opacity-60 flex items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:ring-2 aria-invalid:ring-destructive"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={
            value.length > 0 ? 'text-base' : 'text-base text-muted-foreground'
          }
        >
          {value.length > 0 ? value : placeholder}
        </span>
      </span>
      {disabled ? null : (
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      )}
    </button>
  );
}

function ExerciseForm({
  initial,
  exerciseId,
  typeLocked = false,
}: {
  initial: ExerciseFormValues;
  exerciseId?: string;
  typeLocked?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const dictionaries = useExerciseDictionaries();
  const labels = useExerciseLabels();
  const create = useCreateExercise();
  const update = useUpdateExercise(exerciseId ?? '');
  const mutation = exerciseId ? update : create;
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<ExerciseFormErrors>({});
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const data = dictionaries.data;
  const dirty = isDirty(values, initial);
  const typeLabel = data?.types.find((type) => type.id === values.type)?.label;

  function change(
    patch: Partial<ExerciseFormValues>,
    field: ExerciseFormField,
  ) {
    setValues((current) => ({ ...current, ...patch }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function leave() {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      void router.navigate({ to: '/exercises' });
    }
  }

  function save() {
    mutation.mutate(toInput(values), {
      onSuccess: (saved) => {
        toast.success(t('exerciseForm.saved'));
        void router.navigate({
          to: '/exercises/$exerciseId',
          params: { exerciseId: saved.id },
          replace: true,
        });
      },
      onError: (error) => {
        if (isApiError(error) && error.code === 'VALIDATION_FAILED') {
          setErrors(errorsOfDetails(error.details));
          toast.error(t('exerciseForm.checkFields'));
          return;
        }
        if (isApiError(error) && error.code === 'EXERCISE_LIMIT_REACHED') {
          toast.error(t('exerciseForm.limitReached'));
          return;
        }
        if (isApiError(error) && error.code === 'EXERCISE_TYPE_LOCKED') {
          toast.error(t('exerciseForm.typeLocked'));
          return;
        }
        toast.error(t('errors.generic.description'));
      },
    });
  }

  const equipmentSections: OptionSection[] = [
    { id: 'equipment', label: null, options: data?.equipment ?? [] },
  ];
  const typeSections: OptionSection[] = [
    {
      id: 'type',
      label: null,
      options: (data?.types ?? []).map((type) => ({
        id: type.id,
        label: type.label,
        description: type.example,
      })),
    },
  ];
  const primarySections: OptionSection[] = (data?.muscleGroups ?? []).map(
    (group) => ({ id: group.id, label: group.label, options: group.muscles }),
  );
  const secondarySections: OptionSection[] = (data?.muscleGroups ?? [])
    .map((group) => ({
      id: group.id,
      label: group.label,
      options: group.muscles.filter(
        (muscle) => !muscle.primaryOnly && !values.primary.includes(muscle.id),
      ),
    }))
    .filter((group) => group.options.length > 0);

  return (
    <main className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center bg-background px-4 pt-4 pb-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-self-start px-2"
          onClick={() => {
            if (dirty) {
              setConfirmingCancel(true);
            } else {
              leave();
            }
          }}
        >
          {t('common.cancel')}
        </Button>
        <Text as="h1" size="lg" weight="semibold" className="text-center">
          {exerciseId
            ? t('exerciseForm.titleEdit')
            : t('exerciseForm.titleNew')}
        </Text>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-self-end px-2 text-primary"
          disabled={!canSave(values) || !data}
          loading={mutation.isPending}
          onClick={save}
        >
          {t('exerciseForm.save')}
        </Button>
      </header>

      <form
        className="flex flex-1 flex-col gap-4 px-4 pb-10"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSave(values) && data) {
            save();
          }
        }}
      >
        <TextField
          label={t('exerciseForm.name')}
          variant="outline"
          value={values.name}
          autoFocus={!exerciseId}
          autoComplete="off"
          placeholder={t('exerciseForm.namePlaceholder')}
          error={errors.name ? t('exerciseForm.errors.name') : undefined}
          onChange={(event) => {
            change({ name: event.target.value }, 'name');
          }}
        />

        <div className="flex flex-col gap-2">
          <SelectRow
            label={t('exerciseForm.equipment')}
            value={labels.equipment(values.equipment)}
            placeholder={t('exerciseForm.choose')}
            invalid={Boolean(errors.equipment)}
            onClick={() => {
              setSheet('equipment');
            }}
          />
          <SelectRow
            label={t('exerciseForm.type')}
            value={typeLabel ?? ''}
            placeholder={t('exerciseForm.choose')}
            invalid={Boolean(errors.type)}
            disabled={typeLocked}
            onClick={() => {
              setSheet('type');
            }}
          />
          {typeLocked ? (
            <Text size="sm" tone="muted">
              {t('exerciseForm.typeLockedHint')}
            </Text>
          ) : null}
          <SelectRow
            label={t('exerciseForm.primaryMuscle')}
            value={values.primary.map((id) => labels.muscle(id)).join(', ')}
            placeholder={t('exerciseForm.choose')}
            invalid={Boolean(errors.primaryMuscles)}
            onClick={() => {
              setSheet('primary');
            }}
          />
          <SelectRow
            label={t('exerciseForm.secondaryMuscles')}
            value={values.secondary.map((id) => labels.muscle(id)).join(', ')}
            placeholder={t('exerciseForm.none')}
            invalid={Boolean(errors.secondaryMuscles)}
            onClick={() => {
              setSheet('secondary');
            }}
          />
          {errors.type || errors.primaryMuscles || errors.secondaryMuscles ? (
            <Text size="sm" tone="danger">
              {t('exerciseForm.errors.muscles')}
            </Text>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Text as="label" htmlFor="exercise-steps" size="sm" tone="muted">
            {t('exerciseForm.instructions')}
          </Text>
          <Textarea
            id="exercise-steps"
            value={values.steps}
            placeholder={t('exerciseForm.instructionsHint')}
            aria-invalid={errors.instructions ? true : undefined}
            onChange={(event) => {
              change({ steps: event.target.value }, 'instructions');
            }}
          />
          {errors.instructions ? (
            <Text size="sm" tone="danger">
              {t('exerciseForm.errors.instructions')}
            </Text>
          ) : null}
        </div>
      </form>

      <OptionSheet
        open={sheet === 'equipment'}
        onOpenChange={(open) => {
          setSheet(open ? 'equipment' : null);
        }}
        title={t('exerciseForm.equipment')}
        sections={equipmentSections}
        selected={[values.equipment]}
        clearLabel={t('exerciseForm.clear')}
        doneLabel={t('exerciseForm.done')}
        onApply={([id]) => {
          setSheet(null);
          if (id !== undefined) {
            change({ equipment: id }, 'equipment');
          }
        }}
      />
      <OptionSheet
        open={sheet === 'type'}
        onOpenChange={(open) => {
          setSheet(open ? 'type' : null);
        }}
        title={t('exerciseForm.type')}
        sections={typeSections}
        selected={[values.type]}
        columns={1}
        thumbs={false}
        clearLabel={t('exerciseForm.clear')}
        doneLabel={t('exerciseForm.done')}
        onApply={([id]) => {
          setSheet(null);
          if (id !== undefined) {
            change({ type: id }, 'type');
          }
        }}
      />
      <OptionSheet
        open={sheet === 'primary'}
        onOpenChange={(open) => {
          setSheet(open ? 'primary' : null);
        }}
        title={t('exerciseForm.primaryMuscle')}
        sections={primarySections}
        selected={values.primary}
        clearLabel={t('exerciseForm.clear')}
        doneLabel={t('exerciseForm.done')}
        onApply={([id]) => {
          setSheet(null);
          if (id !== undefined) {
            setValues((current) => ({
              ...current,
              primary: [id],
              secondary: current.secondary.filter((muscle) => muscle !== id),
            }));
            setErrors((current) => ({
              ...current,
              primaryMuscles: undefined,
            }));
          }
        }}
      />
      <OptionSheet
        open={sheet === 'secondary'}
        onOpenChange={(open) => {
          setSheet(open ? 'secondary' : null);
        }}
        title={t('exerciseForm.secondaryMuscles')}
        sections={secondarySections}
        selected={values.secondary}
        multiple
        clearLabel={t('exerciseForm.clear')}
        doneLabel={t('exerciseForm.done')}
        onApply={(ids) => {
          setSheet(null);
          change({ secondary: ids }, 'secondaryMuscles');
        }}
      />

      <BottomSheet
        compact
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title={t('exerciseForm.discardTitle')}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              className="min-w-0 flex-1 px-3 text-sm"
              onClick={() => {
                setConfirmingCancel(false);
              }}
            >
              {t('exerciseForm.keepEditing')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-w-0 flex-1 px-3 text-sm"
              onClick={leave}
            >
              {t('exerciseForm.discard')}
            </Button>
          </>
        }
      >
        <Text tone="muted">{t('exerciseForm.discardHint')}</Text>
      </BottomSheet>
    </main>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6" aria-hidden>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

function ExerciseCreatePage() {
  const { name } = createRoute.useSearch();

  return <ExerciseForm initial={emptyFormValues(name ?? '')} />;
}

function ExerciseEditPage() {
  const { t } = useTranslation();
  const { exerciseId } = editRoute.useParams();
  const exercise = useExercise(exerciseId);
  const data = exercise.data;

  if (exercise.isPending || exercise.isPlaceholderData) {
    return (
      <main className="flex flex-1 flex-col">
        <FormSkeleton />
      </main>
    );
  }
  if (!data?.custom) {
    return (
      <main className="flex flex-1 flex-col items-start gap-3 px-4 py-6">
        <Text tone="muted">{t('exerciseForm.notEditable')}</Text>
        <Button asChild variant="secondary">
          <Link to="/exercises">{t('catalog.toList')}</Link>
        </Button>
      </main>
    );
  }

  return (
    <ExerciseForm
      key={data.id}
      exerciseId={data.id}
      typeLocked={data.typeLocked}
      initial={formValuesOf(data)}
    />
  );
}

export { ExerciseCreatePage, ExerciseEditPage };

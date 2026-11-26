import { zodResolver } from '@hookform/resolvers/zod';
import { getRouteApi, Link, useRouter } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  useCreateExercise,
  useUpdateExercise,
} from '@/entities/exercise/api/use-exercise-mutations';
import {
  useExercise,
  useExerciseDictionaries,
  useExerciseLabels,
} from '@/entities/exercise/api/use-exercises';
import { useImagePreparation } from '@/entities/media/api/use-image-preparation';
import { useMediaUpload } from '@/entities/media/api/use-media-upload';
import { isAborted, mediaErrorKey } from '@/entities/media/model/media-error';
import { mediaUrl } from '@/entities/media/model/media-url';
import { PhotoField } from '@/features/exercises/components/PhotoField';
import {
  OptionSheet,
  type OptionSection,
} from '@/features/exercises/components/OptionSheet';
import {
  emptyFormValues,
  exerciseFormSchema,
  fieldsOfDetails,
  formValuesOf,
  isDirty,
  toInput,
  type ExerciseFormValues,
} from '@/features/exercises/model/exercise-form';
import { apiErrorKey, hasErrorCode, isApiError } from '@/shared/api/error';
import { toast } from '@/shared/lib/toast';
import { ConfirmSheet } from '@/shared/ui/confirm-sheet';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';
import { Textarea } from '@/shared/ui/textarea';
import { useSheet } from '@/shared/lib/use-sheet';
import { newId } from '@/shared/lib/uuid';

const createRoute = getRouteApi('/exercises/new');
const editRoute = getRouteApi('/exercises/$exerciseId/edit');

type SheetName = 'equipment' | 'type' | 'primary' | 'secondary';

const SAVE_ERROR_KEYS = {
  EXERCISE_LIMIT_REACHED: 'exerciseForm.limitReached',
  EXERCISE_TYPE_LOCKED: 'exerciseForm.typeLocked',
} as const;

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
    <Button
      type="button"
      variant="option"
      size="auto"
      aria-invalid={invalid || undefined}
      disabled={disabled}
      onClick={onClick}
      className="justify-between gap-3"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <Text as="span" size="sm" tone="muted">
          {label}
        </Text>
        <Text
          as="span"
          tone={value.length > 0 ? 'default' : 'muted'}
          className="font-normal"
        >
          {value.length > 0 ? value : placeholder}
        </Text>
      </span>
      {disabled ? null : (
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      )}
    </Button>
  );
}

function ExerciseForm({
  initial,
  exerciseId,
  initialPhotoKey = null,
  typeLocked = false,
}: {
  initial: ExerciseFormValues;
  exerciseId?: string;
  initialPhotoKey?: string | null;
  typeLocked?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const dictionaries = useExerciseDictionaries();
  const labels = useExerciseLabels();
  const create = useCreateExercise();
  const update = useUpdateExercise(exerciseId ?? '');
  const mutation = exerciseId ? update : create;
  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    mode: 'onChange',
    defaultValues: initial,
  });
  const values = useWatch({ control: form.control });
  const { errors, isValid } = form.formState;
  const sheet = useSheet<SheetName>();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const photoUpload = useMediaUpload('exercise_photo');
  const photoPreparation = useImagePreparation();
  const photoBusy = photoUpload.uploading || photoPreparation.preparing;
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    initialPhotoKey ? mediaUrl(initialPhotoKey, 'exercise_photo') : null,
  );
  const [photoSeed] = useState(() => exerciseId ?? newId());

  const data = dictionaries.data;
  const primary = values.primary ?? [];
  const secondary = values.secondary ?? [];
  const typeLabel = data?.types.find((type) => type.id === values.type)?.label;

  function change(field: 'type' | 'equipment', value: string): void;
  function change(field: 'primary' | 'secondary', value: string[]): void;
  function change(
    field: 'type' | 'equipment' | 'primary' | 'secondary',
    value: string | string[],
  ): void {
    form.setValue(field, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function pickPhoto(file: File) {
    try {
      const ready = await photoPreparation.prepare(file);
      const uploaded = await photoUpload.start(ready);
      setPhotoUrl(uploaded.previewUrl);
      form.setValue('photoId', uploaded.id, { shouldDirty: true });
    } catch (error) {
      if (!isAborted(error)) {
        toast.error(t(mediaErrorKey(error)));
      }
    }
  }

  function removePhoto() {
    setPhotoUrl(null);
    form.setValue('photoId', null, { shouldDirty: true });
  }

  function leave() {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      void router.navigate({ to: '/exercises' });
    }
  }

  function save(input: ExerciseFormValues) {
    mutation.mutate(toInput(input), {
      onSuccess: (saved) => {
        toast.success(t('exerciseForm.saved'));
        void router.navigate({
          to: '/exercises/$exerciseId',
          params: { exerciseId: saved.id },
          replace: true,
        });
      },
      onError: (error) => {
        if (isApiError(error) && hasErrorCode(error, 'VALIDATION_FAILED')) {
          for (const field of fieldsOfDetails(error.details)) {
            form.setError(field, {});
          }
          toast.error(t('exerciseForm.checkFields'));
          return;
        }
        toast.error(
          t(apiErrorKey(error, SAVE_ERROR_KEYS, 'errors.generic.description')),
        );
      },
    });
  }

  const submit = () => {
    void form.handleSubmit(save)();
  };

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
        (muscle) => !muscle.primaryOnly && !primary.includes(muscle.id),
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
            if (isDirty(values, initial)) {
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
          disabled={!isValid || !data || photoBusy}
          loading={mutation.isPending}
          onClick={submit}
        >
          {t('exerciseForm.save')}
        </Button>
      </header>

      <form
        className="flex flex-1 flex-col gap-4 px-4 pb-10"
        onSubmit={(event) => {
          event.preventDefault();
          if (data && !photoBusy) {
            submit();
          }
        }}
      >
        <PhotoField
          url={photoUrl}
          seed={photoSeed}
          uploading={photoBusy}
          progress={photoUpload.progress}
          onPick={(file) => {
            void pickPhoto(file);
          }}
          onRemove={removePhoto}
        />

        <TextField
          label={t('exerciseForm.name')}
          variant="outline"
          autoFocus={!exerciseId}
          autoComplete="off"
          placeholder={t('exerciseForm.namePlaceholder')}
          error={errors.name ? t('exerciseForm.errors.name') : undefined}
          {...form.register('name')}
        />

        <div className="flex flex-col gap-2">
          <SelectRow
            label={t('exerciseForm.equipment')}
            value={labels.equipment(values.equipment ?? '')}
            placeholder={t('exerciseForm.choose')}
            invalid={Boolean(errors.equipment)}
            onClick={() => {
              sheet.show('equipment');
            }}
          />
          <SelectRow
            label={t('exerciseForm.type')}
            value={typeLabel ?? ''}
            placeholder={t('exerciseForm.choose')}
            invalid={Boolean(errors.type)}
            disabled={typeLocked}
            onClick={() => {
              sheet.show('type');
            }}
          />
          {typeLocked ? (
            <Text size="sm" tone="muted">
              {t('exerciseForm.typeLockedHint')}
            </Text>
          ) : null}
          <SelectRow
            label={t('exerciseForm.primaryMuscle')}
            value={primary.map((id) => labels.muscle(id)).join(', ')}
            placeholder={t('exerciseForm.choose')}
            invalid={Boolean(errors.primary)}
            onClick={() => {
              sheet.show('primary');
            }}
          />
          <SelectRow
            label={t('exerciseForm.secondaryMuscles')}
            value={secondary.map((id) => labels.muscle(id)).join(', ')}
            placeholder={t('exerciseForm.none')}
            invalid={Boolean(errors.secondary)}
            onClick={() => {
              sheet.show('secondary');
            }}
          />
          {errors.type || errors.primary || errors.secondary ? (
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
            placeholder={t('exerciseForm.instructionsHint')}
            aria-invalid={errors.steps ? true : undefined}
            {...form.register('steps')}
          />
          {errors.steps ? (
            <Text size="sm" tone="danger">
              {t('exerciseForm.errors.instructions')}
            </Text>
          ) : null}
        </div>
      </form>

      <OptionSheet
        {...sheet.bind('equipment')}
        title={t('exerciseForm.equipment')}
        sections={equipmentSections}
        selected={values.equipment ? [values.equipment] : []}
        clearLabel={t('exerciseForm.clear')}
        doneLabel={t('exerciseForm.done')}
        onApply={([id]) => {
          sheet.close();
          if (id !== undefined) {
            change('equipment', id);
          }
        }}
      />
      <OptionSheet
        {...sheet.bind('type')}
        title={t('exerciseForm.type')}
        sections={typeSections}
        selected={values.type ? [values.type] : []}
        columns={1}
        thumbs={false}
        clearLabel={t('exerciseForm.clear')}
        doneLabel={t('exerciseForm.done')}
        onApply={([id]) => {
          sheet.close();
          if (id !== undefined) {
            change('type', id);
          }
        }}
      />
      <OptionSheet
        {...sheet.bind('primary')}
        title={t('exerciseForm.primaryMuscle')}
        sections={primarySections}
        selected={primary}
        clearLabel={t('exerciseForm.clear')}
        doneLabel={t('exerciseForm.done')}
        onApply={([id]) => {
          sheet.close();
          if (id !== undefined) {
            change('primary', [id]);
            change(
              'secondary',
              secondary.filter((muscle) => muscle !== id),
            );
          }
        }}
      />
      <OptionSheet
        {...sheet.bind('secondary')}
        title={t('exerciseForm.secondaryMuscles')}
        sections={secondarySections}
        selected={secondary}
        multiple
        clearLabel={t('exerciseForm.clear')}
        doneLabel={t('exerciseForm.done')}
        onApply={(ids) => {
          sheet.close();
          change('secondary', ids);
        }}
      />

      <ConfirmSheet
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title={t('exerciseForm.discardTitle')}
        cancelLabel={t('exerciseForm.keepEditing')}
        confirmLabel={t('exerciseForm.discard')}
        onConfirm={leave}
      >
        <Text tone="muted">{t('exerciseForm.discardHint')}</Text>
      </ConfirmSheet>
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
      initialPhotoKey={data.photoId ? data.image : null}
      typeLocked={data.typeLocked}
      initial={formValuesOf(data)}
    />
  );
}

export { ExerciseCreatePage, ExerciseEditPage };

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSaveBody } from '@/entities/body/api/use-body';
import {
  ACTIVITY_LEVELS,
  SEXES,
  type Body,
  type BodyInput,
} from '@/entities/body/model/schemas';
import { useToday } from '@/entities/user/api/use-today';
import {
  bodyDefaults,
  bodyFormSchema,
  type BodyFormValues,
} from '@/features/body/model/body-form';
import { fieldError } from '@/shared/lib/field-error';
import { toast } from '@/shared/lib/toast';
import { Button } from '@/shared/ui/button';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { SelectField } from '@/shared/ui/select-field';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

function BodyForm({
  body,
  submitLabel,
  onSaved,
}: {
  body: Body | null;
  submitLabel: string;
  onSaved?: () => void;
}) {
  const { t } = useTranslation();
  const today = useToday();
  const save = useSaveBody();
  const schema = useMemo(() => bodyFormSchema(today()), [today]);
  const form = useForm<BodyFormValues, unknown, BodyInput>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: bodyDefaults(body),
  });
  const { errors } = form.formState;
  const activity = useWatch({ control: form.control, name: 'activityLevel' });

  function submit(values: BodyInput): void {
    save.mutate(values, {
      onSuccess: () => {
        toast.success(t('body.saved'));
        form.reset(bodyDefaults({ ...values, updatedAt: '' }));
        onSaved?.();
      },
      onError: () => {
        toast.error(t('errors.generic.description'));
      },
    });
  }

  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit(submit)(event);
      }}
    >
      <Controller
        control={form.control}
        name="sex"
        render={({ field }) => (
          <SegmentedControl
            label={t('body.sex')}
            options={SEXES.map((value) => ({
              value,
              label: t(`body.${value}`),
            }))}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <TextField
        label={t('body.birthDate')}
        type="date"
        max={today()}
        autoComplete="bday"
        error={fieldError(t, errors.birthDate?.message)}
        {...form.register('birthDate')}
      />
      <TextField
        label={`${t('body.height')}, ${t('body.cmShort')}`}
        inputMode="decimal"
        autoComplete="off"
        error={fieldError(t, errors.height?.message)}
        {...form.register('height')}
      />
      <div className="flex flex-col gap-2">
        <SelectField
          label={t('body.activity')}
          {...form.register('activityLevel')}
        >
          {ACTIVITY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {t(`body.activityLevels.${level}`)}
            </option>
          ))}
        </SelectField>
        <Text size="xs" tone="muted">
          {t(`body.activityHints.${activity}`)}
        </Text>
      </div>
      <Button
        type="submit"
        fullWidth
        loading={save.isPending}
        disabled={body !== null && !form.formState.isDirty}
      >
        {submitLabel}
      </Button>
    </form>
  );
}

export { BodyForm };

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSaveGoal } from '@/entities/body/api/use-body';
import {
  GOAL_TYPES,
  type Goal,
  type GoalInput,
} from '@/entities/body/model/schemas';
import type { Units } from '@/entities/user/api/current-user.service';
import {
  goalDefaults,
  goalFormSchema,
  RATE_PRESETS,
  usesRate,
  type GoalFormValues,
} from '@/features/body/model/goal-form';
import { unitLabel } from '@/features/body/model/labels';
import { fieldError } from '@/shared/lib/field-error';
import { toast } from '@/shared/lib/toast';
import { Button } from '@/shared/ui/button';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

function GoalForm({
  goal,
  units,
  submitLabel,
  onSaved,
}: {
  goal: Goal | null;
  units: Units;
  submitLabel: string;
  onSaved?: () => void;
}) {
  const { t } = useTranslation();
  const save = useSaveGoal();
  const schema = useMemo(() => goalFormSchema(units), [units]);
  const form = useForm<GoalFormValues, unknown, GoalInput>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: goalDefaults(goal, units),
  });
  const type = useWatch({ control: form.control, name: 'type' });
  const { errors } = form.formState;

  function submit(values: GoalInput): void {
    save.mutate(values, {
      onSuccess: () => {
        toast.success(t('body.saved'));
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
        name="type"
        render={({ field }) => (
          <div
            role="radiogroup"
            aria-label={t('goal.type')}
            className="flex flex-col gap-2"
          >
            <Text size="sm" tone="muted">
              {t('goal.type')}
            </Text>
            {GOAL_TYPES.map((value) => (
              <Button
                key={value}
                type="button"
                variant="option"
                size="auto"
                role="radio"
                aria-checked={field.value === value}
                aria-pressed={field.value === value}
                onClick={() => {
                  field.onChange(value);
                }}
              >
                {t(`goal.types.${value}`)}
              </Button>
            ))}
          </div>
        )}
      />
      {usesRate(type) ? (
        <Controller
          control={form.control}
          name="rate"
          render={({ field }) => (
            <SegmentedControl
              label={`${t('goal.rate')}, ${unitLabel(t, units)}`}
              options={RATE_PRESETS[units].map((value) => ({
                value,
                label: value,
              }))}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      ) : null}
      <TextField
        label={`${t('goal.targetWeight')}, ${unitLabel(t, units)}`}
        inputMode="decimal"
        autoComplete="off"
        error={fieldError(t, errors.targetWeight?.message)}
        {...form.register('targetWeight')}
      />
      <Button
        type="submit"
        fullWidth
        loading={save.isPending}
        disabled={goal !== null && !form.formState.isDirty}
      >
        {submitLabel}
      </Button>
    </form>
  );
}

export { GoalForm };

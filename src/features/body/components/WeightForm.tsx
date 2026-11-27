import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSaveWeight } from '@/entities/body/api/use-body';
import type { WeightEntry } from '@/entities/body/model/schemas';
import type { Units } from '@/entities/user/api/current-user.service';
import { useToday } from '@/entities/user/api/use-today';
import { unitLabel } from '@/features/body/model/labels';
import { MIN_WEIGHT_DATE } from '@/features/body/model/rules';
import {
  weightDefaults,
  weightFormSchema,
  type WeightFormOutput,
  type WeightFormValues,
} from '@/features/body/model/weight-form';
import { fieldError } from '@/shared/lib/field-error';
import { toast } from '@/shared/lib/toast';
import { Button } from '@/shared/ui/button';
import { TextField } from '@/shared/ui/text-field';

function WeightForm({
  entry,
  units,
  onSaved,
  secondary,
}: {
  entry: WeightEntry | null;
  units: Units;
  onSaved?: () => void;
  secondary?: { label: string; onClick: () => void };
}) {
  const { t } = useTranslation();
  const today = useToday();
  const save = useSaveWeight();
  const schema = useMemo(
    () => weightFormSchema(units, today()),
    [units, today],
  );
  const form = useForm<WeightFormValues, unknown, WeightFormOutput>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: weightDefaults(entry, units, today()),
  });
  const { errors } = form.formState;

  function submit(values: WeightFormOutput): void {
    save.mutate(
      {
        date: values.date,
        value: { weightKg: values.weightKg, note: values.note },
      },
      {
        onSuccess: () => {
          toast.success(t('weight.saved'));
          onSaved?.();
        },
        onError: () => {
          toast.error(t('errors.generic.description'));
        },
      },
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit(submit)(event);
      }}
    >
      <TextField
        label={t('weight.date')}
        type="date"
        min={MIN_WEIGHT_DATE}
        max={today()}
        readOnly={entry !== null}
        error={fieldError(t, errors.date?.message)}
        {...form.register('date')}
      />
      <TextField
        label={`${t('weight.value')}, ${unitLabel(t, units)}`}
        inputMode="decimal"
        autoComplete="off"
        error={fieldError(t, errors.weight?.message)}
        {...form.register('weight')}
      />
      <TextField
        label={t('weight.note')}
        placeholder={t('weight.notePlaceholder')}
        error={fieldError(t, errors.note?.message)}
        {...form.register('note')}
      />
      <div className="flex flex-col gap-3">
        <Button type="submit" fullWidth loading={save.isPending}>
          {t('weight.save')}
        </Button>
        {secondary ? (
          <Button
            type="button"
            variant="destructive"
            fullWidth
            onClick={secondary.onClick}
          >
            {secondary.label}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export { WeightForm };

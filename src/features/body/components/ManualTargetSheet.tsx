import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSetManualTarget } from '@/entities/nutrition/api/use-target';
import {
  manualTargetSchema,
  type ManualTargetValues,
} from '@/features/body/model/target-form';
import { fieldError } from '@/shared/lib/field-error';
import { toast } from '@/shared/lib/toast';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

function ManualTargetForm({
  calories,
  onSaved,
}: {
  calories: number;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const save = useSetManualTarget();
  const form = useForm<ManualTargetValues, unknown, number>({
    resolver: zodResolver(manualTargetSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { calories: String(calories) },
  });

  function submit(value: number): void {
    save.mutate(value, {
      onSuccess: () => {
        toast.success(t('target.manualSaved'));
        onSaved();
      },
      onError: () => {
        toast.error(t('errors.generic.description'));
      },
    });
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit(submit)(event);
      }}
    >
      <TextField
        label={t('target.manualLabel')}
        inputMode="numeric"
        autoComplete="off"
        error={fieldError(t, form.formState.errors.calories?.message)}
        {...form.register('calories')}
      />
      <Text size="xs" tone="muted">
        {t('target.manualHint')}
      </Text>
      <Button type="submit" fullWidth loading={save.isPending}>
        {t('body.save')}
      </Button>
    </form>
  );
}

function ManualTargetSheet({
  open,
  onOpenChange,
  calories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calories: number;
}) {
  const { t } = useTranslation();

  return (
    <BottomSheet
      compact
      open={open}
      onOpenChange={onOpenChange}
      title={t('target.manualTitle')}
    >
      <ManualTargetForm
        calories={calories}
        onSaved={() => {
          onOpenChange(false);
        }}
      />
    </BottomSheet>
  );
}

export { ManualTargetSheet };

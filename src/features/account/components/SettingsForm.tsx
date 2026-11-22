import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useUpdateCurrentUser } from '@/features/account/api/use-update-current-user';
import {
  settingsSchema,
  type SettingsValues,
} from '@/features/account/model/schema';
import { timeZoneOptions } from '@/features/account/model/time-zones';
import type {
  CurrentUser,
  UserPatch,
} from '@/features/auth/api/current-user.service';
import { fieldError } from '@/features/auth/components/field-error';
import { LANGUAGES, type Language } from '@/shared/i18n/language';
import { toast } from '@/shared/lib/toast';
import { Button } from '@/shared/ui/button';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { SelectField } from '@/shared/ui/select-field';

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  uk: 'Українська',
};

function valuesOf(user: CurrentUser): SettingsValues {
  return {
    language: user.language,
    units: user.units,
    timeZone: user.timeZone,
  };
}

function SettingsForm({ user }: { user: CurrentUser }) {
  const { t } = useTranslation();
  const updateCurrentUser = useUpdateCurrentUser();
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    mode: 'onSubmit',
    defaultValues: valuesOf(user),
  });
  const { dirtyFields } = form.formState;
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zones = timeZoneOptions(browserZone, user.timeZone);

  function save(values: SettingsValues): void {
    const patch: UserPatch = {};
    if (dirtyFields.language) {
      patch.language = values.language;
    }
    if (dirtyFields.units) {
      patch.units = values.units;
    }
    if (dirtyFields.timeZone) {
      patch.timeZone = values.timeZone;
    }
    updateCurrentUser.mutate(patch, {
      onSuccess: (saved) => {
        form.reset(valuesOf(saved));
        toast.success(t('settings.saved'));
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
        void form.handleSubmit(save)(event);
      }}
    >
      <SelectField
        label={t('settings.language')}
        {...form.register('language')}
      >
        {LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {LANGUAGE_NAMES[language]}
          </option>
        ))}
      </SelectField>
      <Controller
        control={form.control}
        name="units"
        render={({ field }) => (
          <SegmentedControl
            label={t('settings.units')}
            value={field.value}
            onChange={field.onChange}
            options={[
              { value: 'kg', label: t('settings.unitsKg') },
              { value: 'lb', label: t('settings.unitsLb') },
            ]}
          />
        )}
      />
      <SelectField
        label={t('settings.timeZone')}
        error={fieldError(t, form.formState.errors.timeZone?.message)}
        {...form.register('timeZone')}
      >
        {zones.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </SelectField>
      <Button
        type="submit"
        fullWidth
        loading={updateCurrentUser.isPending}
        disabled={!form.formState.isDirty}
      >
        {t('settings.save')}
      </Button>
    </form>
  );
}

export { SettingsForm };

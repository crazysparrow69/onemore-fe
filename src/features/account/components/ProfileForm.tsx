import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useUpdateCurrentUser } from '@/features/account/api/use-update-current-user';
import {
  profileSchema,
  type ProfileValues,
} from '@/features/account/model/schema';
import type {
  CurrentUser,
  UserPatch,
} from '@/entities/user/api/current-user.service';
import { fieldError } from '@/shared/lib/field-error';
import { hasErrorCode } from '@/shared/api/error';
import { toast } from '@/shared/lib/toast';
import { AvatarField } from '@/features/account/components/AvatarField';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

function valuesOf(user: CurrentUser): ProfileValues {
  return { name: user.name ?? '', nickname: user.nickname ?? '' };
}

function orNull(value: string): string | null {
  return value === '' ? null : value;
}

function ProfileForm({ user }: { user: CurrentUser }) {
  const { t } = useTranslation();
  const updateCurrentUser = useUpdateCurrentUser();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: valuesOf(user),
  });
  const { dirtyFields } = form.formState;

  function save(values: ProfileValues): void {
    const patch: UserPatch = {};
    if (dirtyFields.name) {
      patch.name = orNull(values.name);
    }
    if (dirtyFields.nickname) {
      patch.nickname = orNull(values.nickname);
    }
    updateCurrentUser.mutate(patch, {
      onSuccess: (saved) => {
        form.reset(valuesOf(saved));
        toast.success(t('profile.saved'));
      },
      onError: (error) => {
        if (hasErrorCode(error, 'NICKNAME_TAKEN')) {
          form.setError('nickname', { message: 'validation.nicknameTaken' });
          return;
        }
        toast.error(t('errors.generic.description'));
      },
    });
  }

  const name = useWatch({ control: form.control, name: 'name' });
  const nickname = useWatch({ control: form.control, name: 'nickname' });
  const preview = { name, nickname, email: user.email };

  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(event) => {
        void form.handleSubmit(save)(event);
      }}
    >
      <div className="flex justify-center">
        <AvatarField user={{ ...user, ...preview }} />
      </div>
      <TextField
        label={t('profile.name')}
        autoComplete="name"
        placeholder={t('profile.namePlaceholder')}
        error={fieldError(t, form.formState.errors.name?.message)}
        {...form.register('name')}
      />
      <div className="flex flex-col gap-2">
        <TextField
          label={t('profile.nickname')}
          autoComplete="nickname"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t('profile.nicknamePlaceholder')}
          error={fieldError(t, form.formState.errors.nickname?.message)}
          {...form.register('nickname')}
        />
        <Text size="xs" tone="muted">
          {t('profile.nicknameHint')}
        </Text>
      </div>
      <TextField
        label={t('profile.email')}
        type="email"
        value={user.email}
        readOnly
        disabled
      />
      <Button
        type="submit"
        fullWidth
        loading={updateCurrentUser.isPending}
        disabled={!form.formState.isDirty}
      >
        {t('profile.save')}
      </Button>
    </form>
  );
}

export { ProfileForm };

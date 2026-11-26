import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateCurrentUser } from '@/features/account/api/use-update-current-user';
import { initials } from '@/features/account/model/initials';
import { useImagePreparation } from '@/entities/media/api/use-image-preparation';
import { useMediaUpload } from '@/entities/media/api/use-media-upload';
import type { Rect } from '@/entities/media/model/compress-image';
import { isAborted, mediaErrorKey } from '@/entities/media/model/media-error';
import { mediaUrl } from '@/entities/media/model/media-url';
import type { CurrentUser } from '@/entities/user/api/current-user.service';
import { useSheet } from '@/shared/lib/use-sheet';
import { toast } from '@/shared/lib/toast';
import { ActionItem, ActionList } from '@/shared/ui/action-list';
import { Avatar } from '@/shared/ui/avatar';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { ConfirmSheet } from '@/shared/ui/confirm-sheet';
import { FilePicker, type FilePickerHandle } from '@/shared/ui/file-picker';
import { IconButton } from '@/shared/ui/icon-button';
import { ImageCropper } from '@/shared/ui/image-cropper';
import { Text } from '@/shared/ui/text';

type SheetName = 'actions' | 'remove';

function AvatarField({ user }: { user: CurrentUser }) {
  const { t } = useTranslation();
  const picker = useRef<FilePickerHandle>(null);
  const sheet = useSheet<SheetName>();
  const upload = useMediaUpload('avatar');
  const preparation = useImagePreparation();
  const update = useUpdateCurrentUser();
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(
    null,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const url = picked?.url;
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [picked]);

  const busy =
    upload.uploading || preparation.preparing || saving || update.isPending;
  const current = user.avatar ? mediaUrl(user.avatar, 'avatar_lg') : null;

  function choose() {
    if (user.avatar) {
      sheet.show('actions');
    } else {
      picker.current?.open();
    }
  }

  async function pick(file: File) {
    try {
      const ready = await preparation.prepare(file);
      setPicked({ file: ready, url: URL.createObjectURL(ready) });
    } catch (error) {
      toast.error(t(mediaErrorKey(error)));
    }
  }

  async function send(file: File, crop: Rect) {
    setSaving(true);
    try {
      const uploaded = await upload.start(file, { crop });
      setPreview(uploaded.previewUrl);
      await update.mutateAsync({ avatarId: uploaded.id });
      toast.success(t('media.avatar.saved'));
    } catch (error) {
      if (!isAborted(error)) {
        toast.error(t(mediaErrorKey(error)));
      }
    } finally {
      setPreview(null);
      setSaving(false);
    }
  }

  function remove() {
    sheet.close();
    update.mutate(
      { avatarId: null },
      {
        onSuccess: () => {
          toast.success(t('media.avatar.removed'));
        },
        onError: () => {
          toast.error(t('errors.generic.description'));
        },
      },
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar
          size="lg"
          initials={initials(user)}
          src={preview ?? current}
          busy={busy}
        />
        <IconButton
          aria-label={t('media.avatar.change')}
          disabled={busy}
          className="absolute -right-1 -bottom-1 size-8 ring-2 ring-background [&_svg]:size-4"
          onClick={choose}
        >
          <Camera aria-hidden />
        </IconButton>
      </div>
      {upload.uploading ? (
        <Text size="xs" tone="muted" aria-live="polite">
          {Math.round(upload.progress * 100)}%
        </Text>
      ) : null}

      <FilePicker
        ref={picker}
        onPick={(file) => {
          void pick(file);
        }}
      />
      <ImageCropper
        image={picked?.url ?? null}
        title={t('media.avatar.cropTitle')}
        zoomLabel={t('media.avatar.zoom')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('media.avatar.use')}
        onCancel={() => {
          setPicked(null);
        }}
        onConfirm={(area) => {
          if (picked) {
            void send(picked.file, area);
          }
          setPicked(null);
        }}
      />

      <BottomSheet
        compact
        {...sheet.bind('actions')}
        title={t('media.avatar.title')}
      >
        <ActionList>
          <ActionItem
            icon={ImagePlus}
            onClick={() => {
              sheet.close();
              picker.current?.open();
            }}
          >
            {t('media.avatar.choose')}
          </ActionItem>
          <ActionItem
            icon={Trash2}
            destructive
            onClick={() => {
              sheet.show('remove');
            }}
          >
            {t('media.avatar.remove')}
          </ActionItem>
        </ActionList>
      </BottomSheet>
      <ConfirmSheet
        {...sheet.bind('remove')}
        title={t('media.avatar.removeTitle')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('media.avatar.remove')}
        pending={update.isPending}
        onConfirm={remove}
      >
        <Text tone="muted">{t('media.avatar.removeHint')}</Text>
      </ConfirmSheet>
    </div>
  );
}

export { AvatarField };

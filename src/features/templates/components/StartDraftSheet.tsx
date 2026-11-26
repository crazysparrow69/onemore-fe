import { useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { Template } from '@/features/templates/api/templates.service';
import { ConfirmSheet } from '@/shared/ui/confirm-sheet';
import { Text } from '@/shared/ui/text';

function StartDraftSheet({
  pending,
  onClose,
  onReplace,
}: {
  pending: Template | null;
  onClose: () => void;
  onReplace: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <ConfirmSheet
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t('templates.draftTitle')}
      cancelLabel={t('templates.draftContinue')}
      onCancel={() => {
        onClose();
        void router.navigate({ to: '/workout' });
      }}
      confirmLabel={t('templates.draftReplace')}
      onConfirm={onReplace}
    >
      <Text tone="muted">{t('templates.draftHint')}</Text>
    </ConfirmSheet>
  );
}

export { StartDraftSheet };

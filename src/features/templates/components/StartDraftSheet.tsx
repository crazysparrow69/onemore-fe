import { useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { Template } from '@/features/templates/api/templates.service';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
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
    <BottomSheet
      compact
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t('templates.draftTitle')}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            className="min-w-0 flex-1 px-3 text-sm"
            onClick={() => {
              onClose();
              void router.navigate({ to: '/workout' });
            }}
          >
            {t('templates.draftContinue')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-w-0 flex-1 px-3 text-sm"
            onClick={onReplace}
          >
            {t('templates.draftReplace')}
          </Button>
        </>
      }
    >
      <Text tone="muted">{t('templates.draftHint')}</Text>
    </BottomSheet>
  );
}

export { StartDraftSheet };

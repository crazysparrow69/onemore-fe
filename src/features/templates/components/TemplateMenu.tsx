import { Copy, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Template } from '@/features/templates/api/templates.service';
import { useArchiveTemplate } from '@/features/templates/api/use-templates';
import {
  useDuplicateTemplate,
  useEditorLaunch,
} from '@/features/templates/model/use-launch';
import { toast } from '@/shared/lib/toast';
import { ActionItem, ActionList } from '@/shared/ui/action-list';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { ConfirmSheet } from '@/shared/ui/confirm-sheet';
import { Text } from '@/shared/ui/text';

type Step = 'actions' | 'delete';

function TemplateMenu({
  template,
  onClose,
  onDeleted,
}: {
  template: Template | null;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('actions');
  const launch = useEditorLaunch();
  const copy = useDuplicateTemplate();
  const archive = useArchiveTemplate();

  function close() {
    setStep('actions');
    onClose();
  }

  function remove() {
    if (!template) {
      return;
    }
    archive.mutate(template.id, {
      onSuccess: () => {
        close();
        toast.success(t('templates.deleted'));
        onDeleted?.();
      },
      onError: () => {
        toast.error(t('errors.generic.description'));
      },
    });
  }

  return (
    <>
      <BottomSheet
        compact
        open={template !== null && step === 'actions'}
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
        title={template?.name ?? ''}
      >
        <ActionList>
          <ActionItem
            icon={Pencil}
            disabled={!launch.ready}
            onClick={() => {
              if (template) {
                const target = template;
                close();
                launch.editProgram(target);
              }
            }}
          >
            {t('templates.edit')}
          </ActionItem>
          <ActionItem
            icon={Copy}
            disabled={copy.pending}
            onClick={() => {
              if (!template) {
                return;
              }
              copy.duplicate(template, t('templates.copySuffix'), {
                onSuccess: () => {
                  toast.success(t('templates.duplicated'));
                },
                onError: () => {
                  toast.error(t('templates.errors.generic'));
                },
              });
              close();
            }}
          >
            {t('templates.duplicate')}
          </ActionItem>
          <ActionItem
            icon={Trash2}
            destructive
            onClick={() => {
              setStep('delete');
            }}
          >
            {t('templates.delete')}
          </ActionItem>
        </ActionList>
      </BottomSheet>

      <ConfirmSheet
        open={template !== null && step === 'delete'}
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
        title={t('templates.deleteTitle')}
        cancelLabel={t('common.cancel')}
        onCancel={close}
        confirmLabel={t('templates.delete')}
        onConfirm={remove}
        pending={archive.isPending}
      >
        <Text tone="muted">{t('templates.deleteHint')}</Text>
      </ConfirmSheet>
    </>
  );
}

export { TemplateMenu };

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
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
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
  const itemClass =
    'flex w-full items-center gap-3 py-3 text-left text-base outline-none focus-visible:bg-accent disabled:opacity-40';

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
        <ul className="flex flex-col">
          <li>
            <button
              type="button"
              disabled={!launch.ready}
              className={itemClass}
              onClick={() => {
                if (template) {
                  const target = template;
                  close();
                  launch.editProgram(target);
                }
              }}
            >
              <Pencil className="size-5" aria-hidden />
              {t('templates.edit')}
            </button>
          </li>
          <li>
            <button
              type="button"
              disabled={copy.pending}
              className={itemClass}
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
              <Copy className="size-5" aria-hidden />
              {t('templates.duplicate')}
            </button>
          </li>
          <li className="border-t border-border">
            <button
              type="button"
              className={`${itemClass} text-destructive`}
              onClick={() => {
                setStep('delete');
              }}
            >
              <Trash2 className="size-5" aria-hidden />
              {t('templates.delete')}
            </button>
          </li>
        </ul>
      </BottomSheet>

      <BottomSheet
        compact
        open={template !== null && step === 'delete'}
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
        title={t('templates.deleteTitle')}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              className="min-w-0 flex-1 px-3 text-sm"
              onClick={close}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-w-0 flex-1 px-3 text-sm"
              loading={archive.isPending}
              onClick={remove}
            >
              {t('templates.delete')}
            </Button>
          </>
        }
      >
        <Text tone="muted">{t('templates.deleteHint')}</Text>
      </BottomSheet>
    </>
  );
}

export { TemplateMenu };

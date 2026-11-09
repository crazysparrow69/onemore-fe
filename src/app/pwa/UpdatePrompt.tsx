import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const { t } = useTranslation();

  if (!needRefresh) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex flex-col gap-3 px-4 py-3">
        <p>{t('pwa.update.message')}</p>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => {
              void updateServiceWorker(true);
            }}
          >
            {t('pwa.update.reload')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setNeedRefresh(false);
            }}
          >
            {t('pwa.update.later')}
          </Button>
        </div>
      </div>
    </div>
  );
}

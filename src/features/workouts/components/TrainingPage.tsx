import { useRouter } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth/api/use-auth';
import {
  useDraftStore,
  useWorkoutDraft,
} from '@/features/workouts/model/draft-store';
import { Text } from '@/shared/ui/text';

function TrainingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useCurrentUser();
  const draft = useWorkoutDraft(user.data?.id);
  const startDraft = useDraftStore((state) => state.start);

  function start(userId: string) {
    if (!draft) {
      startDraft(userId);
    }
    void router.navigate({ to: '/workout' });
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-8">
      <Text as="h1" size="2xl" weight="semibold">
        {t('training.title')}
      </Text>

      <button
        type="button"
        disabled={!user.data}
        className="flex items-center gap-3 rounded-xl bg-card px-4 py-4 text-left font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
        onClick={() => {
          if (user.data) {
            start(user.data.id);
          }
        }}
      >
        <Plus className="size-6" aria-hidden />
        {draft ? t('training.continue') : t('training.start')}
      </button>

      <section className="flex flex-col gap-3">
        <Text as="h2" size="lg" weight="semibold">
          {t('training.programs')}
        </Text>
        <div className="flex flex-col gap-1 rounded-xl bg-card p-4">
          <Text weight="medium">{t('training.programsEmpty')}</Text>
          <Text size="sm" tone="muted">
            {t('training.programsEmptyHint')}
          </Text>
        </div>
      </section>
    </main>
  );
}

export { TrainingPage };

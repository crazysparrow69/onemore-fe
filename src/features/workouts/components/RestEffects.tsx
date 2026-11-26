import { skipToken, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authKeys } from '@/features/auth/api/auth.keys';
import type { CurrentUser } from '@/features/auth/api/current-user.service';
import { useDraftStore } from '@/features/workouts/model/draft-store';
import { formatClock } from '@/features/workouts/model/format';
import { playRestSignal } from '@/shared/lib/rest-signal';
import { toast } from '@/shared/lib/toast';

const SIGNAL_GRACE_MS = 3000;
const CHECK_MS = 250;

function RestEffects() {
  const { t } = useTranslation();
  const user = useQuery<CurrentUser>({
    queryKey: authKeys.currentUser(),
    queryFn: skipToken,
  });
  const userId = user.data?.id;
  const endsAt = useDraftStore((state) =>
    userId !== undefined && state.ownerId === userId
      ? (state.draft?.rest?.endsAt ?? null)
      : null,
  );

  useEffect(() => {
    if (endsAt === null) {
      return;
    }
    let finished = false;
    const check = () => {
      const late = Date.now() - endsAt;
      if (finished || late < 0) {
        return;
      }
      finished = true;
      useDraftStore.getState().skipRest();
      if (late <= SIGNAL_GRACE_MS) {
        playRestSignal();
        toast.info(t('workout.rest.finished'));
      } else {
        toast.info(
          t('workout.rest.finishedAgo', { time: formatClock(late / 1000) }),
        );
      }
    };
    check();
    const timer = window.setInterval(check, CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [endsAt, t]);

  useEffect(() => {
    if (endsAt === null || !('wakeLock' in navigator)) {
      return;
    }
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = () => {
      if (
        document.visibilityState !== 'visible' ||
        (sentinel !== null && !sentinel.released)
      ) {
        return;
      }
      navigator.wakeLock
        .request('screen')
        .then((lock) => {
          if (cancelled) {
            void lock.release();
            return;
          }
          sentinel = lock;
        })
        .catch(() => undefined);
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', acquire);
      void sentinel?.release().catch(() => undefined);
    };
  }, [endsAt]);

  return null;
}

export { RestEffects };

import { skipToken, useQuery } from '@tanstack/react-query';
import { Link, useRouterState } from '@tanstack/react-router';
import { ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authKeys } from '@/features/auth/api/auth.keys';
import type { CurrentUser } from '@/features/auth/api/current-user.service';
import { useWorkoutDraft } from '@/features/workouts/model/draft-store';
import { formatClock } from '@/features/workouts/model/format';
import { useNow } from '@/features/workouts/model/use-now';

const HIDDEN_PREFIXES = ['/workout', '/sign-in', '/sign-up', '/auth'] as const;

function hidden(pathname: string): boolean {
  return (
    (pathname === '/workouts' ||
      HIDDEN_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      )) &&
    !pathname.startsWith('/workouts/')
  );
}

function ActiveWorkoutBar() {
  const { t } = useTranslation();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const user = useQuery<CurrentUser>({
    queryKey: authKeys.currentUser(),
    queryFn: skipToken,
  });
  const draft = useWorkoutDraft(user.data?.id);
  const now = useNow();

  if (!draft || hidden(pathname)) {
    return null;
  }
  const elapsed = (now - new Date(draft.startedAt).getTime()) / 1000;

  return (
    <>
      <div className="h-16 shrink-0" aria-hidden />
      <Link
        to="/workout"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md items-center justify-between rounded-t-2xl bg-primary px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-primary-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="font-semibold">{t('workout.bar')}</span>
        <span className="flex items-center gap-2 tabular-nums">
          {formatClock(elapsed)}
          <ChevronUp className="size-5" aria-hidden />
        </span>
      </Link>
    </>
  );
}

export { ActiveWorkoutBar };

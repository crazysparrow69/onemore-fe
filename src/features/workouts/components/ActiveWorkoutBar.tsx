import { skipToken, useQuery } from '@tanstack/react-query';
import { Link, useRouterState } from '@tanstack/react-router';
import { ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authKeys } from '@/features/auth/api/auth.keys';
import type { CurrentUser } from '@/features/auth/api/current-user.service';
import { useWorkoutDraft } from '@/features/workouts/model/draft-store';
import { formatClock } from '@/features/workouts/model/format';
import { restLeftSeconds } from '@/features/workouts/model/rest';
import { useNow } from '@/features/workouts/model/use-now';

const HIDDEN_PREFIXES = ['/workout', '/sign-in', '/sign-up', '/auth'] as const;

function hidden(pathname: string): boolean {
  return HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
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
  const rest = draft.rest ?? null;

  return (
    <Link
      to="/workout"
      className="pointer-events-auto flex items-center justify-between rounded-2xl bg-primary px-5 py-3 text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_12px_32px_-8px_rgb(0_0_0/0.7)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="font-semibold">
        {rest ? t('workout.rest.title') : t('workout.bar')}
      </span>
      <span className="flex items-center gap-2 tabular-nums">
        {formatClock(rest ? restLeftSeconds(rest, now) : elapsed)}
        <ChevronUp className="size-5" aria-hidden />
      </span>
    </Link>
  );
}

export { ActiveWorkoutBar };

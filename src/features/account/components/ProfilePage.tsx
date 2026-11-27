import { Link } from '@tanstack/react-router';
import { Dumbbell, Pencil, Scale, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { initials } from '@/features/account/model/initials';
import { mediaUrl } from '@/entities/media/model/media-url';
import { useCurrentUser } from '@/entities/user/api/use-auth';
import { WorkoutHistoryList } from '@/entities/training/components/WorkoutHistoryList';
import { useWorkoutList } from '@/entities/training/api/use-workouts';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

const ICON_LINK =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary outline-none hover:bg-secondary/80 focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-5';

function ProfilePage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const list = useWorkoutList();
  const total = list.data?.pages[0]?.total;

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-8">
      <header className="flex items-center justify-between gap-3">
        <Text as="h1" size="2xl" weight="semibold" className="min-w-0 truncate">
          {user.data?.nickname ?? t('profile.title')}
        </Text>
        <div className="flex items-center gap-2">
          <Link
            to="/profile/edit"
            aria-label={t('profile.edit')}
            className={ICON_LINK}
          >
            <Pencil aria-hidden />
          </Link>
          <Link
            to="/settings"
            aria-label={t('settings.title')}
            className={ICON_LINK}
          >
            <Settings aria-hidden />
          </Link>
        </div>
      </header>

      {user.isPending ? (
        <div className="flex items-center gap-4" aria-hidden>
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-10 w-40" />
        </div>
      ) : null}
      {user.isError ? (
        <Text tone="danger">{t('errors.generic.description')}</Text>
      ) : null}
      {user.data ? (
        <div className="flex items-center gap-4">
          <Avatar
            size="lg"
            initials={initials(user.data)}
            src={
              user.data.avatar ? mediaUrl(user.data.avatar, 'avatar_lg') : null
            }
          />
          <div className="flex min-w-0 flex-col">
            <Text size="lg" weight="semibold" className="truncate">
              {user.data.name ?? user.data.email}
            </Text>
            {user.data.nickname ? (
              <Text tone="muted" className="truncate">
                @{user.data.nickname}
              </Text>
            ) : null}
            <Text size="sm" tone="muted">
              {t('profile.workoutsCount')}: {total ?? '–'}
            </Text>
          </div>
        </div>
      ) : null}

      <Button
        asChild
        variant="card"
        size="auto"
        className="justify-start gap-3 py-4"
      >
        <Link to="/exercises">
          <Dumbbell className="size-6" aria-hidden />
          {t('profile.exercises')}
        </Link>
      </Button>

      <Button
        asChild
        variant="card"
        size="auto"
        className="justify-start gap-3 py-4"
      >
        <Link to="/body">
          <Scale className="size-6" aria-hidden />
          {t('body.title')}
        </Link>
      </Button>

      <section className="flex flex-col gap-3">
        <Text as="h2" size="lg" weight="semibold">
          {t('profile.history')}
        </Text>
        <WorkoutHistoryList />
      </section>
    </main>
  );
}

export { ProfilePage };

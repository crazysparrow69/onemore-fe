import { useTranslation } from 'react-i18next';
import { useWorkoutList } from '@/features/workouts/api/use-workouts';
import { WorkoutCard } from '@/features/workouts/components/WorkoutCard';
import { Button } from '@/shared/ui/button';
import { LoadMore } from '@/shared/ui/load-more';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

function WorkoutHistoryList() {
  const { t } = useTranslation();
  const list = useWorkoutList();
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="flex flex-col gap-3">
      {list.isPending ? (
        <div className="flex flex-col gap-3" aria-hidden>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : null}

      {list.isError ? (
        <div className="flex flex-col items-start gap-3 py-4">
          <Text tone="danger">{t('errors.generic.description')}</Text>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void list.refetch();
            }}
          >
            {t('common.retry')}
          </Button>
        </div>
      ) : null}

      {list.data && items.length === 0 ? (
        <div className="flex flex-col gap-1 py-2">
          <Text weight="medium">{t('workout.historyEmpty')}</Text>
          <Text tone="muted">{t('workout.historyEmptyHint')}</Text>
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map((workout) => (
            <li key={workout.id}>
              <WorkoutCard workout={workout} />
            </li>
          ))}
        </ul>
      ) : null}

      {list.isFetchingNextPage ? (
        <Skeleton className="h-40 w-full rounded-xl" aria-hidden />
      ) : null}
      {list.hasNextPage && !list.isFetchingNextPage ? (
        <LoadMore
          onVisible={() => {
            void list.fetchNextPage();
          }}
        />
      ) : null}
    </div>
  );
}

export { WorkoutHistoryList };

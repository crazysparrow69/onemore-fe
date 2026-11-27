import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteWeight, useWeightLog } from '@/entities/body/api/use-body';
import type { WeightEntry } from '@/entities/body/model/schemas';
import type { Units } from '@/entities/user/api/current-user.service';
import { dateLabel } from '@/entities/training/model/display';
import { BodyScreen } from '@/features/body/components/BodyScreen';
import { WeightEntrySheet } from '@/features/body/components/WeightEntrySheet';
import { WeightRow } from '@/features/body/components/WeightRow';
import { toast } from '@/shared/lib/toast';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ConfirmSheet } from '@/shared/ui/confirm-sheet';
import { ErrorState } from '@/shared/ui/error-state';
import { LoadMore } from '@/shared/ui/load-more';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

function WeightLog({ units }: { units: Units }) {
  const { t, i18n } = useTranslation();
  const log = useWeightLog();
  const remove = useDeleteWeight();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<WeightEntry | null>(null);
  const [deleting, setDeleting] = useState<WeightEntry | null>(null);
  const entries = log.data?.pages.flat() ?? [];

  function confirmDelete(): void {
    if (!deleting) {
      return;
    }
    remove.mutate(deleting.localDate, {
      onSuccess: () => {
        toast.success(t('weight.deleted'));
        setDeleting(null);
      },
      onError: () => {
        toast.error(t('errors.generic.description'));
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        onClick={() => {
          setAdding(true);
        }}
      >
        {t('weight.add')}
      </Button>

      {log.isPending ? (
        <div className="flex flex-col gap-2" aria-hidden>
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : null}

      {log.isError ? (
        <ErrorState
          message={t('weight.loadError')}
          onRetry={() => {
            void log.refetch();
          }}
        />
      ) : null}

      {log.data && entries.length === 0 ? (
        <Card>
          <Text weight="medium">{t('weight.empty')}</Text>
          <Text size="sm" tone="muted">
            {t('weight.emptyHint')}
          </Text>
        </Card>
      ) : null}

      {entries.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.localDate}>
              <WeightRow entry={entry} units={units} onSelect={setEditing} />
            </li>
          ))}
        </ul>
      ) : null}

      {log.hasNextPage ? (
        <LoadMore
          onVisible={() => {
            if (!log.isFetchingNextPage) {
              void log.fetchNextPage();
            }
          }}
        />
      ) : null}

      <WeightEntrySheet
        open={adding}
        onOpenChange={setAdding}
        entry={null}
        units={units}
      />
      <WeightEntrySheet
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        entry={editing}
        units={units}
        onDelete={(entry) => {
          setEditing(null);
          setDeleting(entry);
        }}
      />
      <ConfirmSheet
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        title={t('weight.deleteTitle')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('weight.delete')}
        onConfirm={confirmDelete}
        pending={remove.isPending}
      >
        {deleting ? (
          <Text tone="muted">
            {t('weight.deleteDescription', {
              date: dateLabel(deleting.localDate, i18n.language),
            })}
          </Text>
        ) : null}
      </ConfirmSheet>
    </div>
  );
}

function WeightLogPage() {
  const { t } = useTranslation();

  return (
    <BodyScreen title={t('weight.logTitle')} backTo="/body">
      {(user) => <WeightLog units={user.units} />}
    </BodyScreen>
  );
}

export { WeightLogPage };

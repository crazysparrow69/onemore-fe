import { SkipForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatClock } from '@/entities/training/model/format';
import {
  REST_ADJUST_SECONDS,
  restLeftSeconds,
  type Rest,
} from '@/entities/training/model/rest';
import { useNow } from '@/entities/training/model/use-now';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

function RestTimerPanel({
  rest,
  onAdjust,
  onSkip,
}: {
  rest: Rest;
  onAdjust: (deltaS: number) => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  const now = useNow(250);
  const left = restLeftSeconds(rest, now);
  const share = Math.min(
    1,
    Math.max(0, (rest.endsAt - now) / (rest.durationS * 1000)),
  );

  return (
    <div
      role="timer"
      aria-label={t('workout.rest.timer')}
      className="glass sticky bottom-3 z-20 mx-4 mt-4 flex flex-col gap-3 overflow-hidden rounded-2xl p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <Text as="span" size="xs" tone="muted">
            {t('workout.rest.title')}
          </Text>
          <Text as="span" size="3xl" weight="semibold" numeric>
            {formatClock(left)}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="control"
            onClick={() => {
              onAdjust(-REST_ADJUST_SECONDS);
            }}
          >
            {`−${String(REST_ADJUST_SECONDS)}`}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="control"
            onClick={() => {
              onAdjust(REST_ADJUST_SECONDS);
            }}
          >
            {`+${String(REST_ADJUST_SECONDS)}`}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="control"
            leftIcon={<SkipForward aria-hidden />}
            onClick={onSkip}
          >
            {t('workout.rest.skip')}
          </Button>
        </div>
      </div>
      <div className="h-1 rounded-full bg-secondary" aria-hidden>
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200 ease-linear"
          style={{ width: `${String(Math.round(share * 100))}%` }}
        />
      </div>
    </div>
  );
}

export { RestTimerPanel };

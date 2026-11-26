import { SkipForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatClock } from '@/features/workouts/model/format';
import {
  REST_ADJUST_SECONDS,
  restLeftSeconds,
  type Rest,
} from '@/features/workouts/model/rest';
import { useNow } from '@/features/workouts/model/use-now';

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
  const buttonClass =
    'flex h-10 min-w-0 items-center justify-center gap-1 rounded-lg bg-secondary px-3 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

  return (
    <div
      role="timer"
      aria-label={t('workout.rest.timer')}
      className="glass sticky bottom-3 z-20 mx-4 mt-4 flex flex-col gap-3 overflow-hidden rounded-2xl p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">
            {t('workout.rest.title')}
          </span>
          <span className="text-3xl font-semibold tabular-nums">
            {formatClock(left)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              onAdjust(-REST_ADJUST_SECONDS);
            }}
          >
            {`−${String(REST_ADJUST_SECONDS)}`}
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              onAdjust(REST_ADJUST_SECONDS);
            }}
          >
            {`+${String(REST_ADJUST_SECONDS)}`}
          </button>
          <button type="button" className={buttonClass} onClick={onSkip}>
            <SkipForward className="size-4" aria-hidden />
            {t('workout.rest.skip')}
          </button>
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

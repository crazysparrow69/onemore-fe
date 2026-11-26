import { Check, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatClock } from '@/features/workouts/model/format';
import { REST_PRESETS_SECONDS } from '@/features/workouts/model/rest';
import {
  restSoundEnabled,
  setRestSoundEnabled,
} from '@/shared/lib/rest-signal';
import { cn } from '@/shared/lib/utils';
import { BottomSheet } from '@/shared/ui/bottom-sheet';

function RestPickerSheet({
  open,
  onOpenChange,
  title,
  current,
  allowOff,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  current: number | null;
  allowOff: boolean;
  onPick: (seconds: number | null) => void;
}) {
  const { t } = useTranslation();
  const [sound, setSound] = useState(restSoundEnabled);
  const rowClass =
    'flex w-full items-center justify-between gap-3 py-3 text-left text-base outline-none focus-visible:bg-accent';
  const options: (number | null)[] = [
    ...(allowOff ? [null] : []),
    ...REST_PRESETS_SECONDS,
  ];

  return (
    <BottomSheet compact open={open} onOpenChange={onOpenChange} title={title}>
      <ul className="flex flex-col">
        {options.map((seconds) => (
          <li key={seconds ?? 'off'}>
            <button
              type="button"
              className={rowClass}
              onClick={() => {
                onPick(seconds);
              }}
            >
              <span className="tabular-nums">
                {seconds === null
                  ? t('workout.rest.off')
                  : formatClock(seconds)}
              </span>
              <Check
                className={cn(
                  'size-5 text-primary',
                  seconds === current ? '' : 'invisible',
                )}
                aria-hidden
              />
            </button>
          </li>
        ))}
        <li className="border-t border-border">
          <button
            type="button"
            role="switch"
            aria-checked={sound}
            className={rowClass}
            onClick={() => {
              setRestSoundEnabled(!sound);
              setSound(!sound);
            }}
          >
            <span>{t('workout.rest.sound')}</span>
            {sound ? (
              <Volume2 className="size-5 text-primary" aria-hidden />
            ) : (
              <VolumeX className="size-5 text-muted-foreground" aria-hidden />
            )}
          </button>
        </li>
      </ul>
    </BottomSheet>
  );
}

export { RestPickerSheet };

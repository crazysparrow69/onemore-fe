import { Check, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatClock } from '@/entities/training/model/format';
import { REST_PRESETS_SECONDS } from '@/entities/training/model/rest';
import {
  restSoundEnabled,
  setRestSoundEnabled,
} from '@/shared/lib/rest-signal';
import { cn } from '@/shared/lib/utils';
import { ActionItem, ActionList } from '@/shared/ui/action-list';
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
  const options: (number | null)[] = [
    ...(allowOff ? [null] : []),
    ...REST_PRESETS_SECONDS,
  ];

  return (
    <BottomSheet compact open={open} onOpenChange={onOpenChange} title={title}>
      <ActionList>
        {options.map((seconds) => (
          <ActionItem
            key={seconds ?? 'off'}
            trailing={
              <Check
                className={cn(
                  'size-5 text-primary',
                  seconds === current ? '' : 'invisible',
                )}
                aria-hidden
              />
            }
            onClick={() => {
              onPick(seconds);
            }}
          >
            <span className="tabular-nums">
              {seconds === null ? t('workout.rest.off') : formatClock(seconds)}
            </span>
          </ActionItem>
        ))}
        <ActionItem
          separated
          role="switch"
          checked={sound}
          trailing={
            sound ? (
              <Volume2 className="size-5 text-primary" aria-hidden />
            ) : (
              <VolumeX className="size-5 text-muted-foreground" aria-hidden />
            )
          }
          onClick={() => {
            setRestSoundEnabled(!sound);
            setSound(!sound);
          }}
        >
          <span>{t('workout.rest.sound')}</span>
        </ActionItem>
      </ActionList>
    </BottomSheet>
  );
}

export { RestPickerSheet };

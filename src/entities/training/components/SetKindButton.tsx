import { type SetKind } from '@/entities/training/model/draft';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

const KIND_TONE: Readonly<Record<SetKind, string>> = {
  working: '',
  warmup: 'text-amber-400',
  drop: 'text-violet-400',
  failure: 'text-destructive',
};

function SetKindButton({
  kind,
  mark,
  label,
  onClick,
}: {
  kind: SetKind;
  mark: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="cell"
      aria-label={label}
      className={cn('font-semibold', KIND_TONE[kind])}
      onClick={onClick}
    >
      {mark}
    </Button>
  );
}

export { SetKindButton };

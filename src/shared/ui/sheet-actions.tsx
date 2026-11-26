import { Button } from '@/shared/ui/button';
import type { ButtonVariantProps } from '@/shared/ui/button-variants';

interface SheetAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function SheetActions({
  secondary,
  primary,
  primaryVariant,
  auxiliary = false,
}: {
  secondary: SheetAction;
  primary: SheetAction;
  primaryVariant?: ButtonVariantProps['variant'];
  auxiliary?: boolean;
}) {
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className={
          auxiliary ? 'shrink-0 px-3 text-sm' : 'min-w-0 flex-1 px-3 text-sm'
        }
        disabled={secondary.disabled}
        loading={secondary.loading}
        onClick={secondary.onClick}
      >
        {secondary.label}
      </Button>
      <Button
        type="button"
        variant={primaryVariant}
        className="min-w-0 flex-1 px-3 text-sm"
        disabled={primary.disabled}
        loading={primary.loading}
        onClick={primary.onClick}
      >
        {primary.label}
      </Button>
    </>
  );
}

export { SheetActions };
export type { SheetAction };

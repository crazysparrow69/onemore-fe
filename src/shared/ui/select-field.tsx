import { type ComponentProps, useId } from 'react';
import { Select } from '@/shared/ui/select';
import { Text } from '@/shared/ui/text';

type SelectFieldProps = ComponentProps<typeof Select> & {
  label: string;
  error?: string;
};

function SelectField({
  label,
  error,
  id,
  children,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Text as="label" htmlFor={selectId} size="sm" tone="muted">
        {label}
      </Text>
      <Select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...props}
      >
        {children}
      </Select>
      {error ? (
        <Text id={errorId} size="sm" tone="danger">
          {error}
        </Text>
      ) : null}
    </div>
  );
}

export { SelectField };

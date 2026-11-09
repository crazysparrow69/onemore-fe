import { type ComponentProps, useId } from 'react';
import { Input } from '@/shared/ui/input';
import { Text } from '@/shared/ui/text';

type TextFieldProps = ComponentProps<typeof Input> & {
  label: string;
  error?: string;
};

function TextField({ label, error, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Text as="label" htmlFor={inputId} size="sm" tone="muted">
        {label}
      </Text>
      <Input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...props}
      />
      {error ? (
        <Text id={errorId} size="sm" tone="danger">
          {error}
        </Text>
      ) : null}
    </div>
  );
}

export { TextField };

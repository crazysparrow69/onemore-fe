import { useImperativeHandle, useRef, type Ref } from 'react';

export interface FilePickerHandle {
  open: () => void;
}

function FilePicker({
  ref,
  accept = 'image/*',
  onPick,
}: {
  ref?: Ref<FilePickerHandle>;
  accept?: string;
  onPick: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        input.current?.click();
      },
    }),
    [],
  );

  return (
    <input
      ref={input}
      type="file"
      accept={accept}
      hidden
      data-slot="file-picker"
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) {
          onPick(file);
        }
      }}
    />
  );
}

export { FilePicker };

import { fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FilePicker, type FilePickerHandle } from '@/shared/ui/file-picker';

function input(container: HTMLElement): HTMLInputElement {
  const element = container.querySelector('input[type="file"]');
  if (!(element instanceof HTMLInputElement)) {
    throw new Error('Missing input');
  }
  return element;
}

describe('FilePicker', () => {
  it('opens the system picker through its handle', () => {
    const ref = createRef<FilePickerHandle>();
    const { container } = render(<FilePicker ref={ref} onPick={vi.fn()} />);
    const click = vi.spyOn(input(container), 'click');
    ref.current?.open();
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('accepts images by default', () => {
    const { container } = render(<FilePicker onPick={vi.fn()} />);
    expect(input(container).accept).toBe('image/*');
  });

  it('hands over the chosen file', () => {
    const onPick = vi.fn();
    const { container } = render(<FilePicker onPick={onPick} />);
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    fireEvent.change(input(container), { target: { files: [file] } });
    expect(onPick).toHaveBeenCalledWith(file);
  });

  it('ignores a cancelled choice', () => {
    const onPick = vi.fn();
    const { container } = render(<FilePicker onPick={onPick} />);
    fireEvent.change(input(container), { target: { files: [] } });
    expect(onPick).not.toHaveBeenCalled();
  });
});

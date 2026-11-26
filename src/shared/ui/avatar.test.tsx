import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from '@/shared/ui/avatar';

function avatar(container: HTMLElement): HTMLElement {
  const element = container.querySelector('[data-slot="avatar"]');
  if (!(element instanceof HTMLElement)) {
    throw new Error('Missing avatar');
  }
  return element;
}

describe('Avatar', () => {
  it('shows the initials without an image', () => {
    const { container } = render(<Avatar initials="AB" />);
    expect(avatar(container).textContent).toBe('AB');
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows the image when there is a source', () => {
    const { container } = render(<Avatar initials="AB" src="/a.jpg" />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/a.jpg');
  });

  it('falls back to the initials when the image cannot load', () => {
    const { container } = render(<Avatar initials="AB" src="/broken.jpg" />);
    const image = container.querySelector('img');
    if (!image) {
      throw new Error('Missing image');
    }
    fireEvent.error(image);
    expect(container.querySelector('img')).toBeNull();
    expect(avatar(container).textContent).toBe('AB');
  });

  it('tries a new source after a failed one', () => {
    const { container, rerender } = render(
      <Avatar initials="AB" src="/broken.jpg" />,
    );
    const image = container.querySelector('img');
    if (image) {
      fireEvent.error(image);
    }
    rerender(<Avatar initials="AB" src="/fresh.jpg" />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/fresh.jpg',
    );
  });

  it('covers the avatar with a spinner while busy', () => {
    const { container } = render(<Avatar initials="AB" busy />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});

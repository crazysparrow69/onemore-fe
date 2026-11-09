import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '@/shared/ui/button';

describe('Button', () => {
  it('renders an enabled role and a disabled 44px target', () => {
    const { rerender } = render(<Button>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeTruthy();
    expect(button.className).toContain('min-h-11');

    rerender(<Button disabled>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty(
      'disabled',
      true,
    );
  });
});

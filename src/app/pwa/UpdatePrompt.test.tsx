import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sw = vi.hoisted(() => ({
  needRefresh: false,
  updateServiceWorker: vi.fn(() => Promise.resolve()),
}));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => {
    const [needRefresh, setNeedRefresh] = useState(sw.needRefresh);

    return {
      needRefresh: [needRefresh, setNeedRefresh],
      offlineReady: [false, () => undefined],
      updateServiceWorker: sw.updateServiceWorker,
    };
  },
}));

import { UpdatePrompt } from '@/app/pwa/UpdatePrompt';

describe('UpdatePrompt', () => {
  beforeEach(() => {
    sw.needRefresh = false;
    sw.updateServiceWorker.mockClear();
  });

  it('renders nothing when no update is waiting', () => {
    const { container } = render(<UpdatePrompt />);

    expect(container.textContent).toBe('');
  });

  it('reloads on request and hides when postponed', () => {
    sw.needRefresh = true;
    render(<UpdatePrompt />);

    expect(screen.getByText('A new version is available.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(sw.updateServiceWorker).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByText('A new version is available.')).toBeNull();
  });
});

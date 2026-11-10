import { fireEvent, render, screen, within } from '@testing-library/react';
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
    render(<UpdatePrompt />);

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('reloads on request and hides when postponed', () => {
    sw.needRefresh = true;
    render(<UpdatePrompt />);

    const status = screen.getByRole('status');
    const [reload, later] = within(status).getAllByRole('button');
    if (!reload || !later) {
      throw new Error('Missing update actions');
    }

    fireEvent.click(reload);
    expect(sw.updateServiceWorker).toHaveBeenCalledWith(true);

    fireEvent.click(later);
    expect(screen.queryByRole('status')).toBeNull();
  });
});

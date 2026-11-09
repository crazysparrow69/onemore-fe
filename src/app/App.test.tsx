import { createMemoryHistory } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/app/App';
import { createAppRouter } from '@/app/router';

describe('App', () => {
  it('renders the app heading', async () => {
    const history = createMemoryHistory({ initialEntries: ['/'] });
    const appRouter = createAppRouter(history);
    await appRouter.load();
    render(<App router={appRouter} />);

    expect(
      await screen.findByRole('heading', { name: 'onemore' }),
    ).toBeTruthy();
  });
});

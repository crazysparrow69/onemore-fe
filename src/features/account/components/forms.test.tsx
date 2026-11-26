import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileForm } from '@/features/account/components/ProfileForm';
import { SettingsForm } from '@/features/account/components/SettingsForm';
import {
  patchCurrentUser,
  type CurrentUser,
} from '@/entities/user/api/current-user.service';
import { ApiError } from '@/shared/api/error';

vi.mock('@/entities/user/api/current-user.service', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/entities/user/api/current-user.service')
  >()),
  patchCurrentUser: vi.fn(),
}));

const user: CurrentUser = {
  id: 'user-1',
  email: 'ada@example.com',
  name: 'Ada',
  nickname: null,
  role: 'user',
  language: 'uk',
  units: 'kg',
  timeZone: 'Europe/Kyiv',
  avatar: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function field(name: string): HTMLInputElement {
  const element = document.querySelector(`input[name="${name}"]`);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Missing input ${name}`);
  }
  return element;
}

function saveButton(): HTMLButtonElement {
  const element = document.querySelector('button[type="submit"]');
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error('Missing submit button');
  }
  return element;
}

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.mocked(patchCurrentUser).mockReset();
  });

  it('starts with the save button disabled and the email read-only', () => {
    renderWithClient(<ProfileForm user={user} />);

    expect(saveButton().disabled).toBe(true);
    expect(field('name').value).toBe('Ada');
    expect(screen.getByDisplayValue('ada@example.com')).toHaveProperty(
      'readOnly',
      true,
    );
  });

  it('sends only the changed field, lower-cased', async () => {
    vi.mocked(patchCurrentUser).mockResolvedValue({
      ...user,
      nickname: 'ada_l',
    });
    renderWithClient(<ProfileForm user={user} />);

    fireEvent.change(field('nickname'), { target: { value: 'Ada_L' } });
    fireEvent.click(saveButton());

    await waitFor(() => {
      expect(patchCurrentUser).toHaveBeenCalledTimes(1);
    });
    expect(vi.mocked(patchCurrentUser).mock.calls[0]?.[0]).toEqual({
      nickname: 'ada_l',
    });
  });

  it('clears the name with an empty value', async () => {
    vi.mocked(patchCurrentUser).mockResolvedValue({ ...user, name: null });
    renderWithClient(<ProfileForm user={user} />);

    fireEvent.change(field('name'), { target: { value: '' } });
    fireEvent.click(saveButton());

    await waitFor(() => {
      expect(patchCurrentUser).toHaveBeenCalled();
    });
    expect(vi.mocked(patchCurrentUser).mock.calls[0]?.[0]).toEqual({
      name: null,
    });
  });

  it('shows a validation error and does not call the API for a bad nickname', async () => {
    renderWithClient(<ProfileForm user={user} />);

    fireEvent.change(field('nickname'), { target: { value: 'a b' } });
    fireEvent.click(saveButton());

    await waitFor(() => {
      expect(field('nickname').getAttribute('aria-invalid')).toBe('true');
    });
    expect(patchCurrentUser).not.toHaveBeenCalled();
  });

  it('shows the taken-nickname error under the field', async () => {
    vi.mocked(patchCurrentUser).mockRejectedValue(
      new ApiError(409, 'NICKNAME_TAKEN', 'Nickname is already used'),
    );
    renderWithClient(<ProfileForm user={user} />);

    fireEvent.change(field('nickname'), { target: { value: 'ada' } });
    fireEvent.click(saveButton());

    await waitFor(() => {
      expect(field('nickname').getAttribute('aria-invalid')).toBe('true');
    });
    expect(screen.getByText('Цей нікнейм уже зайнятий')).toBeTruthy();
  });
});

describe('SettingsForm', () => {
  beforeEach(() => {
    vi.mocked(patchCurrentUser).mockReset();
  });

  it('shows the saved values and keeps save disabled until something changes', () => {
    renderWithClient(<SettingsForm user={user} />);

    expect(saveButton().disabled).toBe(true);
    const kg = screen.getByRole('radio', { name: 'кг' });
    expect(kg.getAttribute('aria-checked')).toBe('true');
  });

  it('saves only the changed units', async () => {
    vi.mocked(patchCurrentUser).mockResolvedValue({ ...user, units: 'lb' });
    renderWithClient(<SettingsForm user={user} />);

    fireEvent.click(screen.getByRole('radio', { name: 'lb' }));
    fireEvent.click(saveButton());

    await waitFor(() => {
      expect(patchCurrentUser).toHaveBeenCalledTimes(1);
    });
    expect(vi.mocked(patchCurrentUser).mock.calls[0]?.[0]).toEqual({
      units: 'lb',
    });
  });

  it('offers the saved time zone and both languages', () => {
    renderWithClient(
      <SettingsForm user={{ ...user, timeZone: 'Europe/Kyiv' }} />,
    );

    expect(screen.getByRole('option', { name: 'Europe/Kyiv' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'English' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Українська' })).toBeTruthy();
  });
});

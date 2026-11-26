import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory } from '@tanstack/react-router';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import { createAppRouter } from '@/app/router';
import {
  completeUpload,
  createUpload,
  sendToStorage,
} from '@/entities/media/api/media.service';
import { getSession } from '@/entities/user/api/auth.service';
import {
  fetchCurrentUser,
  patchCurrentUser,
  type CurrentUser,
} from '@/entities/user/api/current-user.service';
import {
  createExercise,
  fetchExerciseDictionaries,
  fetchExercises,
  type ExerciseDetails,
  type ExerciseDictionaries,
} from '@/entities/exercise/api/exercises.service';
import { convertHeicToJpeg } from '@/entities/media/model/heic';
import { MediaUploadError } from '@/entities/media/model/media-error';

vi.mock('@/entities/user/api/auth.service', () => ({
  getSession: vi.fn(() => Promise.resolve({ email: 'ada@example.com' })),
  signOut: vi.fn(() => Promise.resolve()),
  signInWithEmail: vi.fn(() => Promise.resolve()),
  signUpWithEmail: vi.fn(() => Promise.resolve()),
  signInWithGoogle: vi.fn(() => Promise.resolve()),
  getAccessToken: vi.fn(() => Promise.resolve(null)),
  refreshAccessToken: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/entities/user/api/current-user.service', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/entities/user/api/current-user.service')
  >()),
  fetchCurrentUser: vi.fn(),
  patchCurrentUser: vi.fn(),
}));

vi.mock(
  '@/entities/exercise/api/exercises.service',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/entities/exercise/api/exercises.service')
    >()),
    fetchExercises: vi.fn(),
    fetchExerciseDictionaries: vi.fn(),
    createExercise: vi.fn(),
  }),
);

vi.mock('@/entities/media/api/media.service', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/entities/media/api/media.service')
  >()),
  createUpload: vi.fn(),
  completeUpload: vi.fn(),
  sendToStorage: vi.fn(),
}));

vi.mock('@/entities/media/model/heic', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/media/model/heic')>()),
  convertHeicToJpeg: vi.fn(),
}));

vi.mock('@/entities/media/model/browser-codec', () => ({
  browserCodec: {
    decode: (source: Blob) =>
      source instanceof File && /\.(heic|bin)$/.test(source.name)
        ? Promise.reject(new Error('cannot decode'))
        : Promise.resolve({
            width: 800,
            height: 600,
            release: () => undefined,
          }),
    encode: () => Promise.resolve(new Blob(['jpeg'])),
  },
}));

vi.mock('react-easy-crop', async () => {
  const { useEffect, useRef } = await import('react');
  return {
    default: function CropperMock({
      onCropComplete,
    }: {
      onCropComplete: (visible: unknown, pixels: unknown) => void;
    }) {
      const report = useRef(onCropComplete);
      useEffect(() => {
        report.current({}, { x: 100, y: 0, width: 600, height: 600 });
      }, []);
      return null;
    },
  };
});

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

vi.mock('@/shared/lib/toast', () => ({ toast: toastSpies }));

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

const dictionaries: ExerciseDictionaries = {
  locale: 'uk',
  muscleGroups: [
    {
      id: 'chest',
      label: 'Груди',
      muscles: [{ id: 'chest', label: 'Груди', primaryOnly: false }],
    },
  ],
  equipment: [{ id: 'machine', label: 'Тренажер' }],
  types: [
    {
      id: 'weight_reps',
      label: 'Вага і повтори',
      example: 'Жим лежачи',
      fields: [],
    },
  ],
  categories: [],
  levels: [],
  forces: [],
  mechanics: [],
};

const created: ExerciseDetails = {
  id: 'own-1',
  name: 'Жим у хамері',
  type: 'weight_reps',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: 'machine',
  image: 'onemore-dev/u/user-1/exercise_photo/m1',
  custom: true,
  imageKeys: ['onemore-dev/u/user-1/exercise_photo/m1'],
  photoId: 'm1',
  category: null,
  force: null,
  mechanic: null,
  level: null,
  instructions: [],
  typeLocked: false,
};

async function renderAt(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const router = createAppRouter(history, client);
  await router.load();
  render(<App router={router} queryClient={client} />);
  return history;
}

function fileInput(): HTMLInputElement {
  const element = document.querySelector('input[type="file"]');
  if (!(element instanceof HTMLInputElement)) {
    throw new Error('Missing file input');
  }
  return element;
}

function pickFile(file = new File(['raw'], 'me.jpg', { type: 'image/jpeg' })) {
  fireEvent.change(fileInput(), { target: { files: [file] } });
}

function mockUploadSuccess(purpose: 'avatar' | 'exercise_photo') {
  vi.mocked(createUpload).mockResolvedValue({
    id: 'm1',
    purpose,
    upload: { url: 'https://api.cloudinary.com/x', fields: {} },
  });
  vi.mocked(sendToStorage).mockResolvedValue({ version: 5, signature: 'sig' });
  vi.mocked(completeUpload).mockResolvedValue({
    id: 'm1',
    purpose,
    key: `onemore-dev/u/user-1/${purpose}/m1`,
  });
}

describe('media flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'demo-cloud');
    vi.mocked(getSession).mockResolvedValue({ email: 'ada@example.com' });
    vi.mocked(fetchCurrentUser).mockResolvedValue(user);
    vi.mocked(fetchExerciseDictionaries).mockResolvedValue(dictionaries);
    vi.mocked(fetchExercises).mockResolvedValue({
      items: [],
      total: 0,
      nextOffset: null,
    });
  });

  describe('avatar on the profile edit page', () => {
    it('crops, uploads, attaches the file to the profile and shows the new photo', async () => {
      mockUploadSuccess('avatar');
      vi.mocked(patchCurrentUser).mockResolvedValue({
        ...user,
        avatar: 'onemore-dev/u/user-1/avatar/m1',
      });
      await renderAt('/profile/edit');

      fireEvent.click(
        await screen.findByRole('button', { name: 'Змінити фото' }),
      );
      pickFile();
      const cropper = await screen.findByRole('dialog');
      fireEvent.click(within(cropper).getByRole('button', { name: 'Готово' }));

      await waitFor(() => {
        expect(patchCurrentUser).toHaveBeenCalledWith({ avatarId: 'm1' });
      });
      expect(createUpload).toHaveBeenCalledWith('avatar');
      expect(completeUpload).toHaveBeenCalledWith('m1', {
        version: 5,
        signature: 'sig',
      });
      await waitFor(() => {
        expect(toastSpies.success).toHaveBeenCalledWith(
          'Фото профілю оновлено',
        );
      });
      await waitFor(() => {
        expect(
          document.querySelector('[data-slot="avatar"] img'),
        ).not.toBeNull();
      });
      expect(
        document.querySelector('[data-slot="avatar"] img')?.getAttribute('src'),
      ).toBe(
        'https://res.cloudinary.com/demo-cloud/image/upload/t_avatar_lg/onemore-dev/u/user-1/avatar/m1',
      );
    });

    it('converts a HEIC photo the browser cannot show before cropping', async () => {
      vi.mocked(convertHeicToJpeg).mockResolvedValue(new Blob(['jpeg']));
      await renderAt('/profile/edit');

      fireEvent.click(
        await screen.findByRole('button', { name: 'Змінити фото' }),
      );
      pickFile(new File(['raw'], 'IMG_1.heic', { type: 'image/heic' }));

      expect(await screen.findByRole('dialog')).toBeTruthy();
      expect(convertHeicToJpeg).toHaveBeenCalledOnce();
      expect(toastSpies.error).not.toHaveBeenCalled();
    });

    it('rejects a file it cannot read without opening the cropper', async () => {
      await renderAt('/profile/edit');

      fireEvent.click(
        await screen.findByRole('button', { name: 'Змінити фото' }),
      );
      pickFile(new File(['raw'], 'notes.bin', { type: '' }));

      await waitFor(() => {
        expect(toastSpies.error).toHaveBeenCalledWith(
          'Не вдалося відкрити цей файл. Виберіть фото у форматі JPEG, PNG, WebP або HEIC.',
        );
      });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(convertHeicToJpeg).not.toHaveBeenCalled();
    });

    it('does not upload anything when the crop is cancelled', async () => {
      await renderAt('/profile/edit');

      fireEvent.click(
        await screen.findByRole('button', { name: 'Змінити фото' }),
      );
      pickFile();
      const cropper = await screen.findByRole('dialog');
      fireEvent.click(
        within(cropper).getByRole('button', { name: 'Скасувати' }),
      );

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
      expect(createUpload).not.toHaveBeenCalled();
      expect(patchCurrentUser).not.toHaveBeenCalled();
    });

    it('tells the user when the upload fails and leaves the profile alone', async () => {
      vi.mocked(createUpload).mockResolvedValue({
        id: 'm1',
        purpose: 'avatar',
        upload: { url: 'https://api.cloudinary.com/x', fields: {} },
      });
      vi.mocked(sendToStorage).mockRejectedValue(
        new MediaUploadError('failed'),
      );
      await renderAt('/profile/edit');

      fireEvent.click(
        await screen.findByRole('button', { name: 'Змінити фото' }),
      );
      pickFile();
      const cropper = await screen.findByRole('dialog');
      fireEvent.click(within(cropper).getByRole('button', { name: 'Готово' }));

      await waitFor(() => {
        expect(toastSpies.error).toHaveBeenCalledWith(
          'Не вдалося завантажити фото. Спробуйте ще раз.',
        );
      });
      expect(patchCurrentUser).not.toHaveBeenCalled();
    });

    it('removes the photo after a confirmation', async () => {
      vi.mocked(fetchCurrentUser).mockResolvedValue({
        ...user,
        avatar: 'onemore-dev/u/user-1/avatar/m1',
      });
      vi.mocked(patchCurrentUser).mockResolvedValue(user);
      await renderAt('/profile/edit');

      fireEvent.click(
        await screen.findByRole('button', { name: 'Змінити фото' }),
      );
      const actions = await screen.findByRole('dialog');
      fireEvent.click(
        within(actions).getByRole('button', { name: 'Видалити фото' }),
      );
      const confirm = await screen.findByRole('dialog', {
        name: 'Видалити фото профілю?',
      });
      fireEvent.click(
        within(confirm).getByRole('button', { name: 'Видалити фото' }),
      );

      await waitFor(() => {
        expect(patchCurrentUser).toHaveBeenCalledWith({ avatarId: null });
      });
    });
  });

  describe('photo in the exercise form', () => {
    async function fillRequired() {
      fireEvent.change(await screen.findByLabelText('Назва'), {
        target: { value: 'Жим у хамері' },
      });
      for (const [row, option] of [
        [/Тип вправи/, /Вага і повтори/],
        [/Основний м'яз/, /Груди/],
      ] as const) {
        fireEvent.click(await screen.findByRole('button', { name: row }));
        const sheet = await screen.findByRole('dialog');
        fireEvent.click(within(sheet).getByRole('button', { name: option }));
        await waitFor(() => {
          expect(screen.queryByRole('dialog')).toBeNull();
        });
      }
    }

    it('uploads the photo and sends its id with the exercise', async () => {
      mockUploadSuccess('exercise_photo');
      vi.mocked(createExercise).mockResolvedValue(created);
      await renderAt('/exercises/new');

      await fillRequired();
      pickFile();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Замінити' })).toBeTruthy();
      });
      fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }));

      await waitFor(() => {
        expect(createExercise).toHaveBeenCalledWith(
          expect.objectContaining({ photoId: 'm1', name: 'Жим у хамері' }),
        );
      });
      expect(createUpload).toHaveBeenCalledWith('exercise_photo');
    });

    it('sends no photo when none was added, and removes a chosen one', async () => {
      mockUploadSuccess('exercise_photo');
      vi.mocked(createExercise).mockResolvedValue(created);
      await renderAt('/exercises/new');

      await fillRequired();
      pickFile();
      fireEvent.click(await screen.findByRole('button', { name: 'Видалити' }));
      fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }));

      await waitFor(() => {
        expect(createExercise).toHaveBeenCalledWith(
          expect.objectContaining({ photoId: null }),
        );
      });
    });

    it('keeps Save disabled while the photo is uploading', async () => {
      vi.mocked(createUpload).mockResolvedValue({
        id: 'm1',
        purpose: 'exercise_photo',
        upload: { url: 'https://api.cloudinary.com/x', fields: {} },
      });
      let finish: (value: {
        version: number;
        signature: string;
      }) => void = () => undefined;
      vi.mocked(sendToStorage).mockReturnValue(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      vi.mocked(completeUpload).mockResolvedValue({
        id: 'm1',
        purpose: 'exercise_photo',
        key: 'onemore-dev/u/user-1/exercise_photo/m1',
      });
      await renderAt('/exercises/new');

      await fillRequired();
      pickFile();
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeTruthy();
      });
      expect(
        screen
          .getByRole('button', { name: 'Зберегти' })
          .hasAttribute('disabled'),
      ).toBe(true);

      finish({ version: 5, signature: 'sig' });
      await waitFor(() => {
        expect(
          screen
            .getByRole('button', { name: 'Зберегти' })
            .hasAttribute('disabled'),
        ).toBe(false);
      });
    });

    it('shows an error and keeps the form usable when the upload fails', async () => {
      vi.mocked(createUpload).mockRejectedValue(new MediaUploadError('failed'));
      await renderAt('/exercises/new');

      await fillRequired();
      pickFile();

      await waitFor(() => {
        expect(toastSpies.error).toHaveBeenCalledWith(
          'Не вдалося завантажити фото. Спробуйте ще раз.',
        );
      });
      expect(
        screen
          .getByRole('button', { name: 'Зберегти' })
          .hasAttribute('disabled'),
      ).toBe(false);
    });
  });
});

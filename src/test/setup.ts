import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@/shared/i18n';

afterEach(() => {
  cleanup();
});

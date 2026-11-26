import { useCallback, useState } from 'react';
import { prepareImage } from '@/entities/media/model/prepare-image';

export interface ImagePreparation {
  preparing: boolean;
  prepare: (file: File) => Promise<File>;
}

export function useImagePreparation(): ImagePreparation {
  const [preparing, setPreparing] = useState(false);

  const prepare = useCallback(async (file: File) => {
    setPreparing(true);
    try {
      return await prepareImage(file);
    } finally {
      setPreparing(false);
    }
  }, []);

  return { preparing, prepare };
}

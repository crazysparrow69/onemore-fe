import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ExercisePlaceholder } from '@/entities/exercise/components/ExercisePlaceholder';
import { FilePicker, type FilePickerHandle } from '@/shared/ui/file-picker';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

function PhotoField({
  url,
  seed,
  uploading,
  progress,
  onPick,
  onRemove,
}: {
  url: string | null;
  seed: string;
  uploading: boolean;
  progress: number;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const picker = useRef<FilePickerHandle>(null);

  return (
    <div className="flex flex-col gap-2">
      <Text size="sm" tone="muted">
        {t('media.photo.title')}
      </Text>
      <FilePicker ref={picker} onPick={onPick} />
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white">
        {url ? (
          <img
            src={url}
            alt={t('media.photo.alt')}
            crossOrigin="anonymous"
            className="size-full object-contain"
          />
        ) : (
          <ExercisePlaceholder
            seed={seed}
            className="size-full"
            iconClassName="size-12"
          />
        )}
        {uploading ? (
          <span
            role="status"
            className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white"
          >
            {progress > 0 ? (
              <>{Math.round(progress * 100)}%</>
            ) : (
              <Loader2 className="size-6 animate-spin" aria-hidden />
            )}
          </span>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={() => {
            picker.current?.open();
          }}
        >
          <ImagePlus className="size-4" aria-hidden />
          {url ? t('media.photo.replace') : t('media.photo.add')}
        </Button>
        {url ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            className="text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="size-4" aria-hidden />
            {t('media.photo.remove')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { PhotoField };

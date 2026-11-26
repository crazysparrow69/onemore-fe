import { useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { SheetActions } from '@/shared/ui/sheet-actions';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function ImageCropper({
  image,
  title,
  zoomLabel,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  image: string | null;
  title: string;
  zoomLabel: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (area: Area) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [area, setArea] = useState<Area | null>(null);

  return (
    <BottomSheet
      open={image !== null}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      title={title}
      footer={
        <SheetActions
          secondary={{ label: cancelLabel, onClick: onCancel }}
          primary={{
            label: confirmLabel,
            disabled: area === null,
            onClick: () => {
              if (area) {
                onConfirm(area);
              }
            },
          }}
        />
      }
    >
      {image ? (
        <div className="flex h-full flex-col gap-4">
          <div className="relative min-h-64 flex-1 overflow-hidden rounded-xl bg-black">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_visible, pixels) => {
                setArea(pixels);
              }}
            />
          </div>
          <input
            type="range"
            aria-label={zoomLabel}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            className="w-full accent-primary"
            onChange={(event) => {
              setZoom(Number(event.target.value));
            }}
          />
        </div>
      ) : null}
    </BottomSheet>
  );
}

export { ImageCropper };

import { Anchor, Ellipsis, LayoutGrid, PersonStanding } from 'lucide-react';
import { type ReactNode } from 'react';
import { filterImage } from '@/features/exercises/model/filter-images';

const ICONS: Readonly<Record<string, ReactNode>> = {
  all: <LayoutGrid className="size-6" aria-hidden />,
  suspension: <Anchor className="size-6" aria-hidden />,
  full_body: <PersonStanding className="size-6" aria-hidden />,
};

const FALLBACK_ICON = <Ellipsis className="size-6" aria-hidden />;

function FilterThumb({ id }: { id: string }) {
  const image = filterImage(id);

  return (
    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-black">
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        (ICONS[id] ?? FALLBACK_ICON)
      )}
    </span>
  );
}

export { FilterThumb };

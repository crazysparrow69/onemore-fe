import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/shared/lib/utils';

function Avatar({
  initials,
  src,
  busy = false,
  size = 'md',
  className,
}: {
  initials: string;
  src?: string | null;
  busy?: boolean;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = src != null && src.length > 0 && failed !== src;

  return (
    <span
      aria-hidden
      data-slot="avatar"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold text-secondary-foreground select-none',
        size === 'lg' ? 'size-20 text-2xl' : 'size-10 text-base',
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          crossOrigin="anonymous"
          className="size-full object-cover"
          onError={() => {
            setFailed(src);
          }}
        />
      ) : (
        initials
      )}
      {busy ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          <LoaderCircle className="size-6 animate-spin" aria-hidden />
        </span>
      ) : null}
    </span>
  );
}

export { Avatar };

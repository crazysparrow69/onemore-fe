import { useState } from 'react';

export function useSheet<Name extends string>() {
  const [current, setCurrent] = useState<Name | null>(null);

  return {
    current,
    show: (name: Name) => {
      setCurrent(name);
    },
    close: () => {
      setCurrent(null);
    },
    bind: (name: Name) => ({
      open: current === name,
      onOpenChange: (open: boolean) => {
        setCurrent(open ? name : null);
      },
    }),
  };
}

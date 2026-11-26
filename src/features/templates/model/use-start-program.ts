import { useState } from 'react';
import type { Template } from '@/features/templates/api/templates.service';
import { useStartTemplate } from '@/features/templates/model/use-launch';

export function useStartProgram() {
  const start = useStartTemplate();
  const [pending, setPending] = useState<Template | null>(null);

  return {
    ready: start.ready,
    begin: (template: Template) => {
      if (start.hasDraft) {
        setPending(template);
      } else {
        start.launch(template);
      }
    },
    sheet: {
      pending,
      onClose: () => {
        setPending(null);
      },
      onReplace: () => {
        if (pending) {
          start.launch(pending);
        }
        setPending(null);
      },
    },
  };
}

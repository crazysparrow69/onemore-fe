import { Toaster as SonnerToaster } from 'sonner';

function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: 'bg-card text-foreground border-border',
          success: 'bg-card text-foreground',
          error: 'bg-card text-destructive',
          info: 'bg-card text-foreground',
        },
      }}
    />
  );
}

export { Toaster };

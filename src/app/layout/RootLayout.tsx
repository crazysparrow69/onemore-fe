import { Outlet } from '@tanstack/react-router';
import { UpdatePrompt } from '@/app/pwa/UpdatePrompt';
import { Toaster } from '@/shared/ui/toaster';

export function RootLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <Outlet />
      <UpdatePrompt />
      <Toaster />
    </div>
  );
}

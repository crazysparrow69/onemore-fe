import { Outlet } from '@tanstack/react-router';
import { UpdatePrompt } from '@/app/pwa/UpdatePrompt';

export function RootLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <Outlet />
      <UpdatePrompt />
    </div>
  );
}

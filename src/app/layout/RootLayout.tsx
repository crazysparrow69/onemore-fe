import { Outlet } from '@tanstack/react-router';
import { TabBar } from '@/app/layout/TabBar';
import { UpdatePrompt } from '@/app/pwa/UpdatePrompt';
import { RestEffects } from '@/features/workouts/components/RestEffects';
import { ActiveWorkoutBar } from '@/features/workouts/components/ActiveWorkoutBar';
import { Toaster } from '@/shared/ui/toaster';

export function RootLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <Outlet />
      <div className="pointer-events-none sticky bottom-0 z-30 flex flex-col gap-2 bg-linear-to-t from-background/80 via-background/30 to-transparent px-4 pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] empty:hidden">
        <ActiveWorkoutBar />
        <TabBar />
      </div>
      <RestEffects />
      <UpdatePrompt />
      <Toaster />
    </div>
  );
}

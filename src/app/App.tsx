import { RouterProvider } from '@tanstack/react-router';
import { router, type AppRouter } from '@/app/router';

export function App({ router: appRouter = router }: { router?: AppRouter }) {
  return <RouterProvider router={appRouter} />;
}

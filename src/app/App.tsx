import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { queryClient, router, type AppRouter } from '@/app/router';

export function App({
  router: appRouter = router,
  queryClient: client = queryClient,
}: {
  router?: AppRouter;
  queryClient?: QueryClient;
}) {
  return (
    <QueryClientProvider client={client}>
      <RouterProvider router={appRouter} />
    </QueryClientProvider>
  );
}

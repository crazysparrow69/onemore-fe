import { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  type RouterHistory,
} from '@tanstack/react-router';
import { RootLayout } from '@/app/layout/RootLayout';
import { HomePage } from '@/app/routes/HomePage';
import { NotFoundPage } from '@/app/routes/NotFoundPage';
import { PendingScreen } from '@/app/routes/PendingScreen';
import { RouteErrorPage } from '@/app/routes/RouteErrorPage';
import { completeSocialSignIn } from '@/features/auth/model/callback';
import { requireGuest, requireUser } from '@/features/auth/model/guards';

export interface RouterContext {
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteErrorPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => requireUser(),
  component: HomePage,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sign-in',
  beforeLoad: () => requireGuest(),
  component: lazyRouteComponent(() => import('@/features/auth'), 'SignInPage'),
});

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sign-up',
  beforeLoad: () => requireGuest(),
  component: lazyRouteComponent(() => import('@/features/auth'), 'SignUpPage'),
});

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  loader: ({ context }) => completeSocialSignIn(context.queryClient),
  component: PendingScreen,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  signInRoute,
  signUpRoute,
  callbackRoute,
]);

export function createAppRouter(
  history?: RouterHistory,
  queryClient: QueryClient = new QueryClient(),
) {
  return createRouter({
    routeTree,
    history,
    context: { queryClient },
    defaultPendingComponent: PendingScreen,
    defaultPreload: 'intent',
  });
}

export const queryClient = new QueryClient();
export const router = createAppRouter(undefined, queryClient);

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

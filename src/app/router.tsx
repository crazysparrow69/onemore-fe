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
import {
  validateCatalogSearch,
  validateNewExerciseSearch,
} from '@/features/exercises/model/catalog-search';
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

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: () => requireUser(),
  component: lazyRouteComponent(
    () => import('@/features/account'),
    'ProfilePage',
  ),
});

const profileEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/edit',
  beforeLoad: () => requireUser(),
  component: lazyRouteComponent(
    () => import('@/features/account'),
    'ProfileEditPage',
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: () => requireUser(),
  component: lazyRouteComponent(
    () => import('@/features/account'),
    'SettingsPage',
  ),
});

const exercisesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exercises',
  validateSearch: validateCatalogSearch,
  beforeLoad: () => requireUser(),
  component: lazyRouteComponent(
    () => import('@/features/exercises'),
    'ExerciseListPage',
  ),
});

const exerciseNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exercises/new',
  validateSearch: validateNewExerciseSearch,
  beforeLoad: () => requireUser(),
  component: lazyRouteComponent(
    () => import('@/features/exercises'),
    'ExerciseCreatePage',
  ),
});

const exerciseEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exercises/$exerciseId/edit',
  beforeLoad: () => requireUser(),
  component: lazyRouteComponent(
    () => import('@/features/exercises'),
    'ExerciseEditPage',
  ),
});

const exerciseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exercises/$exerciseId',
  beforeLoad: () => requireUser(),
  component: lazyRouteComponent(
    () => import('@/features/exercises'),
    'ExercisePage',
  ),
});

const workoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workout',
  beforeLoad: () => requireUser(),
  component: lazyRouteComponent(
    () => import('@/features/workouts'),
    'ActiveWorkoutPage',
  ),
});

const workoutAddRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workout/add',
  validateSearch: validateCatalogSearch,
  beforeLoad: () => requireUser(),
  component: lazyRouteComponent(
    () => import('@/features/workouts'),
    'ExercisePickerPage',
  ),
});

const workoutFinishRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workout/finish',
  beforeLoad: () => requireUser(),
  component: lazyRouteComponent(
    () => import('@/features/workouts'),
    'FinishWorkoutPage',
  ),
});

const trainingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/training',
  beforeLoad: () => requireUser(),
  component: lazyRouteComponent(
    () => import('@/features/workouts'),
    'TrainingPage',
  ),
});

const workoutDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workouts/$workoutId',
  beforeLoad: () => requireUser(),
  component: lazyRouteComponent(
    () => import('@/features/workouts'),
    'WorkoutDetailsPage',
  ),
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
  trainingRoute,
  profileRoute,
  profileEditRoute,
  settingsRoute,
  exercisesRoute,
  exerciseNewRoute,
  exerciseEditRoute,
  exerciseRoute,
  workoutRoute,
  workoutAddRoute,
  workoutFinishRoute,
  workoutDetailsRoute,
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
    scrollRestoration: true,
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

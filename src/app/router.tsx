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
} from '@/entities/exercise/model/catalog-search';
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

const authed = {
  getParentRoute: () => rootRoute,
  beforeLoad: () => requireUser(),
};

const guest = {
  getParentRoute: () => rootRoute,
  beforeLoad: () => requireGuest(),
};

const indexRoute = createRoute({
  ...authed,
  path: '/',
  component: HomePage,
});

const profileRoute = createRoute({
  ...authed,
  path: '/profile',
  component: lazyRouteComponent(
    () => import('@/features/account'),
    'ProfilePage',
  ),
});

const profileEditRoute = createRoute({
  ...authed,
  path: '/profile/edit',
  component: lazyRouteComponent(
    () => import('@/features/account'),
    'ProfileEditPage',
  ),
});

const settingsRoute = createRoute({
  ...authed,
  path: '/settings',
  component: lazyRouteComponent(
    () => import('@/features/account'),
    'SettingsPage',
  ),
});

const exercisesRoute = createRoute({
  ...authed,
  path: '/exercises',
  validateSearch: validateCatalogSearch,
  component: lazyRouteComponent(
    () => import('@/features/exercises'),
    'ExerciseListPage',
  ),
});

const exerciseNewRoute = createRoute({
  ...authed,
  path: '/exercises/new',
  validateSearch: validateNewExerciseSearch,
  component: lazyRouteComponent(
    () => import('@/features/exercises'),
    'ExerciseCreatePage',
  ),
});

const exerciseEditRoute = createRoute({
  ...authed,
  path: '/exercises/$exerciseId/edit',
  component: lazyRouteComponent(
    () => import('@/features/exercises'),
    'ExerciseEditPage',
  ),
});

const exerciseRoute = createRoute({
  ...authed,
  path: '/exercises/$exerciseId',
  component: lazyRouteComponent(
    () => import('@/features/exercises'),
    'ExercisePage',
  ),
});

const workoutRoute = createRoute({
  ...authed,
  path: '/workout',
  component: lazyRouteComponent(
    () => import('@/features/workouts'),
    'ActiveWorkoutPage',
  ),
});

const workoutAddRoute = createRoute({
  ...authed,
  path: '/workout/add',
  validateSearch: validateCatalogSearch,
  component: lazyRouteComponent(
    () => import('@/features/workouts'),
    'ExercisePickerPage',
  ),
});

const workoutFinishRoute = createRoute({
  ...authed,
  path: '/workout/finish',
  component: lazyRouteComponent(
    () => import('@/features/workouts'),
    'FinishWorkoutPage',
  ),
});

const trainingRoute = createRoute({
  ...authed,
  path: '/training',
  component: lazyRouteComponent(
    () => import('@/features/workouts'),
    'TrainingPage',
  ),
});

const programsNewRoute = createRoute({
  ...authed,
  path: '/programs/new',
  component: lazyRouteComponent(
    () => import('@/features/templates'),
    'TemplateNewPage',
  ),
});

const programsAddRoute = createRoute({
  ...authed,
  path: '/programs/add',
  validateSearch: validateCatalogSearch,
  component: lazyRouteComponent(
    () => import('@/features/templates'),
    'TemplateExercisePickerPage',
  ),
});

const programEditRoute = createRoute({
  ...authed,
  path: '/programs/$programId/edit',
  component: lazyRouteComponent(
    () => import('@/features/templates'),
    'TemplateEditPage',
  ),
});

const programRoute = createRoute({
  ...authed,
  path: '/programs/$programId',
  component: lazyRouteComponent(
    () => import('@/features/templates'),
    'TemplatePage',
  ),
});

const workoutDetailsRoute = createRoute({
  ...authed,
  path: '/workouts/$workoutId',
  component: lazyRouteComponent(
    () => import('@/features/workouts'),
    'WorkoutDetailsPage',
  ),
});

const signInRoute = createRoute({
  ...guest,
  path: '/sign-in',
  component: lazyRouteComponent(() => import('@/features/auth'), 'SignInPage'),
});

const signUpRoute = createRoute({
  ...guest,
  path: '/sign-up',
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
  programsNewRoute,
  programsAddRoute,
  programEditRoute,
  programRoute,
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

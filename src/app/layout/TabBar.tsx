import { Link, useRouterState } from '@tanstack/react-router';
import { Dumbbell, House, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

const TABS = [
  { to: '/', label: 'nav.home', icon: House, routes: ['/'] },
  {
    to: '/training',
    label: 'nav.training',
    icon: Dumbbell,
    routes: ['/training', '/programs/$programId'],
  },
  {
    to: '/profile',
    label: 'nav.profile',
    icon: UserRound,
    routes: [
      '/profile',
      '/profile/edit',
      '/settings',
      '/body',
      '/body/setup',
      '/body/edit',
      '/body/goal',
      '/weight',
      '/exercises',
      '/exercises/$exerciseId',
      '/workouts/$workoutId',
    ],
  },
] as const;

function activeTab(routeId: string | undefined): number {
  return TABS.findIndex((tab) =>
    (tab.routes as readonly string[]).includes(routeId ?? ''),
  );
}

function TabBar() {
  const { t } = useTranslation();
  const routeId = useRouterState({
    select: (state) => state.matches.at(-1)?.routeId,
  });
  const active = activeTab(routeId);

  if (active === -1) {
    return null;
  }

  return (
    <nav
      aria-label={t('nav.label')}
      className="glass pointer-events-auto grid h-16 grid-cols-3 rounded-full p-1"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-white/12 shadow-[inset_0_1px_0_rgb(255_255_255/0.18),inset_0_-1px_0_rgb(255_255_255/0.06)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(${String(active * 100)}%)` }}
      />
      {TABS.map((tab, index) => {
        const Icon = tab.icon;
        const selected = index === active;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: true }}
            aria-current={selected ? 'page' : undefined}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95',
              selected ? 'text-primary' : 'text-foreground/90',
            )}
          >
            <Icon
              className="size-6"
              strokeWidth={selected ? 2.25 : 1.75}
              aria-hidden
            />
            <span>{t(tab.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export { TabBar };

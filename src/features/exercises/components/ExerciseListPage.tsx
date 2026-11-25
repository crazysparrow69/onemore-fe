import { getRouteApi, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useExerciseDictionaries,
  useExerciseLabels,
  useExerciseList,
} from '@/features/exercises/api/use-exercises';
import { ExerciseRow } from '@/features/exercises/components/ExerciseRow';
import {
  FilterSheet,
  type FilterField,
  type FilterSection,
} from '@/features/exercises/components/FilterSheet';
import {
  filtersFromSearch,
  hasFilters,
  joinIds,
} from '@/features/exercises/model/catalog-search';
import { useDebouncedCallback } from '@/shared/lib/use-debounced-callback';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { SearchField } from '@/shared/ui/search-field';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

const route = getRouteApi('/exercises');
const SEARCH_DELAY_MS = 300;
const SKELETON_ROWS = 8;

function LoadMore({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [onVisible]);

  return <div ref={ref} className="h-1" aria-hidden />;
}

function RowsSkeleton() {
  return (
    <ul aria-hidden>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <li key={index} className="flex items-center gap-3 py-2.5">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ExerciseListPage() {
  const { t } = useTranslation();
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const filters = filtersFromSearch(search);
  const [text, setText] = useState(filters.q);
  const [sheet, setSheet] = useState<FilterField | null>(null);
  const dictionaries = useExerciseDictionaries();
  const labels = useExerciseLabels();
  const list = useExerciseList(filters);

  const applyQuery = useDebouncedCallback((value: string) => {
    const q = value.trim();
    void navigate({
      search: (previous) => ({ ...previous, q: q.length > 0 ? q : undefined }),
      replace: true,
    });
  }, SEARCH_DELAY_MS);

  function applyIds(field: FilterField, ids: string[]) {
    setSheet(null);
    void navigate({
      search: (previous) => ({ ...previous, [field]: joinIds(ids) }),
      replace: true,
    });
  }

  function reset() {
    applyQuery.cancel();
    setText('');
    void navigate({ search: {}, replace: true });
  }

  const muscleSections: FilterSection[] = (
    dictionaries.data?.muscleGroups ?? []
  ).map((group) => ({
    id: group.id,
    label: group.label,
    options: group.muscles,
  }));
  const equipmentSections: FilterSection[] = [
    {
      id: 'equipment',
      label: null,
      options: dictionaries.data?.equipment ?? [],
    },
  ];

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const total = list.data?.pages[0]?.total ?? 0;
  const filtered = hasFilters(filters);
  const hasOtherFilters =
    filters.q.length > 0 ||
    filters.muscle.length > 0 ||
    filters.equipment.length > 0;

  function filterLabel(field: FilterField): string {
    const ids = filters[field];
    const [first] = ids;
    if (first === undefined) {
      return t(
        field === 'muscle' ? 'catalog.allMuscles' : 'catalog.allEquipment',
      );
    }
    if (ids.length === 1) {
      return field === 'muscle'
        ? labels.muscle(first)
        : labels.equipment(first);
    }
    return t(
      field === 'muscle' ? 'catalog.musclesCount' : 'catalog.equipmentCount',
      { count: ids.length },
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 flex flex-col gap-3 bg-background px-4 pt-4 pb-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <Link
            to="/"
            aria-label={t('common.back')}
            className="inline-flex size-10 items-center justify-center rounded-full bg-secondary outline-none hover:bg-secondary/80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <Text as="h1" size="lg" weight="semibold" className="text-center">
            {t('catalog.title')}
          </Text>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="justify-self-end text-primary"
          >
            <Link to="/exercises/new">{t('catalog.create')}</Link>
          </Button>
        </div>
        <SearchField
          value={text}
          onValueChange={(value) => {
            setText(value);
            applyQuery.run(value);
          }}
          placeholder={t('catalog.searchPlaceholder')}
          aria-label={t('catalog.searchPlaceholder')}
          clearLabel={t('catalog.clearSearch')}
          maxLength={100}
        />
        <div className="grid grid-cols-2 gap-2">
          {(['equipment', 'muscle'] as const).map((field) => (
            <Button
              key={field}
              type="button"
              variant="secondary"
              className={cn(
                'rounded-[10px]',
                filters[field].length > 0 ? 'text-primary' : '',
              )}
              onClick={() => {
                setSheet(field);
              }}
            >
              <span className="truncate">{filterLabel(field)}</span>
            </Button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={filters.mine}
          className={cn(
            'self-start rounded-full bg-secondary px-4 py-1.5 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
            filters.mine ? 'text-primary ring-2 ring-primary' : '',
          )}
          onClick={() => {
            void navigate({
              search: (previous) => ({
                ...previous,
                mine: filters.mine ? undefined : true,
              }),
              replace: true,
            });
          }}
        >
          {t('catalog.mine')}
        </button>
      </header>

      <section className="flex flex-1 flex-col gap-1 px-4 pb-8">
        <Text as="h2" size="lg" weight="semibold" className="py-2">
          {filtered && list.data
            ? t('catalog.found', { count: total })
            : t('catalog.allExercises')}
        </Text>

        {list.isPending ? <RowsSkeleton /> : null}

        {list.isError ? (
          <div className="flex flex-col items-start gap-3 py-4">
            <Text tone="danger">{t('errors.generic.description')}</Text>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void list.refetch();
              }}
            >
              {t('common.retry')}
            </Button>
          </div>
        ) : null}

        {list.data && items.length === 0 ? (
          <div className="flex flex-col items-start gap-3 py-4">
            <Text tone="muted">
              {filters.mine && !hasOtherFilters
                ? t('catalog.emptyMine')
                : t('catalog.empty')}
            </Text>
            {filtered && !(filters.mine && !hasOtherFilters) ? (
              <Button type="button" variant="secondary" onClick={reset}>
                {t('catalog.clearFilters')}
              </Button>
            ) : null}
            <Button asChild variant="secondary">
              <Link
                to="/exercises/new"
                search={filters.q.length > 0 ? { name: filters.q } : {}}
              >
                {filters.q.length > 0
                  ? t('catalog.createNamed', { name: filters.q })
                  : t('catalog.create')}
              </Link>
            </Button>
          </div>
        ) : null}

        {items.length > 0 ? (
          <ul>
            {items.map((exercise) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                labels={labels}
              />
            ))}
          </ul>
        ) : null}

        {list.isFetchingNextPage ? <RowsSkeleton /> : null}
        {list.hasNextPage && !list.isFetchingNextPage ? (
          <LoadMore
            onVisible={() => {
              void list.fetchNextPage();
            }}
          />
        ) : null}
      </section>

      <FilterSheet
        open={sheet === 'equipment'}
        onOpenChange={(open) => {
          setSheet(open ? 'equipment' : null);
        }}
        field="equipment"
        title={t('catalog.equipmentTitle')}
        allLabel={t('catalog.allEquipment')}
        sections={equipmentSections}
        filters={filters}
        onApply={(ids) => {
          applyIds('equipment', ids);
        }}
      />
      <FilterSheet
        open={sheet === 'muscle'}
        onOpenChange={(open) => {
          setSheet(open ? 'muscle' : null);
        }}
        field="muscle"
        title={t('catalog.musclesTitle')}
        allLabel={t('catalog.allMuscles')}
        sections={muscleSections}
        filters={filters}
        onApply={(ids) => {
          applyIds('muscle', ids);
        }}
      />
    </main>
  );
}

export { ExerciseListPage };

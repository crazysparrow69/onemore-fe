import { getRouteApi, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useExerciseDictionaries,
  useExerciseLabels,
  useExerciseList,
} from '@/entities/exercise/api/use-exercises';
import { ExerciseRow } from '@/entities/exercise/components/ExerciseRow';
import {
  FilterSheet,
  type FilterField,
  type FilterSection,
} from '@/features/exercises/components/FilterSheet';
import {
  filtersFromSearch,
  hasFilters,
  joinIds,
  type CatalogSearch,
} from '@/entities/exercise/model/catalog-search';
import type { ExerciseListItem } from '@/entities/exercise/api/exercises.service';
import { useDebouncedCallback } from '@/shared/lib/use-debounced-callback';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ErrorState } from '@/shared/ui/error-state';
import { IconButton } from '@/shared/ui/icon-button';
import { LoadMore } from '@/shared/ui/load-more';
import { SearchField } from '@/shared/ui/search-field';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';
import { useSheet } from '@/shared/lib/use-sheet';

const listRoute = getRouteApi('/exercises');
const SEARCH_DELAY_MS = 300;
const SKELETON_ROWS = 8;

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

export interface ExercisePick {
  title: string;
  onBack: () => void;
  selected: ReadonlyMap<string, ExerciseListItem>;
  onToggle: (exercise: ExerciseListItem) => void;
  confirmLabel: string;
  onConfirm: () => void;
}

function ExerciseCatalog({
  search,
  onSearchChange,
  pick,
}: {
  search: CatalogSearch;
  onSearchChange: (update: (previous: CatalogSearch) => CatalogSearch) => void;
  pick?: ExercisePick;
}) {
  const { t } = useTranslation();
  const filters = filtersFromSearch(search);
  const [text, setText] = useState(filters.q);
  const sheet = useSheet<FilterField>();
  const dictionaries = useExerciseDictionaries();
  const labels = useExerciseLabels();
  const list = useExerciseList(filters);

  const applyQuery = useDebouncedCallback((value: string) => {
    const q = value.trim();
    onSearchChange((previous) => ({
      ...previous,
      q: q.length > 0 ? q : undefined,
    }));
  }, SEARCH_DELAY_MS);

  function applyIds(field: FilterField, ids: string[]) {
    sheet.close();
    onSearchChange((previous) => ({ ...previous, [field]: joinIds(ids) }));
  }

  function reset() {
    applyQuery.cancel();
    setText('');
    onSearchChange(() => ({}));
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
          {pick ? (
            <IconButton aria-label={t('common.back')} onClick={pick.onBack}>
              <ArrowLeft aria-hidden />
            </IconButton>
          ) : (
            <IconButton asChild aria-label={t('common.back')}>
              <Link to="/profile">
                <ArrowLeft aria-hidden />
              </Link>
            </IconButton>
          )}
          <Text as="h1" size="lg" weight="semibold" className="text-center">
            {pick ? pick.title : t('catalog.title')}
          </Text>
          {pick ? (
            <span />
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="justify-self-end text-primary"
            >
              <Link to="/exercises/new">{t('catalog.create')}</Link>
            </Button>
          )}
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
                sheet.show(field);
              }}
            >
              <span className="truncate">{filterLabel(field)}</span>
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="chip"
          aria-pressed={filters.mine}
          className="self-start aria-pressed:text-primary aria-pressed:ring-2 aria-pressed:ring-primary"
          onClick={() => {
            onSearchChange((previous) => ({
              ...previous,
              mine: filters.mine ? undefined : true,
            }));
          }}
        >
          {t('catalog.mine')}
        </Button>
      </header>

      <section
        className={cn(
          'flex flex-1 flex-col gap-1 px-4',
          pick ? 'pb-28' : 'pb-8',
        )}
      >
        <Text as="h2" size="lg" weight="semibold" className="py-2">
          {filtered && list.data
            ? t('catalog.found', { count: total })
            : t('catalog.allExercises')}
        </Text>

        {list.isPending ? <RowsSkeleton /> : null}

        {list.isError ? (
          <ErrorState
            className="py-4"
            onRetry={() => {
              void list.refetch();
            }}
          />
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
            {pick ? null : (
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
            )}
          </div>
        ) : null}

        {items.length > 0 ? (
          <ul>
            {items.map((exercise) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                labels={labels}
                pick={
                  pick
                    ? {
                        selected: pick.selected.has(exercise.id),
                        onToggle: () => {
                          pick.onToggle(exercise);
                        },
                      }
                    : undefined
                }
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

      {pick ? (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md bg-background px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            fullWidth
            size="lg"
            disabled={pick.selected.size === 0 || !dictionaries.data}
            onClick={pick.onConfirm}
          >
            {pick.confirmLabel}
          </Button>
        </div>
      ) : null}

      <FilterSheet
        {...sheet.bind('equipment')}
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
        {...sheet.bind('muscle')}
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

function ExerciseListPage() {
  const search = listRoute.useSearch();
  const navigate = listRoute.useNavigate();

  return (
    <ExerciseCatalog
      search={search}
      onSearchChange={(update) => {
        void navigate({
          search: (previous) => update(previous),
          replace: true,
        });
      }}
    />
  );
}

export { ExerciseCatalog, ExerciseListPage };

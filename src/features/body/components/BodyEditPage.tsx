import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useBody } from '@/entities/body/api/use-body';
import { BodyForm } from '@/features/body/components/BodyForm';
import { BodyScreen } from '@/features/body/components/BodyScreen';
import { ErrorState } from '@/shared/ui/error-state';
import { Skeleton } from '@/shared/ui/skeleton';

function BodyEdit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const body = useBody();

  if (body.isError) {
    return (
      <ErrorState
        message={t('body.loadError')}
        onRetry={() => {
          void body.refetch();
        }}
      />
    );
  }

  if (body.isPending) {
    return <Skeleton className="h-64 w-full rounded-xl" aria-hidden />;
  }

  return (
    <BodyForm
      body={body.data}
      submitLabel={t('body.save')}
      onSaved={() => {
        void navigate({ to: '/body' });
      }}
    />
  );
}

function BodyEditPage() {
  const { t } = useTranslation();

  return (
    <BodyScreen title={t('body.editBodyTitle')} backTo="/body">
      {() => <BodyEdit />}
    </BodyScreen>
  );
}

export { BodyEditPage };

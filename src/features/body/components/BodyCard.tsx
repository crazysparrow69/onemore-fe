import { Link } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Body } from '@/entities/body/model/schemas';
import { useToday } from '@/entities/user/api/use-today';
import { formatNumber } from '@/entities/training/model/format';
import { ageOn } from '@/features/body/model/dates';
import { IconButton } from '@/shared/ui/icon-button';
import { Card } from '@/shared/ui/card';
import { Stat } from '@/shared/ui/stat';
import { Text } from '@/shared/ui/text';

function BodyCard({ body }: { body: Body }) {
  const { t, i18n } = useTranslation();
  const today = useToday();

  return (
    <Card as="section">
      <div className="flex items-center justify-between gap-3">
        <Text as="h2" size="lg" weight="semibold">
          {t('body.cardTitle')}
        </Text>
        <IconButton asChild aria-label={t('body.edit')}>
          <Link to="/body/edit">
            <Pencil aria-hidden />
          </Link>
        </IconButton>
      </div>
      <dl className="grid grid-cols-2 gap-y-3">
        <Stat label={t('body.sex')}>{t(`body.${body.sex}`)}</Stat>
        <Stat label={t('body.age')} numeric>
          {t('body.ageYears', { count: ageOn(body.birthDate, today()) })}
        </Stat>
        <Stat label={t('body.height')} numeric>
          {formatNumber(body.heightCm, i18n.language)} {t('body.cmShort')}
        </Stat>
        <Stat label={t('body.activity')}>
          {t(`body.activityLevels.${body.activityLevel}`)}
        </Stat>
      </dl>
    </Card>
  );
}

export { BodyCard };

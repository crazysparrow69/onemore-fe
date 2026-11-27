import { useCallback } from 'react';
import { useCurrentUser } from '@/entities/user/api/use-auth';
import { localDate } from '@/shared/lib/local-date';

export function useToday(): () => string {
  const user = useCurrentUser();
  const timeZone = user.data?.timeZone;

  return useCallback(
    () => localDate(new Date(), timeZone ?? 'UTC'),
    [timeZone],
  );
}

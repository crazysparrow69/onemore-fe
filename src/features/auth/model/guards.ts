import { redirect } from '@tanstack/react-router';
import { getSession } from '@/entities/user/api/auth.service';

export async function requireUser(): Promise<void> {
  const session = await getSession();
  if (!session) {
    throw redirect({ to: '/sign-in' });
  }
}

export async function requireGuest(): Promise<void> {
  const session = await getSession();
  if (session) {
    throw redirect({ to: '/' });
  }
}

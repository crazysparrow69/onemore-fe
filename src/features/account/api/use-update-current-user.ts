import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth/api/auth.keys';
import {
  patchCurrentUser,
  type UserPatch,
} from '@/features/auth/api/current-user.service';

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UserPatch) => patchCurrentUser(patch),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.currentUser(), user);
    },
  });
}

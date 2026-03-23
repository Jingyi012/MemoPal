import { useMutation } from '@tanstack/react-query';
import { message } from 'antd';
import { adminUsersApi } from '../../../api/adminUsersApi';
import type { ManagedUserUpsertRequest } from '../../../types/user';

export function useUserMutations(onDone: () => void) {
  const createMutation = useMutation({
    mutationFn: (payload: ManagedUserUpsertRequest) => adminUsersApi.create(payload),
    onSuccess: () => {
      message.success('User created');
      onDone();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ManagedUserUpsertRequest }) =>
      adminUsersApi.update(id, payload),
    onSuccess: () => {
      message.success('User updated');
      onDone();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.remove(id),
    onSuccess: () => {
      message.success('User deleted');
      onDone();
    },
  });

  return { createMutation, updateMutation, deleteMutation };
}

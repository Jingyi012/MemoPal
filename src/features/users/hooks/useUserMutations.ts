import { useMutation } from '@tanstack/react-query';
import { App } from 'antd';
import { useAdminUsersApi } from './useAdminUsersApi';
import type { ManagedUserUpsertRequest } from '../../../types/user';

export function useUserMutations(onDone: () => void) {
  const { message } = App.useApp();
  const { createUser, updateUser, deleteUser } = useAdminUsersApi();

  const createMutation = useMutation({
    mutationFn: (payload: ManagedUserUpsertRequest) => createUser(payload),
    onSuccess: () => {
      message.success('User created');
      onDone();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ManagedUserUpsertRequest }) =>
      updateUser(id, payload),
    onSuccess: () => {
      message.success('User updated');
      onDone();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success('User deleted');
      onDone();
    },
  });

  return { createMutation, updateMutation, deleteMutation };
}

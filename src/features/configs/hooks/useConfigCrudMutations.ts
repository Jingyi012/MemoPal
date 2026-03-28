import { useMutation } from '@tanstack/react-query';
import { App } from 'antd';

export function useConfigCrudMutations<TCreate, TUpdateArg>(options: {
  create: (payload: TCreate) => Promise<unknown>;
  update: (arg: TUpdateArg) => Promise<unknown>;
  remove: (id: any) => Promise<unknown>;
  onDone: () => void;
  labels?: { create?: string; update?: string; remove?: string };
}) {
  const { message } = App.useApp();

  const createMutation = useMutation({
    mutationFn: options.create,
    onSuccess: () => {
      message.success(options.labels?.create ?? 'Created');
      options.onDone();
    },
  });

  const updateMutation = useMutation({
    mutationFn: options.update,
    onSuccess: () => {
      message.success(options.labels?.update ?? 'Updated');
      options.onDone();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: options.remove,
    onSuccess: () => {
      message.success(options.labels?.remove ?? 'Deleted');
      options.onDone();
    },
  });

  return { createMutation, updateMutation, deleteMutation };
}

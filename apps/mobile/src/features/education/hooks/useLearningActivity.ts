import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';
import { parseLearningActivity, updateLearningActivity, type LearningActivity } from '../utils/learningActivity';

const queues = new Map<string, Promise<unknown>>();
export function useLearningActivity() {
  const { user } = useAuth(); const client = useQueryClient();
  const userId = user?.id ?? ''; const key = ['learning-activity', userId] as const;
  const storageKey = `memopal:learning-activity:${userId}`;
  const query = useQuery({ queryKey: key, queryFn: async () => parseLearningActivity(await AsyncStorage.getItem(storageKey)), enabled: !!userId, staleTime: Infinity });
  const mutation = useMutation({
    mutationFn: async (item: Omit<LearningActivity, 'updatedAt'>) => {
      if (!userId) return;
      const operation = (queues.get(storageKey) ?? Promise.resolve()).catch(() => {}).then(async () => {
        const rows = parseLearningActivity(await AsyncStorage.getItem(storageKey));
        const updated = updateLearningActivity(rows, item, new Date().toISOString());
        await AsyncStorage.setItem(storageKey, JSON.stringify(updated)); client.setQueryData(key, updated);
      });
      queues.set(storageKey, operation);
      try { await operation; } finally { if (queues.get(storageKey) === operation) queues.delete(storageKey); }
    },
  });
  return { ...query, touch: mutation.mutate, saveError: mutation.isError };
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { educationLearningPreferences } from '../services/educationLearningPreferences.service';
import type { LearningPreferences } from '../utils/educationLearningPreferences';

const key = (userId: string) => ['education', 'learning-preferences', userId] as const;
export function useEducationLearningPreferences(userId: string) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: key(userId), queryFn: () => educationLearningPreferences.read(userId), enabled: !!userId });
  const save = useMutation({
    mutationFn: async (input: { userId: string; preferences: LearningPreferences }) => {
      if (!input.userId) throw new Error('Sign in to save learning preferences.');
      await educationLearningPreferences.save(input.userId, input.preferences);
      return input;
    },
    onSuccess: input => { client.setQueryData(key(input.userId), input.preferences); },
  });
  return { query, save };
}

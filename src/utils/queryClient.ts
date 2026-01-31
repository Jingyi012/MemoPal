import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // mobile-friendly
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      refetchOnReconnect: true,
      refetchOnWindowFocus: false, // RN has no window focus
      networkMode: 'always', // IMPORTANT for offline-first
    },
    mutations: {
      retry: 1,
      networkMode: 'always',
    },
  },
});

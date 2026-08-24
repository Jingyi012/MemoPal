import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // mobile-friendly
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      refetchOnReconnect: true,
      refetchOnWindowFocus: false, // RN has no window focus
      networkMode: 'online',
    },
    mutations: {
      // POST requests are not retried automatically until every write endpoint
      // supports an idempotency key.
      retry: false,
      networkMode: 'online',
    },
  },
});

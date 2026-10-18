import AsyncStorage from '@react-native-async-storage/async-storage';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { AppState, Platform } from 'react-native';

import { subscribeToOnlineState } from '@/core/network/networkStatus';

export const QUERY_CACHE_KEY = 'memopal-query-cache-v1';
export const QUERY_CACHE_BUSTER = 'memopal-query-cache-v1';

onlineManager.setEventListener((setOnline) => subscribeToOnlineState(setOnline));
if (Platform.OS !== 'web') {
  focusManager.setEventListener(setFocused => {
    const subscription = AppState.addEventListener('change', state => setFocused(state === 'active'));
    return () => subscription.remove();
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // mobile-friendly
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
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

export const queryPersister = createAsyncStoragePersister({
  // Expo Router renders the web shell on the server first. Do not touch
  // browser storage during that pass; the client restores the cache after mount.
  storage: Platform.OS === 'web' && typeof window === 'undefined' ? undefined : AsyncStorage,
  key: QUERY_CACHE_KEY,
  throttleTime: 1_000,
});

export async function clearPersistedQueryCache() {
  queryClient.clear();
  await queryPersister.removeClient();
}

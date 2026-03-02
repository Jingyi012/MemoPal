import { db } from '@/db/client';
import { SyncObserver } from '@/services/sync/sync.observer';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';
import { processQueue } from '../services/sync/processQueue';

export function useSyncManager(enabled: boolean = true) {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const debouncedProcessQueue = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        processQueue(db);
      }, 800);
    };

    const unsubscribeData = SyncObserver.subscribe(debouncedProcessQueue);

    const unsubscribeNet = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        debouncedProcessQueue();
      }
    });

    debouncedProcessQueue();

    return () => {
      unsubscribeData();
      unsubscribeNet();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [enabled]);
}

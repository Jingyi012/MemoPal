import { db } from '@/db/client';
import { SyncObserver } from '@/core/sync/sync.observer';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';
import { processQueue } from './processQueue';

export function useSyncManager(enabled: boolean = true) {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const periodicTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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

    // Retry periodically so backend restarts recover without requiring app/network events.
    periodicTimer.current = setInterval(() => {
      debouncedProcessQueue();
    }, 15000);

    debouncedProcessQueue();

    return () => {
      unsubscribeData();
      unsubscribeNet();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (periodicTimer.current) {
        clearInterval(periodicTimer.current);
      }
    };
  }, [enabled]);
}

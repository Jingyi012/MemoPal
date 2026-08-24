import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

import { isNetworkStateOnline } from '@/core/network/networkStatus';

export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState(state);
    });

    NetInfo.fetch().then(setNetworkState);

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isReady: networkState !== null,
    isOnline: isNetworkStateOnline(networkState),
    isConnected: networkState?.isConnected ?? false,
    isInternetReachable: networkState?.isInternetReachable ?? false,
    type: networkState?.type ?? 'unknown',
    details: networkState?.details ?? null,
  };
}

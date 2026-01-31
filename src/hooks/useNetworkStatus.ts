import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

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
    isConnected: networkState?.isConnected ?? false,
    isInternetReachable: networkState?.isInternetReachable ?? false,
    type: networkState?.type ?? 'unknown',
    details: networkState?.details ?? null,
  };
}

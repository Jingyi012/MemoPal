import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

import { getNetworkUiState } from '@/core/network/networkState';

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

  const uiState = getNetworkUiState(networkState);

  return {
    ...uiState,
    isConnected: networkState?.isConnected ?? false,
    isInternetReachable: networkState?.isInternetReachable ?? false,
    type: networkState?.type ?? 'unknown',
    details: networkState?.details ?? null,
  };
}

export type NetworkStateLike = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

export function isNetworkStateOnline(state: NetworkStateLike | null | undefined) {
  return Boolean(state?.isConnected) && state?.isInternetReachable !== false;
}

export function getNetworkUiState(state: NetworkStateLike | null | undefined) {
  const isReady = state != null;
  const isOnline = isNetworkStateOnline(state);
  return {
    isReady,
    isOnline,
    isOffline: isReady && !isOnline,
    canShowRequestErrors: isReady && isOnline,
  };
}

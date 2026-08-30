export type NetworkStateLike = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

export function isNetworkStateOnline(state: NetworkStateLike | null | undefined) {
  return Boolean(state?.isConnected) && state?.isInternetReachable !== false;
}

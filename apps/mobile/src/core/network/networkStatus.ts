import NetInfo from '@react-native-community/netinfo';

import { isNetworkStateOnline } from '@/core/network/networkState';

export { isNetworkStateOnline } from '@/core/network/networkState';

export function subscribeToOnlineState(listener: (isOnline: boolean) => void) {
  return NetInfo.addEventListener((state) => {
    listener(isNetworkStateOnline(state));
  });
}

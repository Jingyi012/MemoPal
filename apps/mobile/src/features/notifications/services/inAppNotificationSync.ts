import { queryClient } from '@/utils/queryClient';

export const InAppNotificationSync = {
  async syncAllUpcoming() {
    // Review scheduling is server-owned. Native push delivery is refreshed when
    // the backend returns device-specific schedules.
    await queryClient.invalidateQueries({ queryKey: ['reviews'] });
  },

  async refreshInAppInbox() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['reviews'] }),
    ]);
  },
};

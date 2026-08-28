import { queryClient } from '@/utils/queryClient';
import { isLocalPreviewEnabled } from '@/core/dev/localPreviewData';
import { practiceAttemptApi } from '@/features/practice-attempts/api/practiceAttempt.api';
import { PushNotificationService } from './pushNotificationService';

export const InAppNotificationSync = {
  async syncAllUpcoming(shouldSchedule = true) {
    await queryClient.invalidateQueries({ queryKey: ['practice-attempts'] });
    if (isLocalPreviewEnabled) return;

    if (!shouldSchedule) {
      await PushNotificationService.cancelAllReviewNotifications();
      return;
    }

    const granted = await PushNotificationService.requestPermissions({ prompt: false });
    if (!granted) return;

    const [due, upcoming] = await Promise.all([
      practiceAttemptApi.getDueReviews(),
      practiceAttemptApi.getUpcomingReviews(30),
    ]);
    await PushNotificationService.syncReviewNotifications([...due, ...upcoming]);
  },

  async refreshInAppInbox() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['practice-attempts'] }),
    ]);
  },
};

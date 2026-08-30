import {
  resolveLanguage,
  translations,
} from '@/core/i18n/i18n';

export function getLocalizedNotificationCopy(language?: string | null) {
  const resolvedLanguage = resolveLanguage(language);
  const copy = translations[resolvedLanguage].notifications;

  return {
    language: resolvedLanguage,
    reviewTitle: copy.reviewReminderTitle,
    reviewBody: (memorySetTitle: string) =>
      copy.reviewReminderBody.replace('{memorySetTitle}', memorySetTitle),
    dailyLearningTitle: copy.dailyLearningTitle,
    dailyLearningBody: copy.dailyLearningBody,
    reviewChannelName: copy.reviewChannelName,
  };
}

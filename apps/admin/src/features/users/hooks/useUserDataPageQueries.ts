import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminUsersApi } from '../../../api/adminUsersApi';

export type UserDataTabKey = 'overview' | 'content' | 'learning' | 'gamification' | 'system';

export function useUserDataPageQueries(userId: string | undefined, activeTab: UserDataTabKey) {
  const [progressesPage, setProgressesPage] = useState(1);
  const [progressesPageSize, setProgressesPageSize] = useState(10);

  const [xpEventsPage, setXpEventsPage] = useState(1);
  const [xpEventsPageSize, setXpEventsPageSize] = useState(10);

  const [badgesPage, setBadgesPage] = useState(1);
  const [badgesPageSize, setBadgesPageSize] = useState(10);

  const [milestonesPage, setMilestonesPage] = useState(1);
  const [milestonesPageSize, setMilestonesPageSize] = useState(10);

  const [subscriptionsPage, setSubscriptionsPage] = useState(1);
  const [subscriptionsPageSize, setSubscriptionsPageSize] = useState(10);

  const [notificationsPage, setNotificationsPage] = useState(1);
  const [notificationsPageSize, setNotificationsPageSize] = useState(10);

  const overviewQuery = useQuery({
    queryKey: ['admin-user-data-overview', userId],
    queryFn: () => adminUsersApi.getUserDataOverview(userId!),
    enabled: !!userId,
  });

  const progressesQuery = useQuery({
    queryKey: ['admin-user-data-progresses', userId, progressesPage, progressesPageSize],
    queryFn: () => adminUsersApi.listUserProgresses(userId!, progressesPage, progressesPageSize),
    enabled: !!userId && activeTab === 'learning',
    placeholderData: keepPreviousData,
  });

  const xpEventsQuery = useQuery({
    queryKey: ['admin-user-data-xp-events', userId, xpEventsPage, xpEventsPageSize],
    queryFn: () => adminUsersApi.listUserXpEvents(userId!, xpEventsPage, xpEventsPageSize),
    enabled: !!userId && activeTab === 'gamification',
    placeholderData: keepPreviousData,
  });

  const badgesQuery = useQuery({
    queryKey: ['admin-user-data-badges', userId, badgesPage, badgesPageSize],
    queryFn: () => adminUsersApi.listUserBadges(userId!, badgesPage, badgesPageSize),
    enabled: !!userId && activeTab === 'gamification',
    placeholderData: keepPreviousData,
  });

  const milestonesQuery = useQuery({
    queryKey: ['admin-user-data-milestones', userId, milestonesPage, milestonesPageSize],
    queryFn: () => adminUsersApi.listUserMilestones(userId!, milestonesPage, milestonesPageSize),
    enabled: !!userId && activeTab === 'gamification',
    placeholderData: keepPreviousData,
  });

  const subscriptionsQuery = useQuery({
    queryKey: ['admin-user-data-subscriptions', userId, subscriptionsPage, subscriptionsPageSize],
    queryFn: () => adminUsersApi.listUserSubscriptions(userId!, subscriptionsPage, subscriptionsPageSize),
    enabled: !!userId && activeTab === 'system',
    placeholderData: keepPreviousData,
  });

  const notificationsQuery = useQuery({
    queryKey: ['admin-user-data-notifications', userId, notificationsPage, notificationsPageSize],
    queryFn: () => adminUsersApi.listUserNotifications(userId!, notificationsPage, notificationsPageSize),
    enabled: !!userId && activeTab === 'system',
    placeholderData: keepPreviousData,
  });

  return {
    overviewQuery,
    progressesQuery,
    xpEventsQuery,
    badgesQuery,
    milestonesQuery,
    subscriptionsQuery,
    notificationsQuery,
    progressesPage,
    progressesPageSize,
    setProgressesPage,
    setProgressesPageSize,
    xpEventsPage,
    xpEventsPageSize,
    setXpEventsPage,
    setXpEventsPageSize,
    badgesPage,
    badgesPageSize,
    setBadgesPage,
    setBadgesPageSize,
    milestonesPage,
    milestonesPageSize,
    setMilestonesPage,
    setMilestonesPageSize,
    subscriptionsPage,
    subscriptionsPageSize,
    setSubscriptionsPage,
    setSubscriptionsPageSize,
    notificationsPage,
    notificationsPageSize,
    setNotificationsPage,
    setNotificationsPageSize,
  };
}

export type UserDataPageQueriesResult = ReturnType<typeof useUserDataPageQueries>;

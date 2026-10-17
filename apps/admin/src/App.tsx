import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Flex, Spin } from 'antd';
import Layout from './components/Layout';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import { adminPaths } from './navigation/adminPaths';

const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'));
const FeatureLimitsPage = lazy(() => import('./pages/FeatureLimitsPage'));
const LevelConfigsPage = lazy(() => import('./pages/LevelConfigsPage'));
const MilestoneDefinitionsPage = lazy(() => import('./pages/MilestoneDefinitionsPage'));
const AvatarDefinitionsPage = lazy(() => import('./pages/AvatarDefinitionsPage'));
const ReferralConfigPage = lazy(() => import('./pages/ReferralConfigPage'));
const ReferralUsersPage = lazy(() => import('./pages/ReferralUsersPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'));
const AiCreditsPage = lazy(() => import('./features/ai-credits/pages/AiCreditsPage'));
const SystemSettingsPage = lazy(() => import('./pages/SystemSettingsPage'));
const XpConfigsPage = lazy(() => import('./pages/XpConfigsPage'));
const ForbiddenPage = lazy(() => import('./pages/ForbiddenPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PalaceScenesPage = lazy(() => import('./features/palace-scenes/pages/PalaceScenesPage'));
const MemoryCollectionsPage = lazy(() => import('./features/predefined-memory-lessons/pages/MemoryCollectionsPage'));
const MemoryCollectionEditorPage = lazy(() => import('./features/predefined-memory-lessons/pages/MemoryCollectionEditorPage'));
const PredefinedMemoryLessonCategoriesPage = lazy(() => import('./features/predefined-memory-lessons/pages/PredefinedMemoryLessonCategoriesPage'));
const CommunityMemorySetsPage = lazy(() => import('./features/community-memory-sets/pages/CommunityMemorySetsPage'));

function RouteFallback() {
  return <Flex align="center" justify="center" style={{ minHeight: 240 }}><Spin size="large" /></Flex>;
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route path={adminPaths.login} element={<LoginPage />} />
      <Route path={adminPaths.forbidden} element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminRoute />}>
          <Route path={adminPaths.root} element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="community-memory-sets" element={<CommunityMemorySetsPage />} />
            <Route path="content">
              <Route index element={<Navigate to="memory-collections" replace />} />
              <Route path="palace-scenes" element={<PalaceScenesPage />} />
              <Route path="palace-scenes/:sceneId" element={<PalaceScenesPage />} />
              <Route path="predefined-memory-lessons" element={<MemoryCollectionsPage />} />
              <Route path="predefined-memory-lessons/:lessonId" element={<MemoryCollectionsPage />} />
              <Route path="memory-collections" element={<MemoryCollectionsPage />} />
              <Route path="memory-collections/:collectionId" element={<MemoryCollectionEditorPage />} />
              <Route path="memory-collections/:collectionId/lessons" element={<MemoryCollectionsPage />} />
              <Route path="memory-collections/:collectionId/lessons/:lessonId" element={<MemoryCollectionsPage />} />
              <Route path="predefined-memory-lesson-categories" element={<PredefinedMemoryLessonCategoriesPage />} />
            </Route>
            <Route path="configs">
              <Route index element={<Navigate to="limits" replace />} />
              <Route path="limits" element={<FeatureLimitsPage />} />
              <Route path="xp" element={<XpConfigsPage />} />
              <Route path="levels" element={<LevelConfigsPage />} />
              <Route path="milestones" element={<MilestoneDefinitionsPage />} />
              <Route path="avatars" element={<AvatarDefinitionsPage />} />
            </Route>
            <Route path="referrals">
              <Route index element={<Navigate to="config" replace />} />
              <Route path="config" element={<ReferralConfigPage />} />
              <Route path="users" element={<ReferralUsersPage />} />
            </Route>
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="ai-credits" element={<AiCreditsPage />} />
            <Route path="system-settings" element={<SystemSettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={adminPaths.root} replace />} />
      </Routes>
    </Suspense>
  );
}

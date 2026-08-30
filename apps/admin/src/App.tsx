import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import FeatureLimitsPage from './pages/FeatureLimitsPage';
import LevelConfigsPage from './pages/LevelConfigsPage';
import MilestoneDefinitionsPage from './pages/MilestoneDefinitionsPage';
import ReferralConfigPage from './pages/ReferralConfigPage';
import ReferralUsersPage from './pages/ReferralUsersPage';
import UsersPage from './pages/UsersPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import XpConfigsPage from './pages/XpConfigsPage';
import ForbiddenPage from './pages/ForbiddenPage';
import LoginPage from './pages/LoginPage';
import { adminPaths } from './navigation/adminPaths';
import PalaceScenesPage from './features/palace-scenes/pages/PalaceScenesPage';

export default function App() {
  return (
    <Routes>
      <Route path={adminPaths.login} element={<LoginPage />} />
      <Route path={adminPaths.forbidden} element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminRoute />}>
          <Route path={adminPaths.root} element={<Layout />}>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="content">
              <Route index element={<Navigate to="palace-scenes" replace />} />
              <Route path="palace-scenes" element={<PalaceScenesPage />} />
            </Route>
            <Route path="configs">
              <Route index element={<Navigate to="limits" replace />} />
              <Route path="limits" element={<FeatureLimitsPage />} />
              <Route path="xp" element={<XpConfigsPage />} />
              <Route path="levels" element={<LevelConfigsPage />} />
              <Route path="milestones" element={<MilestoneDefinitionsPage />} />
            </Route>
            <Route path="referrals">
              <Route index element={<Navigate to="config" replace />} />
              <Route path="config" element={<ReferralConfigPage />} />
              <Route path="users" element={<ReferralUsersPage />} />
            </Route>
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="system-settings" element={<SystemSettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={adminPaths.root} replace />} />
    </Routes>
  );
}

import {
  BookOutlined,
  DashboardOutlined,
  EyeOutlined,
  LogoutOutlined,
  ReadOutlined,
  SettingOutlined,
  ShareAltOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import { Button, Flex, Popover, Space, Typography } from 'antd';
import type { ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { adminMenuItems, learningStudioMenuItem, type AdminMenuItem } from '../../../navigation/adminMenu';
import { adminPaths } from '../../../navigation/adminPaths';
import { useEducationRelationships } from '../hooks/useEducationRelationships';
import { getEducationWorkspaceCapabilities } from '../utils/educationWorkspaceCapabilities';
import { EducationLanguageSwitch } from '../components/EducationLanguageSwitch';
import { useEducationText } from '../i18n/useEducationText';

type LayoutMenuItem = Omit<AdminMenuItem, 'icon' | 'routes'> & {
  icon?: ReactNode;
  routes?: LayoutMenuItem[];
};

export default function EducationLayout() {
  const { user, isAdmin, logout } = useAuth();
  const { t } = useEducationText();
  const location = useLocation();
  const navigate = useNavigate();
  const relationships = useEducationRelationships(user?.id ?? '', isAdmin);
  const capabilities = getEducationWorkspaceCapabilities({
    userId: user?.id ?? '',
    classrooms: relationships.classrooms.data ?? [],
    memberships: relationships.memberships.data ?? [],
    guardianLinks: relationships.guardianLinks.data ?? [],
  });
  const learningStudioMenu: AdminMenuItem = {
    ...learningStudioMenuItem,
    routes: learningStudioMenuItem.routes?.filter(item =>
      item.path !== adminPaths.educationFamilyAssignments || capabilities.guardian),
  };
  const menuItems = isAdmin
    ? adminMenuItems.map(item => item.path === adminPaths.education ? learningStudioMenu : item)
    : [learningStudioMenu];
  const mapMenuWithIcons = (items: AdminMenuItem[]): LayoutMenuItem[] => items.map(item => ({
    ...item,
    icon: item.icon === 'dashboard' ? <DashboardOutlined />
      : item.icon === 'users' ? <TeamOutlined />
        : item.icon === 'content' ? <BookOutlined />
          : item.icon === 'learning' ? <ReadOutlined />
            : item.icon === 'referral' ? <ShareAltOutlined />
              : item.icon === 'moderation' ? <EyeOutlined />
                : <SettingOutlined />,
    routes: item.routes ? mapMenuWithIcons(item.routes) : undefined,
  }));
  const profileContent = <div className="education-profile-popover">
    {user?.email && <>
      <Typography.Text type="secondary">{t('signedInAs')}</Typography.Text>
      <Typography.Text className="education-profile-email">{user.email}</Typography.Text>
    </>}
    <Space className="education-profile-language" align="center">
      <Typography.Text>{t('language')}</Typography.Text>
      <EducationLanguageSwitch />
    </Space>
    <Button block icon={<LogoutOutlined />} onClick={() => {
      logout();
      navigate(adminPaths.login);
    }}>{t('logout')}</Button>
  </div>;

  return (
    <Flex style={{ height: '100vh', width: '100%' }}>
      <ProLayout
        title="MemoPal"
        logo={false}
        fixSiderbar
        style={{ width: '100%' }}
        contentWidth="Fluid"
        siderWidth={248}
        location={{ pathname: location.pathname }}
        menu={{ defaultOpenAll: true }}
        contentStyle={{ padding: '28px 32px 36px', width: '100%', maxWidth: '100%' }}
        token={{
          bgLayout: '#f4f7f5',
          pageContainer: {
            colorBgPageContainer: '#f4f7f5',
            colorBgPageContainerFixed: '#f4f7f5',
          },
          sider: {
            colorMenuBackground: '#ffffff',
            colorBgCollapsedButton: '#ffffff',
          },
          header: {
            colorBgHeader: '#ffffff',
            colorHeaderTitle: '#193c38',
          },
        }}
        route={{ routes: mapMenuWithIcons(menuItems) }}
        menuItemRender={(item, dom) => item.path ? <Link to={item.path}>{dom}</Link> : dom}
        actionsRender={() => [
          <Popover key="profile" trigger="click" placement="rightBottom" title={t('profile')} content={profileContent}>
            <Button className="education-profile-trigger" type="text" aria-label={t('profile')} icon={<UserOutlined />}>
              <span className="education-profile-username">{user?.displayName?.trim() || t('profile')}</span>
            </Button>
          </Popover>,
        ]}
      >
        <Outlet />
      </ProLayout>
    </Flex>
  );
}

import {
  BookOutlined,
  DashboardOutlined,
  EyeOutlined,
  LogoutOutlined,
  ReadOutlined,
  ShareAltOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { ProLayout } from "@ant-design/pro-components";
import { Button, Flex, Typography } from "antd";
import type { ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { adminMenuItems, type AdminMenuItem } from "../navigation/adminMenu";
import { adminPaths } from "../navigation/adminPaths";

type LayoutMenuItem = Omit<AdminMenuItem, "icon" | "routes"> & {
  icon?: ReactNode;
  routes?: LayoutMenuItem[];
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const mapMenuWithIcons = (items: AdminMenuItem[]): LayoutMenuItem[] =>
    items.map((item) => ({
      ...item,
      icon:
        item.icon === "dashboard" ? (
          <DashboardOutlined />
        ) : item.icon === "users" ? (
          <TeamOutlined />
        ) : item.icon === "content" ? (
          <BookOutlined />
        ) : item.icon === "learning" ? (
          <ReadOutlined />
        ) : item.icon === "referral" ? (
          <ShareAltOutlined />
        ) : item.icon === "moderation" ? (
          <EyeOutlined />
        ) : (
          <SettingOutlined />
        ),
      routes: item.routes ? mapMenuWithIcons(item.routes) : undefined,
    }));

  return (
    <Flex style={{ height: "100vh", width: "100%" }}>
      <ProLayout
        title="MemoPal"
        logo={false}
        fixSiderbar
        style={{ width: "100%" }}
        contentWidth="Fluid"
        siderWidth={248}
        location={{ pathname: location.pathname }}
        menu={{ defaultOpenAll: true }}
        contentStyle={{
          padding: "28px 32px 36px",
          width: "100%",
          maxWidth: "100%",
        }}
        token={{
          bgLayout: "#f4f7f5",
          pageContainer: {
            colorBgPageContainer: "#f4f7f5",
            colorBgPageContainerFixed: "#f4f7f5",
          },
          sider: {
            colorMenuBackground: "#ffffff",
            colorBgCollapsedButton: "#ffffff",
          },
          header: {
            colorBgHeader: "#ffffff",
            colorHeaderTitle: "#193c38",
          },
        }}
        route={{
          routes: mapMenuWithIcons(adminMenuItems),
        }}
        menuItemRender={(item, dom) =>
          item.path ? <Link to={item.path}>{dom}</Link> : dom
        }
        actionsRender={() => [
          <Typography.Text
            key="user-email"
            type="secondary"
            style={{ fontSize: 12 }}
          >
            {user?.email}
          </Typography.Text>,
          <Button
            key="logout"
            icon={<LogoutOutlined />}
            onClick={() => {
              logout();
              navigate(adminPaths.login);
            }}
          >
            Logout
          </Button>,
        ]}
      >
        <Outlet />
      </ProLayout>
    </Flex>
  );
}

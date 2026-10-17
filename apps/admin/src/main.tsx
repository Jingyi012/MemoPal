import { ConfigProvider, App as AntApp } from "antd";
import enUS from "antd/locale/en_US";
import { QueryClientProvider } from "@tanstack/react-query";
import "antd/dist/reset.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import App from "./App";
import { QueryClientNotificationBridge } from "./components/QueryClientNotificationBridge";
import "./index.css";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={enUS} theme={{
        token: {
          colorPrimary: '#0f766e', colorInfo: '#0f766e', colorSuccess: '#29845b',
          colorInfoBg: '#edf5f0', colorInfoBorder: '#d5e5dd',
          colorText: '#193c38', colorTextSecondary: '#687d75',
          colorBorder: '#dce5e0', colorBorderSecondary: '#e5eae9',
          colorBgLayout: '#f4f7f5', borderRadius: 8, borderRadiusLG: 12,
          fontFamily: 'Inter, "Noto Sans SC", "Microsoft YaHei", "PingFang SC", system-ui, -apple-system, "Segoe UI", sans-serif',
        },
        components: {
          Table: { headerBg: '#f8faf9', headerColor: '#586b65', rowHoverBg: '#f3f8f5', cellPaddingBlock: 16 },
          Card: { headerFontSize: 16 },
          Button: { primaryShadow: 'none' },
          Menu: { itemSelectedBg: '#edf5f0', itemSelectedColor: '#0f766e' },
        },
      }}>
        <AntApp>
          <QueryClientNotificationBridge />
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
);

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
      <ConfigProvider locale={enUS}>
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

import { App } from "antd";
import { useEffect } from "react";
import { extractApiErrorMessage } from "../lib/errorMessage";
import { setGlobalQueryClientErrorNotifier } from "../lib/queryClient";

export function QueryClientNotificationBridge() {
  const { notification } = App.useApp();

  useEffect(() => {
    setGlobalQueryClientErrorNotifier((error, fallbackMessage) => {
      notification.error({
        message: "Request Failed",
        description: extractApiErrorMessage(error, fallbackMessage),
        placement: "topRight",
      });
    });

    return () => {
      setGlobalQueryClientErrorNotifier(null);
    };
  }, [notification]);

  return null;
}

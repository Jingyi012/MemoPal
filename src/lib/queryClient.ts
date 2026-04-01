import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

type GlobalErrorNotifier = (error: unknown, fallbackMessage: string) => void;

let notifyGlobalError: GlobalErrorNotifier | null = null;

export function setGlobalQueryClientErrorNotifier(
  notifier: GlobalErrorNotifier | null,
): void {
  notifyGlobalError = notifier;
}

type GlobalErrorMeta = {
  suppressGlobalErrorToast?: boolean;
  suppressGlobalErrorNotification?: boolean;
  errorMessage?: string;
};

function shouldSuppress(meta: GlobalErrorMeta | undefined): boolean {
  return !!(meta?.suppressGlobalErrorToast || meta?.suppressGlobalErrorNotification);
}

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const meta = mutation.meta as GlobalErrorMeta | undefined;

      if (shouldSuppress(meta)) {
        return;
      }

      notifyGlobalError?.(error, meta?.errorMessage ?? "Request failed.");
    },
  }),
  queryCache: new QueryCache({
    onError: (error, query) => {
      const meta = query.meta as GlobalErrorMeta | undefined;
      if (shouldSuppress(meta)) {
        return;
      }

      notifyGlobalError?.(error, meta?.errorMessage ?? "Request failed.");
    },
  }),
});

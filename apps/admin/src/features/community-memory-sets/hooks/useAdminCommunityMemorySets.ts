import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { adminCommunityMemorySetsApi } from "../../../api/adminCommunityMemorySetsApi";

export const adminCommunityMemorySetsQueryKey = ["admin-community-memory-sets"] as const;

export function useAdminCommunityMemorySets() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: adminCommunityMemorySetsQueryKey });
  };

  const hideMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminCommunityMemorySetsApi.hide(id, reason),
    onSuccess: async () => {
      message.success("Memory set hidden from the community library.");
      await invalidate();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: adminCommunityMemorySetsApi.restore,
    onSuccess: async () => {
      message.success("Memory set restored to the community library.");
      await invalidate();
    },
  });

  const featuredMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      adminCommunityMemorySetsApi.setFeatured(id, featured),
    onSuccess: async (_, variables) => {
      message.success(variables.featured ? "Memory set featured in Community." : "Memory set removed from featured content.");
      await invalidate();
    },
  });

  return { hideMutation, restoreMutation, featuredMutation };
}

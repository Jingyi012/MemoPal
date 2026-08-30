import { useCallback } from 'react';
import { adminConfigsApi } from '../../../api/adminConfigsApi';

export function useAdminConfigsApi() {
  const listMilestoneDefinitions = useCallback(
    (pageNumber = 1, pageSize = 20, search = '') =>
      adminConfigsApi.listMilestoneDefinitions(pageNumber, pageSize, search),
    [],
  );
  const createMilestoneDefinition = useCallback(
    (payload: Parameters<typeof adminConfigsApi.createMilestoneDefinition>[0]) =>
      adminConfigsApi.createMilestoneDefinition(payload),
    [],
  );
  const updateMilestoneDefinition = useCallback(
    (
      id: Parameters<typeof adminConfigsApi.updateMilestoneDefinition>[0],
      payload: Parameters<typeof adminConfigsApi.updateMilestoneDefinition>[1],
    ) => adminConfigsApi.updateMilestoneDefinition(id, payload),
    [],
  );
  const deleteMilestoneDefinition = useCallback(
    (id: Parameters<typeof adminConfigsApi.deleteMilestoneDefinition>[0]) =>
      adminConfigsApi.deleteMilestoneDefinition(id),
    [],
  );

  return {
    listMilestoneDefinitions,
    createMilestoneDefinition,
    updateMilestoneDefinition,
    deleteMilestoneDefinition,
  };
}

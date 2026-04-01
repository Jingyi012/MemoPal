import { useCallback } from 'react';
import { adminConfigsApi } from '../../../api/adminConfigsApi';

export function useAdminConfigsApi() {
  const listBadgeDefinitions = useCallback(
    (pageNumber = 1, pageSize = 20, search = '') =>
      adminConfigsApi.listBadgeDefinitions(pageNumber, pageSize, search),
    [],
  );
  const createBadgeDefinition = useCallback(
    (payload: Parameters<typeof adminConfigsApi.createBadgeDefinition>[0]) =>
      adminConfigsApi.createBadgeDefinition(payload),
    [],
  );
  const updateBadgeDefinition = useCallback(
    (
      id: Parameters<typeof adminConfigsApi.updateBadgeDefinition>[0],
      payload: Parameters<typeof adminConfigsApi.updateBadgeDefinition>[1],
    ) => adminConfigsApi.updateBadgeDefinition(id, payload),
    [],
  );
  const deleteBadgeDefinition = useCallback(
    (id: Parameters<typeof adminConfigsApi.deleteBadgeDefinition>[0]) =>
      adminConfigsApi.deleteBadgeDefinition(id),
    [],
  );

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

  const listMissionTemplates = useCallback(
    () => adminConfigsApi.listMissionTemplates(),
    [],
  );
  const updateMissionTemplates = useCallback(
    (templates: Parameters<typeof adminConfigsApi.updateMissionTemplates>[0]) =>
      adminConfigsApi.updateMissionTemplates(templates),
    [],
  );

  return {
    listBadgeDefinitions,
    createBadgeDefinition,
    updateBadgeDefinition,
    deleteBadgeDefinition,
    listMilestoneDefinitions,
    createMilestoneDefinition,
    updateMilestoneDefinition,
    deleteMilestoneDefinition,
    listMissionTemplates,
    updateMissionTemplates,
  };
}

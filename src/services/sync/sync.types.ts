export interface SyncQueue {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  payload: string;
  createdAt: string;
}

export type SyncAction = 'create' | 'update' | 'delete';

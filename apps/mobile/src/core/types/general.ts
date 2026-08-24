export interface Auditable {
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface Syncable {
  lastSyncedAt?: string | null;
}

export interface SoftDeletable {
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface GeneralResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  [key: string]: any;
}

export interface PaginationMeta {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface PagedResponse<T> extends GeneralResponse<T> {
  pagination: PaginationMeta;
}

export interface PaginationFilterParams {
  pageNumber: number;
  pageSize: number;
}

export const MEMORY_FOLDER_KEYS = {
  all: ['memory-folders'] as const,
  list: () => [...MEMORY_FOLDER_KEYS.all, 'list'] as const,
  detail: (folderId: string) => [...MEMORY_FOLDER_KEYS.all, 'detail', folderId] as const,
};

export type MemoryFolder = {
  id: string;
  name: string;
  memorySetCount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MemoryFolderCreateRequest = { name: string };
export type MemoryFolderUpdateRequest = { name: string };

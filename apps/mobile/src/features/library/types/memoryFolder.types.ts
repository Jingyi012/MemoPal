export type MemoryFolder = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  memorySetCount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MemoryFolderCreateRequest = { name: string; emoji?: string; description?: string };
export type MemoryFolderUpdateRequest = MemoryFolderCreateRequest;

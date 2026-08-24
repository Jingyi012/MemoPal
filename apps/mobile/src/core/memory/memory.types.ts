export type MemoryMethod = 'palace' | 'number-peg';

export type MemoryModuleFlags = Record<MemoryMethod, boolean>;

export type MemoryActivityReference = {
  method: MemoryMethod;
  activityId: string;
};

export type MemoryMethodCapabilities = {
  supportsCustomContent: boolean;
  supportsReview: boolean;
};

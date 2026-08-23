export const PALACE_KEYS = {
  all: ['palaces'] as const,
  list: () => [...PALACE_KEYS.all, 'list'] as const,
  details: () => [...PALACE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PALACE_KEYS.details(), id] as const,
};

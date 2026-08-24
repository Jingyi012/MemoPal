import { getNumberPegOverview } from '@/features/number-peg/services/numberPeg.service';
import { useMemo } from 'react';

export function useNumberPegOverview() {
  return useMemo(() => getNumberPegOverview(), []);
}

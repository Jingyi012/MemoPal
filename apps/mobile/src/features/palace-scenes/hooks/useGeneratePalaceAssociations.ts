import { useMutation } from '@tanstack/react-query';
import {
  palaceAssociationApi,
  type GeneratePalaceAssociationsRequest,
} from '../api/palaceAssociation.api';

export function useGeneratePalaceAssociations() {
  return useMutation({
    mutationFn: (request: GeneratePalaceAssociationsRequest) =>
      palaceAssociationApi.generate(request),
    retry: false,
  });
}

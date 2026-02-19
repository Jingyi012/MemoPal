import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { Location } from '@/types/palace';

/**
 * API calls for locations
 */
export const locationApi = {
  /**
   * Fetch locations for a given palace
   */
  async getByPalace(palaceId: string): Promise<Location[]> {
    const response = await api.get<GeneralResponse<Location[]>>(`/palaces/${palaceId}/locations`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Fetch location by ID
   */
  async getById(id: string): Promise<Location> {
    const response = await api.get<GeneralResponse<Location>>(`/locations/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Create a new location
   */
  async create(location: Partial<Location>): Promise<Location> {
    const response = await api.post<GeneralResponse<Location>>('/locations', location);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Update an existing location
   */
  async update(location: Location): Promise<Location> {
    const response = await api.put<GeneralResponse<Location>>(
      `/locations/${location.id}`,
      location
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Delete a location
   */
  async delete(id: string): Promise<void> {
    const response = await api.delete<GeneralResponse<null>>(`/locations/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
  },

  /**
   * Fetch locations updated since last sync
   */
  async getUpdatedSince(lastSyncedAt: string): Promise<Location[]> {
    const response = await api.get<GeneralResponse<Location[]>>('/locations/updated', {
      params: { since: lastSyncedAt },
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};

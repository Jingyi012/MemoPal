import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { LevelConfigs, LevelConfigVersion } from '@/types/levelConfigs';

/**
 * API calls for level configurations
 */
export const levelConfigApi = {
  /**
   * Get all level configurations
   */
  async getAll(): Promise<LevelConfigs[]> {
    const response = await api.get<GeneralResponse<LevelConfigs[]>>('/level-configs');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Get config snapshot version (for change detection)
   */
  async getVersion(): Promise<LevelConfigVersion> {
    const response = await api.get<GeneralResponse<LevelConfigVersion>>('/level-configs/version');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Get specific level config
   */
  async getByLevel(level: number): Promise<LevelConfigs> {
    const response = await api.get<GeneralResponse<LevelConfigs>>(`/level-configs/${level}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Create a new level config
   */
  async create(config: Partial<LevelConfigs>): Promise<LevelConfigs> {
    const response = await api.post<GeneralResponse<LevelConfigs>>('/level-configs', config);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Update an existing level config
   */
  async update(level: number, config: Partial<LevelConfigs>): Promise<LevelConfigs> {
    const response = await api.put<GeneralResponse<LevelConfigs>>(
      `/level-configs/${level}`,
      config
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Delete a level config
   */
  async delete(level: number): Promise<void> {
    const response = await api.delete<GeneralResponse<null>>(`/level-configs/${level}`);
    if (!response.data.success) throw new Error(response.data.message);
  },

};

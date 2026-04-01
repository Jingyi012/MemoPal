import { apiClient } from "../lib/apiClient";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type {
  LessonDto,
  LessonUpsertRequest,
  LocationDto,
  LocationReorderRequest,
  LocationUpsertRequest,
  PalaceDto,
  PalaceUpsertRequest,
  WordDto,
  WordUpsertRequest,
} from "../types/content";

export interface ContentQueryScope {
  adminCreatedOnly?: boolean;
}

const buildScopeParams = (scope?: ContentQueryScope) =>
  scope?.adminCreatedOnly ? { adminCreatedOnly: true } : undefined;

async function listPalacesPage(
  pageNumber: number,
  pageSize: number,
  scope?: ContentQueryScope,
) {
  const response = await apiClient.get<PaginatedResponse<PalaceDto>>(
    "/palaces",
    {
      params: { pageNumber, pageSize, ...buildScopeParams(scope) },
    },
  );
  return response.data;
}

export const adminContentApi = {
  listPalaces(pageNumber = 1, pageSize = 20, scope?: ContentQueryScope) {
    return listPalacesPage(pageNumber, pageSize, scope);
  },

  async listAllPalaces(scope?: ContentQueryScope) {
    const pageSize = 100;
    let pageNumber = 1;
    let totalCount = Number.MAX_SAFE_INTEGER;
    const all: PalaceDto[] = [];

    while (all.length < totalCount) {
      const page = await listPalacesPage(pageNumber, pageSize, scope);
      all.push(...page.data);
      totalCount = page.pagination.totalCount;
      if (page.data.length === 0) break;
      pageNumber += 1;
    }

    return all;
  },

  async createPalace(payload: PalaceUpsertRequest) {
    const response = await apiClient.post<ApiResponse<PalaceDto>>(
      "/palaces",
      payload,
    );
    return response.data.data;
  },

  async updatePalace(id: string, payload: PalaceUpsertRequest) {
    const response = await apiClient.put<ApiResponse<PalaceDto>>(
      `/palaces/${id}`,
      payload,
    );
    return response.data.data;
  },

  async deletePalace(id: string) {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `/palaces/${id}`,
    );
    return response.data.data;
  },

  async listLocationsByPalace(palaceId: string, scope?: ContentQueryScope) {
    const response = await apiClient.get<ApiResponse<LocationDto[]>>(
      `/palaces/${palaceId}/locations`,
      {
        params: buildScopeParams(scope),
      },
    );
    return response.data.data;
  },

  async getPalaceById(palaceId: string, scope?: ContentQueryScope) {
    const response = await apiClient.get<ApiResponse<PalaceDto>>(
      `/palaces/${palaceId}`,
      {
        params: buildScopeParams(scope),
      },
    );
    return response.data.data;
  },

  async createLocation(payload: LocationUpsertRequest) {
    const response = await apiClient.post<ApiResponse<LocationDto>>(
      "/locations",
      payload,
    );
    return response.data.data;
  },

  async updateLocation(id: string, payload: LocationUpsertRequest) {
    const response = await apiClient.put<ApiResponse<LocationDto>>(
      `/locations/${id}`,
      payload,
    );
    return response.data.data;
  },

  async deleteLocation(id: string) {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `/locations/${id}`,
    );
    return response.data.data;
  },

  async reorderLocations(palaceId: string, payload: LocationReorderRequest) {
    const response = await apiClient.post<ApiResponse<LocationDto[]>>(
      `/palaces/${palaceId}/locations/reorder`,
      payload,
    );
    return response.data.data;
  },

  async listLessons(scope?: ContentQueryScope) {
    const response = await apiClient.get<ApiResponse<LessonDto[]>>("/lessons", {
      params: buildScopeParams(scope),
    });
    return response.data.data;
  },

  async listLessonsByPalace(palaceId: string, scope?: ContentQueryScope) {
    const response = await apiClient.get<ApiResponse<LessonDto[]>>(
      `/palaces/${palaceId}/lessons`,
      {
        params: buildScopeParams(scope),
      },
    );
    return response.data.data;
  },

  async getLessonById(lessonId: string, scope?: ContentQueryScope) {
    const response = await apiClient.get<ApiResponse<LessonDto>>(
      `/lessons/${lessonId}`,
      {
        params: buildScopeParams(scope),
      },
    );
    return response.data.data;
  },

  async createLesson(payload: LessonUpsertRequest) {
    const response = await apiClient.post<ApiResponse<LessonDto>>(
      "/lessons",
      payload,
    );
    return response.data.data;
  },

  async updateLesson(id: string, payload: LessonUpsertRequest) {
    const response = await apiClient.put<ApiResponse<LessonDto>>(
      `/lessons/${id}`,
      payload,
    );
    return response.data.data;
  },

  async deleteLesson(id: string) {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `/lessons/${id}`,
    );
    return response.data.data;
  },

  async listWordsByLesson(lessonId: string, scope?: ContentQueryScope) {
    const response = await apiClient.get<ApiResponse<WordDto[]>>("/words", {
      params: { lessonId, ...buildScopeParams(scope) },
    });
    return response.data.data;
  },

  async createWord(payload: WordUpsertRequest) {
    const response = await apiClient.post<ApiResponse<WordDto>>(
      "/words",
      payload,
    );
    return response.data.data;
  },

  async createWordsBatch(payload: WordUpsertRequest[]) {
    const response = await apiClient.post<ApiResponse<WordDto[]>>(
      "/words/batch",
      payload,
    );
    return response.data.data;
  },

  async updateWord(id: string, payload: WordUpsertRequest) {
    const response = await apiClient.patch<ApiResponse<WordDto>>(
      `/words/${id}`,
      payload,
    );
    return response.data.data;
  },

  async deleteWord(id: string) {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `/words/${id}`,
    );
    return response.data.data;
  },
};

import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { Notification, NotificationUpsertRequest } from '@/types/notification';

/**
 * API calls for notifications
 */
export const notificationApi = {
  /**
   * Fetch all notifications
   */
  async getAll(): Promise<Notification[]> {
    const response = await api.get<GeneralResponse<Notification[]>>('/notifications', {
      params: {},
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Fetch notification by ID
   */
  async getById(id: string): Promise<Notification> {
    const response = await api.get<GeneralResponse<Notification>>(`/notifications/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Fetch notifications by palace ID
   */
  async getByPalaceId(palaceId: string): Promise<Notification[]> {
    const response = await api.get<GeneralResponse<Notification[]>>(
      `/palaces/${palaceId}/notifications`
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Create a new notification
   */
  async create(notification: Notification): Promise<Notification> {
    const response = await api.post<GeneralResponse<Notification>>('/notifications', notification);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Update notification
   */
  async update(
    notificationId: string,
    notification: NotificationUpsertRequest
  ): Promise<Notification> {
    const response = await api.put<GeneralResponse<Notification>>(
      `/notifications/${notificationId}`,
      notification
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Delete notification
   */
  async delete(notificationId: string): Promise<void> {
    const response = await api.delete<GeneralResponse<null>>(`/notifications/${notificationId}`);
    if (!response.data.success) throw new Error(response.data.message);
  },

  /**
   * Fetch unread notifications for a given user
   */
  async getAllUnread(): Promise<Notification[]> {
    const response = await api.get<GeneralResponse<Notification[]>>('/notifications/unread', {
      params: {},
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};

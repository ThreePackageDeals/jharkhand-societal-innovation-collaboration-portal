import { prisma } from '../../config/db';
import { SystemNotification } from '../../../src/types';

export class NotificationsService {
  async getUserNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: {
        OR: [
          { recipientId: userId },
          { recipientId: null }, // Broadcast notifications
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    // Verify the notification belongs to this user before marking as read
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        OR: [
          { recipientId: userId },
          { recipientId: null },
        ],
      },
    });

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    return await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        OR: [
          { recipientId: userId },
          { recipientId: null },
        ],
      },
      data: { read: true },
    });
  }

  async createNotification(data: {
    type: string;
    title: string;
    message: string;
    targetRole?: string;
    recipientId?: string;
    actionUrl?: string;
  }) {
    return await prisma.notification.create({
      data: {
        ...data,
      },
    });
  }
}

export const notificationsService = new NotificationsService();

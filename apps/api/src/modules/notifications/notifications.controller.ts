import type { Request, Response, NextFunction } from 'express';
import type { NotificationListInput, PushSubscriptionInput, PushUnsubscribeInput } from '@fitflow/shared';
import { notificationsService } from './notifications.service.js';

export class NotificationsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as NotificationListInput;
      const result = await notificationsService.list(req.user!.sub, query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async unreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationsService.unreadCount(req.user!.sub);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notification = await notificationsService.markRead(
        req.user!.sub,
        String(req.params.id),
      );
      res.status(200).json(notification);
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationsService.markAllRead(req.user!.sub);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async vapidPublicKey(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(notificationsService.getVapidPublicKey());
    } catch (err) {
      next(err);
    }
  }

  async subscribePush(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as PushSubscriptionInput;
      await notificationsService.subscribePush(req.user!.sub, input);
      res.status(201).json({ message: 'Subscribed' });
    } catch (err) {
      next(err);
    }
  }

  async unsubscribePush(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as PushUnsubscribeInput;
      await notificationsService.unsubscribePush(req.user!.sub, input.endpoint);
      res.status(200).json({ message: 'Unsubscribed' });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();

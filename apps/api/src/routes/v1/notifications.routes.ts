import { Router, type IRouter } from 'express';
import {
  NotificationListSchema,
  PushSubscriptionInputSchema,
  PushUnsubscribeSchema,
} from '@fitflow/shared';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { notificationsController } from '../../modules/notifications/notifications.controller.js';

export const notificationRoutes: IRouter = Router();

notificationRoutes.use(authenticate);

notificationRoutes.get('/', validate(NotificationListSchema, 'query'), (req, res, next) =>
  notificationsController.list(req, res, next),
);

notificationRoutes.get('/unread-count', (req, res, next) =>
  notificationsController.unreadCount(req, res, next),
);

notificationRoutes.patch('/read-all', (req, res, next) =>
  notificationsController.markAllRead(req, res, next),
);

notificationRoutes.patch('/:id/read', (req, res, next) =>
  notificationsController.markRead(req, res, next),
);

notificationRoutes.get('/push/vapid-public-key', (req, res, next) =>
  notificationsController.vapidPublicKey(req, res, next),
);

notificationRoutes.post('/push/subscribe', validate(PushSubscriptionInputSchema), (req, res, next) =>
  notificationsController.subscribePush(req, res, next),
);

notificationRoutes.delete('/push/subscribe', validate(PushUnsubscribeSchema), (req, res, next) =>
  notificationsController.unsubscribePush(req, res, next),
);

import { Router, type IRouter } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { subscriptionsController } from '../../modules/subscriptions/subscriptions.controller.js';

export const subscriptionsRoutes: IRouter = Router();

subscriptionsRoutes.use(authenticate);

subscriptionsRoutes.get('/', (req, res, next) =>
  subscriptionsController.list(req, res, next),
);

subscriptionsRoutes.post('/:coachId', (req, res, next) =>
  subscriptionsController.subscribe(req, res, next),
);

subscriptionsRoutes.delete('/:coachId', (req, res, next) =>
  subscriptionsController.unsubscribe(req, res, next),
);

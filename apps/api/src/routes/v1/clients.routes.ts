import { Router, type IRouter } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { clientsController } from '../../modules/clients/clients.controller.js';

export const clientsRoutes: IRouter = Router();

clientsRoutes.get('/', authenticate, (req, res, next) =>
  clientsController.list(req, res, next),
);

clientsRoutes.post('/', authenticate, (req, res, next) =>
  clientsController.create(req, res, next),
);

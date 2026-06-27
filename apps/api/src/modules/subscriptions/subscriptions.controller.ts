import type { Request, Response, NextFunction } from 'express';
import { subscriptionsService } from './subscriptions.service.js';

export class SubscriptionsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await subscriptionsService.list(req.user!.sub, req.user!.role);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await subscriptionsService.subscribe(
        req.user!.sub,
        req.user!.role,
        String(req.params.coachId),
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await subscriptionsService.unsubscribe(
        req.user!.sub,
        req.user!.role,
        String(req.params.coachId),
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const subscriptionsController = new SubscriptionsController();

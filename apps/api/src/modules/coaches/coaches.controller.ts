import type { Request, Response, NextFunction } from 'express';
import type { CoachSearchInput } from '@fitflow/shared';
import { UserRole } from '@prisma/client';
import { coachesService } from './coaches.service.js';

export class CoachesController {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as CoachSearchInput;
      const clientId =
        req.user?.role === UserRole.CLIENT ? req.user.sub : undefined;
      const result = await coachesService.search(query, clientId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const coachesController = new CoachesController();

import { Router, type IRouter } from 'express';
import { CoachSearchSchema } from '@fitflow/shared';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { coachesController } from '../../modules/coaches/coaches.controller.js';

export const coachesRoutes: IRouter = Router();

coachesRoutes.get('/', optionalAuth, validate(CoachSearchSchema, 'query'), (req, res, next) =>
  coachesController.search(req, res, next),
);

import { Router, type IRouter } from 'express';
import { CreateWorkoutSchema, UpdateWorkoutSchema, WorkoutSearchSchema } from '@fitflow/shared';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { workoutsController } from '../../modules/workouts/workouts.controller.js';

export const workoutRoutes: IRouter = Router();

workoutRoutes.get('/share/:code', optionalAuth, (req, res, next) =>
  workoutsController.getByShareCode(req, res, next),
);

workoutRoutes.get('/search', optionalAuth, validate(WorkoutSearchSchema, 'query'), (req, res, next) =>
  workoutsController.search(req, res, next),
);

workoutRoutes.get('/', authenticate, (req, res, next) =>
  workoutsController.list(req, res, next),
);

workoutRoutes.post('/', authenticate, validate(CreateWorkoutSchema), (req, res, next) =>
  workoutsController.create(req, res, next),
);

workoutRoutes.get('/:id', authenticate, (req, res, next) =>
  workoutsController.getById(req, res, next),
);

workoutRoutes.patch('/:id', authenticate, validate(UpdateWorkoutSchema), (req, res, next) =>
  workoutsController.update(req, res, next),
);

workoutRoutes.delete('/:id', authenticate, (req, res, next) =>
  workoutsController.delete(req, res, next),
);

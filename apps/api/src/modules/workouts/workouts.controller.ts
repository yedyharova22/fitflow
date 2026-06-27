import type { Request, Response, NextFunction } from 'express';
import type { CreateWorkoutInput, UpdateWorkoutInput, WorkoutSearchInput } from '@fitflow/shared';
import { workoutsService } from './workouts.service.js';

export class WorkoutsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workouts = await workoutsService.list(req.user!.sub, req.user!.role);
      res.status(200).json({ data: workouts });
    } catch (err) {
      next(err);
    }
  }

  async getByShareCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workout = await workoutsService.getByShareCode(String(req.params.code));
      res.status(200).json(workout);
    } catch (err) {
      next(err);
    }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as WorkoutSearchInput;
      const result = await workoutsService.searchDiscovery(query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workout = await workoutsService.getById(String(req.params.id), req.user!.sub, req.user!.role);
      res.status(200).json(workout);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateWorkoutInput;
      const workout = await workoutsService.create(req.user!.sub, req.user!.role, input);
      res.status(201).json(workout);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateWorkoutInput;
      const workout = await workoutsService.update(String(req.params.id), req.user!.sub, req.user!.role, input);
      res.status(200).json(workout);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await workoutsService.delete(String(req.params.id), req.user!.sub, req.user!.role);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const workoutsController = new WorkoutsController();

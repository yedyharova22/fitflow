import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { clientsService } from './clients.service.js';

const CreateClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  trainerId: z.string().uuid(),
});

export class ClientsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clients = await clientsService.listForCoach(req.user!.sub, req.user!.role);
      res.status(200).json(clients);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = CreateClientSchema.parse(req.body);
      const client = await clientsService.createClient(req.user!.sub, req.user!.role, input);
      res.status(201).json(client);
    } catch (err) {
      next(err);
    }
  }
}

export const clientsController = new ClientsController();

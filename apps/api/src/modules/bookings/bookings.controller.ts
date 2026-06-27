import type { Request, Response, NextFunction } from 'express';
import type { BookingListInput, CreateBookingInput, UpdateBookingStatusInput } from '@fitflow/shared';
import { bookingsService } from './bookings.service.js';

export class BookingsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as BookingListInput;
      const result = await bookingsService.list(req.user!.sub, req.user!.role, query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateBookingInput;
      const booking = await bookingsService.create(req.user!.sub, req.user!.role, input);
      res.status(201).json(booking);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateBookingStatusInput;
      const booking = await bookingsService.updateStatus(
        String(req.params.id),
        req.user!.sub,
        req.user!.role,
        input,
      );
      res.status(200).json(booking);
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingsService.cancel(
        String(req.params.id),
        req.user!.sub,
        req.user!.role,
      );
      res.status(200).json(booking);
    } catch (err) {
      next(err);
    }
  }

  async attend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingsService.attend(
        String(req.params.id),
        req.user!.sub,
        req.user!.role,
      );
      res.status(200).json(booking);
    } catch (err) {
      next(err);
    }
  }
}

export const bookingsController = new BookingsController();

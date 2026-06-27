import { Router, type IRouter } from 'express';
import {
  BookingListSchema,
  CreateBookingSchema,
  UpdateBookingStatusSchema,
} from '@fitflow/shared';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { bookingsController } from '../../modules/bookings/bookings.controller.js';

export const bookingRoutes: IRouter = Router();

bookingRoutes.get('/', authenticate, validate(BookingListSchema, 'query'), (req, res, next) =>
  bookingsController.list(req, res, next),
);

bookingRoutes.post('/', authenticate, validate(CreateBookingSchema), (req, res, next) =>
  bookingsController.create(req, res, next),
);

bookingRoutes.patch('/:id', authenticate, validate(UpdateBookingStatusSchema), (req, res, next) =>
  bookingsController.updateStatus(req, res, next),
);

bookingRoutes.patch('/:id/cancel', authenticate, (req, res, next) =>
  bookingsController.cancel(req, res, next),
);

bookingRoutes.patch('/:id/attend', authenticate, (req, res, next) =>
  bookingsController.attend(req, res, next),
);

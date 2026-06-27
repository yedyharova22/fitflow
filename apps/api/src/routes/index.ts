import { Router, type IRouter } from 'express';
import { healthRoutes } from './health.routes.js';
import { authRoutes } from './v1/auth.routes.js';
import { workoutRoutes } from './v1/workouts.routes.js';
import { bookingRoutes } from './v1/bookings.routes.js';
import { notificationRoutes } from './v1/notifications.routes.js';
import { clientsRoutes } from './v1/clients.routes.js';
import { profileRoutes } from './v1/profile.routes.js';
import { coachesRoutes } from './v1/coaches.routes.js';
import { subscriptionsRoutes } from './v1/subscriptions.routes.js';

export const routes: IRouter = Router();

routes.use('/health', healthRoutes);
routes.use('/v1/auth', authRoutes);
routes.use('/v1/workouts', workoutRoutes);
routes.use('/v1/bookings', bookingRoutes);
routes.use('/v1/notifications', notificationRoutes);
routes.use('/v1/clients', clientsRoutes);
routes.use('/v1/profile', profileRoutes);
routes.use('/v1/coaches', coachesRoutes);
routes.use('/v1/subscriptions', subscriptionsRoutes);

import { Router, type IRouter } from 'express';
import {
  DeviceAuthSchema,
  LoginSchema,
  RecoverAuthSchema,
  RefreshTokenSchema,
  RegisterSchema,
  RequestRecoverSchema,
} from '@fitflow/shared';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter, recoverLimiter, refreshLimiter } from '../../middleware/rate-limit.js';
import { authController } from '../../modules/auth/auth.controller.js';

export const authRoutes: IRouter = Router();

authRoutes.post('/device', authLimiter, validate(DeviceAuthSchema), (req, res, next) =>
  authController.deviceAuth(req, res, next),
);

authRoutes.post('/login', authLimiter, validate(LoginSchema), (req, res, next) =>
  authController.login(req, res, next),
);

authRoutes.post('/register', authLimiter, validate(RegisterSchema), (req, res, next) =>
  authController.register(req, res, next),
);

authRoutes.post('/logout', (req, res, next) => authController.logout(req, res, next));

authRoutes.post('/refresh', refreshLimiter, validate(RefreshTokenSchema), (req, res, next) =>
  authController.refresh(req, res, next),
);

authRoutes.post(
  '/recover/request',
  recoverLimiter,
  validate(RequestRecoverSchema),
  (req, res, next) => authController.requestRecover(req, res, next),
);

authRoutes.post('/recover', recoverLimiter, validate(RecoverAuthSchema), (req, res, next) =>
  authController.recover(req, res, next),
);

authRoutes.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

import { Router, type IRouter } from 'express';
import {
  SaveAvatarSchema,
  UpdateProfileSchema,
  UploadAvatarSchema,
} from '@fitflow/shared';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { profileController } from '../../modules/profile/profile.controller.js';

export const profileRoutes: IRouter = Router();

profileRoutes.get('/', authenticate, (req, res, next) =>
  profileController.getProfile(req, res, next),
);

profileRoutes.patch('/', authenticate, validate(UpdateProfileSchema), (req, res, next) =>
  profileController.updateProfile(req, res, next),
);

profileRoutes.post('/avatar/upload', authenticate, validate(UploadAvatarSchema), (req, res, next) =>
  profileController.uploadAvatar(req, res, next),
);

profileRoutes.post('/avatar', authenticate, validate(SaveAvatarSchema), (req, res, next) =>
  profileController.saveAvatar(req, res, next),
);

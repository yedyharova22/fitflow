import type { Request, Response, NextFunction } from 'express';
import type { SaveAvatarInput, UpdateProfileInput, UploadAvatarInput } from '@fitflow/shared';
import { profileService } from './profile.service.js';

export class ProfileController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await profileService.getProfile(req.user!.sub);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateProfileInput;
      const profile = await profileService.updateProfile(req.user!.sub, input);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  }

  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { image } = req.body as UploadAvatarInput;
      const result = await profileService.uploadAvatar(image);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async saveAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { avatarUrl } = req.body as SaveAvatarInput;
      const result = await profileService.saveAvatar(req.user!.sub, avatarUrl);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const profileController = new ProfileController();

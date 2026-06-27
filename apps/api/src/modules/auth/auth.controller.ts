import type { Request, Response, NextFunction } from 'express';
import type {
  DeviceAuthInput,
  LoginInput,
  RecoverAuthInput,
  RefreshTokenInput,
  RegisterInput,
  RequestRecoverInput,
} from '@fitflow/shared';
import { setAuthCookies, clearAuthCookies } from '../../lib/auth-cookies.js';
import { authService } from './auth.service.js';

function sendSession(res: Response, result: Awaited<ReturnType<typeof authService.authenticateDevice>>) {
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(200).json({
    accessToken: result.accessToken,
    user: result.user,
  });
}

export class AuthController {
  async deviceAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as DeviceAuthInput;
      const result = await authService.authenticateDevice(input);
      sendSession(res, result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as LoginInput;
      const result = await authService.login(input);
      sendSession(res, result);
    } catch (err) {
      next(err);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RegisterInput;
      const result = await authService.register(input);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RefreshTokenInput;
      const cookieToken = req.cookies?.refreshToken as string | undefined;
      const result = await authService.refreshAccessToken(cookieToken, input);

      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(200).json({ accessToken: result.accessToken });
    } catch (err) {
      clearAuthCookies(res);
      next(err);
    }
  }

  async requestRecover(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RequestRecoverInput;
      const result = await authService.requestRecoverOtp(input);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async recover(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RecoverAuthInput;
      const result = await authService.recoverAccount(input);
      sendSession(res, result);
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.sub);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      clearAuthCookies(res);
      res.status(200).json({ message: 'Logged out' });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();

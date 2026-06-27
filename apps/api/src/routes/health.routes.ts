import { Router, type IRouter } from 'express';

export const healthRoutes: IRouter = Router();

healthRoutes.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'fitflow-api',
  });
});

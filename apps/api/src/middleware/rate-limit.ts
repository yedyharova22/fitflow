import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many auth requests, please try again later',
      code: 'RATE_LIMITED',
    },
  },
});

/** Refresh is token-gated; allow more headroom than credential endpoints. */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many refresh attempts, please try again later',
      code: 'RATE_LIMITED',
    },
  },
});

export const recoverLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many recovery attempts, please try again later',
      code: 'RATE_LIMITED',
    },
  },
});

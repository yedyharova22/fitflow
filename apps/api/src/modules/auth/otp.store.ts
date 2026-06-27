import { randomInt, timingSafeEqual } from 'node:crypto';

const OTP_TTL_MS = 10 * 60 * 1000;

interface OtpEntry {
  code: string;
  expiresAt: number;
}

class OtpStore {
  private store = new Map<string, OtpEntry>();

  create(identifier: string): string {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    this.store.set(identifier.toLowerCase(), {
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
    });
    return code;
  }

  verify(identifier: string, code: string): boolean {
    const entry = this.store.get(identifier.toLowerCase());
    if (!entry || entry.expiresAt < Date.now()) {
      this.store.delete(identifier.toLowerCase());
      return false;
    }

    const a = Buffer.from(entry.code);
    const b = Buffer.from(code);
    if (a.length !== b.length) {
      return false;
    }

    const valid = timingSafeEqual(a, b);
    if (!valid) {
      return false;
    }

    return true;
  }

  clear(identifier: string): void {
    this.store.delete(identifier.toLowerCase());
  }
}

export const otpStore = new OtpStore();

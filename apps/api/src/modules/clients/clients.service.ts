import { randomBytes } from 'node:crypto';
import { hash } from 'bcrypt';
import { UserRole } from '@prisma/client';
import { ForbiddenError } from '../../lib/errors.js';
import { AuthRepository } from '../auth/auth.repository.js';

const authRepo = new AuthRepository();
const BCRYPT_ROUNDS = 10;

export class ClientsService {
  async listForCoach(coachId: string, role: UserRole) {
    if (role !== UserRole.COACH) {
      throw new ForbiddenError('Only coaches can list clients');
    }

    const clients = await authRepo.findClientsByCoachId(coachId);
    return clients.map((client) => ({
      id: client.id,
      name: client.profile?.name ?? 'Client',
      email: client.email,
      phone: client.phone,
    }));
  }

  async createClient(
    coachId: string,
    role: UserRole,
    input: { name: string; email: string; phone?: string; trainerId: string },
  ) {
    if (role !== UserRole.COACH || coachId !== input.trainerId) {
      throw new ForbiddenError('Unauthorized');
    }

    const tempPassword = randomBytes(4).toString('hex');
    const passwordHash = await hash(tempPassword, BCRYPT_ROUNDS);

    const client = await authRepo.createClientUser({
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
      coachId: coachId,
    });

    return {
      id: client.id,
      name: client.profile?.name ?? input.name,
      email: client.email,
      phone: client.phone,
      tempPassword,
    };
  }
}

export const clientsService = new ClientsService();

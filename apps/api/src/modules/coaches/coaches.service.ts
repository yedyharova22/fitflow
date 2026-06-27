import type { CoachSearchInput, CoachSearchResponse } from '@fitflow/shared';
import { boundingBox, haversineKm } from '@fitflow/shared';
import { coachesRepository } from './coaches.repository.js';

export class CoachesService {
  async search(
    query: CoachSearchInput,
    clientId?: string,
  ): Promise<CoachSearchResponse> {
    const { lat, lng, radius, page, pageSize } = query;
    const box = boundingBox(lat, lng, radius);

    const coaches = await coachesRepository.findInBoundingBox(box);

    const origin = { lat, lng };
    const withDistance = coaches
      .map((coach) => ({
        coach,
        distanceKm: haversineKm(origin, {
          lat: coach.latitude!,
          lng: coach.longitude!,
        }),
      }))
      .filter((item) => item.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const total = withDistance.length;
    const pageItems = withDistance.slice((page - 1) * pageSize, page * pageSize);

    const coachIds = pageItems.map((item) => item.coach.id);
    const subscriptions = clientId
      ? await coachesRepository.findSubscriptionsForClient(clientId, coachIds)
      : [];
    const subscribedSet = new Set(subscriptions.map((s) => s.coachId));

    return {
      data: pageItems.map(({ coach, distanceKm }) => ({
        id: coach.id,
        name: coach.profile?.name ?? 'Coach',
        avatarUrl: coach.profile?.avatarUrl ?? null,
        description: coach.profile?.description ?? null,
        latitude: coach.latitude!,
        longitude: coach.longitude!,
        distanceKm: Math.round(distanceKm * 10) / 10,
        isSubscribed: clientId ? subscribedSet.has(coach.id) : undefined,
      })),
      total,
      page,
      pageSize,
    };
  }
}

export const coachesService = new CoachesService();

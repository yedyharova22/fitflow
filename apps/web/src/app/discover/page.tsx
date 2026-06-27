'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { AppNavBar } from '@/components/AppNavBar';
import { Routes } from '@/consts/Pages';
import { CoachCard } from '@/features/discovery/CoachCard';
import { WorkoutDiscoveryCard } from '@/features/discovery/WorkoutDiscoveryCard';
import {
  useCoachSearch,
  useSubscriptions,
  useWorkoutSearch,
} from '@/features/discovery/use-discovery';
import { useAuth } from '@/features/auth/use-auth';

const DEFAULT_LAT = 50.4501;
const DEFAULT_LNG = 30.5234;

const DiscoveryMap = dynamic(() => import('@/features/discovery/DiscoveryMap'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress size={24} />
    </Box>
  ),
});

export default function DiscoverPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [workoutQuery, setWorkoutQuery] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      setGeoError('Location unavailable — showing Kyiv area.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setCoords({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        setGeoError('Could not get your location — showing Kyiv area.');
      },
    );
  }, []);

  const coachParams = useMemo(
    () => (coords ? { lat: coords.lat, lng: coords.lng, radius: 10, page: 1, pageSize: 20 } : null),
    [coords],
  );

  const workoutParams = useMemo(
    () =>
      coords
        ? {
            lat: coords.lat,
            lng: coords.lng,
            radius: 10,
            q: workoutQuery || undefined,
            page: 1,
            pageSize: 20,
          }
        : null,
    [coords, workoutQuery],
  );

  const coachesQuery = useCoachSearch(tab === 0 ? coachParams : null);
  const workoutsQuery = useWorkoutSearch(tab === 1 ? workoutParams : null);
  const subscriptionsQuery = useSubscriptions();

  if (authLoading) {
    return (
      <>
        <AppNavBar />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (user?.legacyRole === 'trainer') {
    return (
      <>
        <AppNavBar />
        <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, pb: 6 }}>
          <Typography variant="body1" color="text.secondary">
            Discovery is available for clients. Switch to a client account to browse coaches and workouts.
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <AppNavBar />
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, pb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Discover</Typography>
          <Button
            component={Link}
            href={Routes.DISCOVER_SCAN}
            startIcon={<QrCodeScannerIcon />}
            size="small"
          >
            Scan QR
          </Button>
        </Box>

        {geoError && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {geoError}
          </Typography>
        )}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Coaches nearby" />
          <Tab label="Workouts" />
          <Tab label="Following" />
        </Tabs>

        {tab === 0 && (
          <>
            <FormControlLabel
              control={<Switch checked={showMap} onChange={(e) => setShowMap(e.target.checked)} />}
              label="Show map"
              sx={{ mb: 2 }}
            />
            {!coords || coachesQuery.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : coachesQuery.error ? (
              <Typography color="error">Failed to load coaches.</Typography>
            ) : (
              <>
                {showMap && coords && (
                  <DiscoveryMap
                    centerLat={coords.lat}
                    centerLng={coords.lng}
                    coaches={coachesQuery.data?.data ?? []}
                  />
                )}
                {(coachesQuery.data?.data ?? []).length === 0 ? (
                  <Typography color="text.secondary">No coaches found nearby.</Typography>
                ) : (
                  coachesQuery.data?.data.map((coach) => (
                    <CoachCard key={coach.id} coach={coach} />
                  ))
                )}
              </>
            )}
          </>
        )}

        {tab === 1 && (
          <>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by title or location"
              value={workoutQuery}
              onChange={(e) => setWorkoutQuery(e.target.value)}
              sx={{ mb: 2 }}
            />
            {!coords || workoutsQuery.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : workoutsQuery.error ? (
              <Typography color="error">Failed to load workouts.</Typography>
            ) : (workoutsQuery.data?.data ?? []).length === 0 ? (
              <Typography color="text.secondary">No workouts found.</Typography>
            ) : (
              workoutsQuery.data?.data.map((workout) => (
                <WorkoutDiscoveryCard key={workout.id} workout={workout} />
              ))
            )}
          </>
        )}

        {tab === 2 && (
          <>
            {subscriptionsQuery.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : subscriptionsQuery.error ? (
              <Typography color="error">Failed to load subscriptions.</Typography>
            ) : (subscriptionsQuery.data?.data ?? []).length === 0 ? (
              <Typography color="text.secondary">
                You are not following any coaches yet. Browse the Coaches tab to follow someone.
              </Typography>
            ) : (
              subscriptionsQuery.data?.data.map((sub) => (
                <CoachCard
                  key={sub.coachId}
                  coach={{
                    id: sub.coachId,
                    name: sub.name,
                    avatarUrl: sub.avatarUrl,
                    description: sub.description,
                    latitude: DEFAULT_LAT,
                    longitude: DEFAULT_LNG,
                    isSubscribed: true,
                  }}
                  showSubscribe
                />
              ))
            )}
          </>
        )}
      </Box>
    </>
  );
}

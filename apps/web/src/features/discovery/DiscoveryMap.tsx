'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography } from '@mui/material';
import type { CoachDiscoveryResponse } from '@fitflow/shared';
import 'leaflet/dist/leaflet.css';

const DEFAULT_LAT = 50.4501;
const DEFAULT_LNG = 30.5234;

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface DiscoveryMapProps {
  centerLat: number;
  centerLng: number;
  coaches: CoachDiscoveryResponse[];
}

function RecenterMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude, map]);
  return null;
}

export default function DiscoveryMap({ centerLat, centerLng, coaches }: DiscoveryMapProps) {
  const center = useMemo(
    () => [centerLat ?? DEFAULT_LAT, centerLng ?? DEFAULT_LNG] as [number, number],
    [centerLat, centerLng],
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Map
      </Typography>
      <Box
        sx={{
          height: 320,
          width: '100%',
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap latitude={center[0]} longitude={center[1]} />
          {coaches.map((coach) => (
            <Marker key={coach.id} position={[coach.latitude, coach.longitude]} icon={markerIcon}>
              <Popup>
                <strong>{coach.name}</strong>
                {coach.distanceKm != null && (
                  <>
                    <br />
                    {coach.distanceKm} km away
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Box>
  );
}

'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Box, Button, Typography } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
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

interface CoachLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (latitude: number, longitude: number) => void;
}

function MapClickHandler({
  onChange,
}: {
  onChange: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude, map]);
  return null;
}

export default function CoachLocationMap({
  latitude,
  longitude,
  onChange,
}: CoachLocationMapProps) {
  const position = useMemo(
    () =>
      latitude != null && longitude != null
        ? ([latitude, longitude] as [number, number])
        : ([DEFAULT_LAT, DEFAULT_LNG] as [number, number]),
    [latitude, longitude],
  );

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // ignore geolocation errors
      },
    );
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Coach location
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Drag the pin or click the map to set your location.
      </Typography>
      <Box
        sx={{
          height: 280,
          width: '100%',
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          mb: 1,
        }}
      >
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap latitude={position[0]} longitude={position[1]} />
          <Marker
            position={position}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target as L.Marker;
                const latlng = marker.getLatLng();
                onChange(latlng.lat, latlng.lng);
              },
            }}
          />
          <MapClickHandler onChange={onChange} />
        </MapContainer>
      </Box>
      <Button
        size="small"
        startIcon={<MyLocationIcon />}
        onClick={handleUseMyLocation}
        sx={{ mb: 1 }}
      >
        Use my location
      </Button>
      <Typography variant="caption" color="text.secondary" display="block">
        {latitude != null && longitude != null
          ? `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`
          : 'No location set'}
      </Typography>
    </Box>
  );
}

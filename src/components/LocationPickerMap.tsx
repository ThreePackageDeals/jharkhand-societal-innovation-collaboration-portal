import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (location: { lat: number; lng: number }) => void;
}

const pinIcon = L.divIcon({
  className: 'location-picker-pin',
  html: '<span class="location-picker-pin__marker" aria-hidden="true"></span>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

const toRecordedCoordinate = (value: number) => Number(value.toFixed(4));

function MapViewport({ latitude, longitude }: Pick<LocationPickerMapProps, 'latitude' | 'longitude'>) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), { animate: false });
  }, [latitude, longitude, map]);

  return null;
}

function MapLocationSelector({ onLocationChange }: Pick<LocationPickerMapProps, 'onLocationChange'>) {
  useMapEvents({
    click: ({ latlng }) => {
      onLocationChange({
        lat: toRecordedCoordinate(latlng.lat),
        lng: toRecordedCoordinate(latlng.lng),
      });
    },
  });

  return null;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  onLocationChange,
}) => {
  const position = useMemo<L.LatLngExpression>(() => [latitude, longitude], [latitude, longitude]);

  return (
    <div className="mt-3 overflow-hidden border border-stone-300 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-[#FAF7F2] px-3 py-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-stone-600">
          Pin the challenge location
        </span>
        <span className="text-[10px] text-stone-500">Click map or drag pin</span>
      </div>
      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={false}
        className="h-52 w-full"
        aria-label="Interactive map for selecting the challenge location"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport latitude={latitude} longitude={longitude} />
        <MapLocationSelector onLocationChange={onLocationChange} />
        <Marker
          position={position}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const { lat, lng } = (event.target as L.Marker).getLatLng();
              onLocationChange({
                lat: toRecordedCoordinate(lat),
                lng: toRecordedCoordinate(lng),
              });
            },
          }}
        />
      </MapContainer>
    </div>
  );
};

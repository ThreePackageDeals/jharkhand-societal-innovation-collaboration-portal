import React, { useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface ProblemLocationMapProps {
  latitude: number;
  longitude: number;
  label: string;
  compact?: boolean;
}

const dossierPin = L.divIcon({
  className: 'location-picker-pin',
  html: '<span class="location-picker-pin__marker" aria-hidden="true"></span>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

export const ProblemLocationMap: React.FC<ProblemLocationMapProps> = ({
  latitude,
  longitude,
  label,
  compact = false,
}) => {
  const position = useMemo<L.LatLngExpression>(() => [latitude, longitude], [latitude, longitude]);

  return (
    <section className="overflow-hidden border border-stone-300 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-[#FAF7F2] px-3 py-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-stone-600">Mapped challenge location</span>
        <span className="truncate text-[10px] text-stone-500">{label}</span>
      </div>
      <MapContainer
        key={`problem-location-${latitude}-${longitude}-${compact ? 'compact' : 'full'}`}
        center={position}
        zoom={compact ? 12 : 14}
        scrollWheelZoom={false}
        className={compact ? 'relative z-0 h-40 w-full' : 'relative z-0 h-56 w-full'}
        aria-label={`Map showing ${label}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={dossierPin} />
      </MapContainer>
    </section>
  );
};

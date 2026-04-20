import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface SafetyMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: { id: string; position: { lat: number; lng: number }; label?: string }[];
  geofence?: { latitude: number; longitude: number; radius: number } | null;
  onMapClick?: (pos: { lat: number; lng: number }) => void;
  className?: string;
}

// Component to programmatically change map center
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Component to handle clicks
const MapEvents = ({ onClick }: { onClick?: (pos: { lat: number; lng: number }) => void }) => {
  useMapEvents({
    click(e) {
      onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

export const SafetyMap: React.FC<SafetyMapProps> = ({ 
  center, 
  zoom = 13, 
  markers = [], 
  geofence,
  onMapClick,
  className = "h-48 w-full rounded-3xl"
}) => {
  const pos: [number, number] = [center.lat, center.lng];

  return (
    <div className={`${className} overflow-hidden isolate shadow-inner`}>
      <MapContainer 
        center={pos} 
        zoom={zoom} 
        scrollWheelZoom={false}
        dragging={true}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ChangeView center={pos} zoom={zoom} />
        <MapEvents onClick={onMapClick} />

        {markers.map(m => (
          <Marker key={m.id} position={[m.position.lat, m.position.lng]} />
        ))}
        
        {geofence && geofence.latitude !== 0 && (
          <Circle
            center={[geofence.latitude, geofence.longitude]}
            radius={geofence.radius}
            pathOptions={{
              fillColor: '#ef4444',
              fillOpacity: 0.1,
              color: '#ef4444',
              weight: 1,
              opacity: 0.5
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

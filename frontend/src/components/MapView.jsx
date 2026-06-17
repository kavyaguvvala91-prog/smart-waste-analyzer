import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import marker from 'leaflet/dist/images/marker-icon.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: shadow,
});

const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

export default function MapView({ userLocation, centers = [] }) {
  const center = useMemo(() => {
    if (userLocation?.latitude != null && userLocation?.longitude != null) {
      return [userLocation.latitude, userLocation.longitude];
    }
    if (centers[0]?.latitude != null && centers[0]?.longitude != null) {
      return [centers[0].latitude, centers[0].longitude];
    }
    return [20.5937, 78.9629];
  }, [userLocation, centers]);

  return (
    <div className="glass-card overflow-hidden p-4">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="z-0">
        <ChangeView center={center} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation?.latitude != null && userLocation?.longitude != null ? (
          <>
            <Marker position={[userLocation.latitude, userLocation.longitude]}>
              <Popup>Your location</Popup>
            </Marker>
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={1200}
              pathOptions={{ color: '#059669', fillColor: '#10b981', fillOpacity: 0.12 }}
            />
          </>
        ) : null}
        {centers.map((centerItem) => (
          <Marker
            key={`${centerItem.name}-${centerItem.latitude || centerItem.distance}`}
            position={[centerItem.latitude, centerItem.longitude]}
          >
            <Popup>
              <strong>{centerItem.name}</strong>
              <br />
              {centerItem.address}
              <br />
              {centerItem.distance}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

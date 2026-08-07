import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapEvents({ position, onChange }) {
  const map = useMap();
  useMapEvents({ click: ({ latlng }) => onChange([latlng.lat, latlng.lng]) });
  if (position) map.panTo(position);
  return position ? <Marker position={position} /> : null;
}

export default function AddressMap({ position, onChange }) {
  const locate = () => navigator.geolocation.getCurrentPosition(
    ({ coords }) => onChange([coords.latitude, coords.longitude]),
    () => window.alert("No se pudo acceder al GPS. Marca el punto manualmente en el mapa."),
    { enableHighAccuracy: true, timeout: 10000 },
  );

  return <>
    <button type="button" className="btn btn-outline-primary mb-2" onClick={locate}>Usar mi ubicación GPS</button>
    <MapContainer center={position || [-12.0464, -77.0428]} zoom={15} style={{ height: 320, width: "100%" }}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapEvents position={position} onChange={onChange} />
    </MapContainer>
    <small className="text-muted">Usa el GPS y ajusta el marcador haciendo clic sobre el punto exacto de entrega.</small>
  </>;
}

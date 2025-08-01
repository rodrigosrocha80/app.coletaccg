import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para ícones padrão do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RouteMap = ({ points }) => {
  useEffect(() => {
    // Inicializar mapa
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <p>Adicione fornecedores à rota para ver o mapa</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={points[0] || [-23.5505, -46.6333]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((point, index) => (
        <Marker position={point} key={index} />
      ))}
      <Polyline positions={points} color="blue" />
    </MapContainer>
  );
};

export default RouteMap;
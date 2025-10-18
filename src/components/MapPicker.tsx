import { useState, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { reverseGeocode } from "@/lib/geocoding";
import { toast } from "sonner";

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

const MapPicker = ({ latitude = -23.5505, longitude = -46.6333, onLocationSelect }: MapPickerProps) => {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(() => {
    return localStorage.getItem("google_maps_api_key") || "";
  });
  const [markerPosition, setMarkerPosition] = useState({
    lat: latitude,
    lng: longitude,
  });

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey,
  });

  const handleTokenChange = (token: string) => {
    setGoogleMapsApiKey(token);
    localStorage.setItem("google_maps_api_key", token);
  };

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setMarkerPosition({ lat, lng });

      const address = await reverseGeocode(lat, lng);
      if (address) {
        onLocationSelect(lat, lng, address);
        toast.success("Localização selecionada");
      }
    },
    [onLocationSelect]
  );

  const handleMarkerDragEnd = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setMarkerPosition({ lat, lng });

      const address = await reverseGeocode(lat, lng);
      if (address) {
        onLocationSelect(lat, lng, address);
        toast.success("Localização atualizada");
      }
    },
    [onLocationSelect]
  );

  if (!googleMapsApiKey) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Para usar o mapa interativo, insira sua chave de API do Google Maps:
        </p>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="AIza..."
          value={googleMapsApiKey}
          onChange={(e) => handleTokenChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Obtenha sua chave gratuita em{" "}
          <a
            href="https://console.cloud.google.com/google/maps-apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Google Cloud Console
          </a>
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 border rounded-lg bg-destructive/10 text-destructive">
        Erro ao carregar o Google Maps. Verifique se a chave de API está correta.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[400px] rounded-lg border flex items-center justify-center bg-muted/50">
        <p className="text-sm text-muted-foreground">Carregando mapa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <GoogleMap
        mapContainerClassName="w-full h-[400px] rounded-lg border"
        center={markerPosition}
        zoom={13}
        onClick={handleMapClick}
      >
        <Marker
          position={markerPosition}
          draggable={true}
          onDragEnd={handleMarkerDragEnd}
        />
      </GoogleMap>
      <p className="text-xs text-muted-foreground">
        Clique no mapa ou arraste o marcador para selecionar a localização
      </p>
    </div>
  );
};

export default MapPicker;

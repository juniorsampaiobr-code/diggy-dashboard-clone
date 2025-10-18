import { useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { reverseGeocode } from "@/lib/geocoding";
import { toast } from "sonner";

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

const MapPicker = ({ latitude = -23.5505, longitude = -46.6333, onLocationSelect }: MapPickerProps) => {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState("");
  const [markerPosition, setMarkerPosition] = useState({ lat: latitude, lng: longitude });

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
    borderRadius: "0.5rem"
  };

  const center = {
    lat: latitude,
    lng: longitude
  };

  const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      setMarkerPosition({ lat, lng });
      
      const address = await reverseGeocode(lat, lng);
      if (address) {
        onLocationSelect(lat, lng, address);
        toast.success("Localização selecionada");
      }
    }
  }, [onLocationSelect]);

  const onMarkerDragEnd = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      setMarkerPosition({ lat, lng });
      
      const address = await reverseGeocode(lat, lng);
      if (address) {
        onLocationSelect(lat, lng, address);
        toast.success("Localização atualizada");
      }
    }
  }, [onLocationSelect]);

  if (!googleMapsApiKey) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Para usar o mapa interativo, insira sua chave de API do Google Maps:
        </p>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="AIzaSy..."
          value={googleMapsApiKey}
          onChange={(e) => setGoogleMapsApiKey(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Obtenha sua chave gratuita em{" "}
          <a
            href="https://console.cloud.google.com/google/maps-apis"
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

  return (
    <div className="space-y-2">
      <LoadScript googleMapsApiKey={googleMapsApiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          onClick={onMapClick}
        >
          <Marker
            position={markerPosition}
            draggable={true}
            onDragEnd={onMarkerDragEnd}
          />
        </GoogleMap>
      </LoadScript>
      <p className="text-xs text-muted-foreground">
        Clique no mapa ou arraste o marcador para selecionar a localização
      </p>
    </div>
  );
};

export default MapPicker;

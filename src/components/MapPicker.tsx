import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { reverseGeocode } from "@/lib/geocoding";
import { toast } from "sonner";

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

const MapPicker = ({ latitude = -23.5505, longitude = -46.6333, onLocationSelect }: MapPickerProps) => {
  const [mapboxToken, setMapboxToken] = useState(() => {
    return localStorage.getItem("mapbox_token") || "";
  });
  const [isMapLoading, setIsMapLoading] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const handleTokenChange = (token: string) => {
    setMapboxToken(token);
    localStorage.setItem("mapbox_token", token);
  };

  const handleMapClick = useCallback(async (e: mapboxgl.MapMouseEvent) => {
    const { lng, lat } = e.lngLat;
    
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    }
    
    const address = await reverseGeocode(lat, lng);
    if (address) {
      onLocationSelect(lat, lng, address);
      toast.success("Localização selecionada");
    }
  }, [onLocationSelect]);

  const handleMarkerDragEnd = useCallback(async () => {
    if (!marker.current) return;
    
    const lngLat = marker.current.getLngLat();
    const address = await reverseGeocode(lngLat.lat, lngLat.lng);
    
    if (address) {
      onLocationSelect(lngLat.lat, lngLat.lng, address);
      toast.success("Localização atualizada");
    }
  }, [onLocationSelect]);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    setIsMapLoading(true);
    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [longitude, latitude],
        zoom: 13,
      });

      map.current.on("load", () => {
        setIsMapLoading(false);
      });

      map.current.on("error", (e) => {
        console.error("Mapbox error:", e);
        setIsMapLoading(false);
        toast.error("Erro ao carregar o mapa. Verifique se o token está correto.");
      });

      marker.current = new mapboxgl.Marker({
        draggable: true,
      })
        .setLngLat([longitude, latitude])
        .addTo(map.current);

      map.current.on("click", handleMapClick);
      marker.current.on("dragend", handleMarkerDragEnd);
    } catch (error) {
      console.error("Erro ao inicializar o mapa:", error);
      setIsMapLoading(false);
      toast.error("Erro ao inicializar o mapa. Verifique seu token Mapbox.");
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, latitude, longitude, handleMapClick, handleMarkerDragEnd]);

  if (!mapboxToken) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Para usar o mapa interativo, insira seu token público do Mapbox:
        </p>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="pk.eyJ1..."
          value={mapboxToken}
          onChange={(e) => handleTokenChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Obtenha seu token gratuito em{" "}
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Mapbox
          </a>
          {" "}(50.000 carregamentos/mês grátis)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div ref={mapContainer} className="w-full h-[400px] rounded-lg border" />
        {isMapLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Clique no mapa ou arraste o marcador para selecionar a localização
      </p>
    </div>
  );
};

export default MapPicker;

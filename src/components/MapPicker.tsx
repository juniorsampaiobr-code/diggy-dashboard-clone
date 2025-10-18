import { useEffect, useRef, useState } from "react";
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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState("");

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if token is set
    if (!mapboxToken) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add initial marker
    marker.current = new mapboxgl.Marker({ draggable: true })
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    // Handle marker drag
    marker.current.on("dragend", async () => {
      const lngLat = marker.current!.getLngLat();
      const address = await reverseGeocode(lngLat.lat, lngLat.lng);
      if (address) {
        onLocationSelect(lngLat.lat, lngLat.lng, address);
        toast.success("Localização atualizada");
      }
    });

    // Handle map click
    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      
      marker.current?.setLngLat([lng, lat]);
      
      const address = await reverseGeocode(lat, lng);
      if (address) {
        onLocationSelect(lat, lng, address);
        toast.success("Localização selecionada");
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, latitude, longitude, onLocationSelect]);

  // Update marker position when props change
  useEffect(() => {
    if (marker.current && latitude && longitude) {
      marker.current.setLngLat([longitude, latitude]);
      map.current?.setCenter([longitude, latitude]);
    }
  }, [latitude, longitude]);

  if (!mapboxToken) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Para usar o mapa interativo, insira seu token público do Mapbox:
        </p>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="pk.eyJ1Ijo..."
          value={mapboxToken}
          onChange={(e) => setMapboxToken(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Obtenha seu token gratuito em{" "}
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            mapbox.com
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={mapContainer} className="w-full h-[400px] rounded-lg" />
      <p className="text-xs text-muted-foreground">
        Clique no mapa ou arraste o marcador para selecionar a localização
      </p>
    </div>
  );
};

export default MapPicker;

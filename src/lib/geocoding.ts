// Geocoding utilities using OpenStreetMap Nominatim API (free, no API key required)

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address.trim()) {
    return null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'StoreApp/1.0' // Nominatim requires a user agent
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    if (data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

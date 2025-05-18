/**
 * Geolocation and IP tracking utilities for secure authentication
 */
import { LocationData } from '@alive-human/shared';

/**
 * Get user's location data including IP and geolocation coordinates
 * @returns Promise that resolves to location data
 */
export async function getUserLocation(): Promise<LocationData> {
  // Get user's coordinates from browser API
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
  
  // Get IP and location data from IP geolocation service
  const ipResponse = await fetch('https://api.ipify.org?format=json');
  const ipData = await ipResponse.json();
  
  const geoResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
  const geoData = await geoResponse.json();
  
  return {
    ip: ipData.ip,
    coordinates: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    },
    country: geoData.country_name,
    region: geoData.region,
    city: geoData.city,
    isp: geoData.org,
    timezone: geoData.timezone,
    timestamp: Date.now()
  };
}

/**
 * Create a fallback location with only IP data if geolocation is denied
 * @returns Promise that resolves to partial location data
 */
export async function getFallbackLocation(): Promise<Partial<LocationData>> {
  try {
    // Get IP and location data from IP geolocation service
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    
    const geoResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
    const geoData = await geoResponse.json();
    
    return {
      ip: ipData.ip,
      country: geoData.country_name,
      region: geoData.region,
      city: geoData.city,
      isp: geoData.org,
      timezone: geoData.timezone,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error getting fallback location:', error);
    return {
      ip: 'unknown',
      country: 'unknown',
      timestamp: Date.now()
    };
  }
}

/**
 * Check if two locations are within a reasonable distance of each other
 * @param location1 First location
 * @param location2 Second location
 * @param maxDistanceKm Maximum distance in kilometers that's considered reasonable
 * @returns Boolean indicating if locations are within reasonable distance
 */
export function areLocationsReasonable(
  location1: LocationData,
  location2: LocationData,
  maxDistanceKm: number = 100
): boolean {
  // If either location doesn't have coordinates, compare by country
  if (!location1.coordinates || !location2.coordinates) {
    return location1.country === location2.country;
  }
  
  // Calculate distance between coordinates
  const distance = calculateDistance(
    location1.coordinates.latitude,
    location1.coordinates.longitude,
    location2.coordinates.latitude,
    location2.coordinates.longitude
  );
  
  return distance <= maxDistanceKm;
}

/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

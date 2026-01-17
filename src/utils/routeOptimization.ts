import type { Place } from "@/store/useTripStore";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type Coordinate = [number, number]; // [lng, lat]

/**
 * Calculate distance between two coordinates using Haversine formula (great circle distance)
 * Returns distance in meters
 */
export function calculateHaversineDistance(
  coord1: Coordinate,
  coord2: Coordinate
): number {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate distance matrix using Mapbox Matrix API (more accurate for routing)
 * Returns a 2D array where matrix[i][j] is the distance from place i to place j in meters
 */
export async function calculateDistanceMatrix(
  coordinates: Coordinate[],
  profile: "driving" | "walking" | "cycling" = "driving"
): Promise<number[][] | null> {
  if (coordinates.length < 2 || !MAPBOX_TOKEN) {
    return null;
  }

  try {
    // Mapbox Matrix API supports up to 25 coordinates per request
    if (coordinates.length > 25) {
      console.warn("Too many coordinates for Matrix API, using Haversine instead");
      return calculateHaversineMatrix(coordinates);
    }

    const coordinatesString = coordinates
      .map((coord) => `${coord[0]},${coord[1]}`)
      .join(";");

    const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/${profile}/${coordinatesString}?access_token=${MAPBOX_TOKEN}&annotations=distance,duration`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === "Ok" && data.distances) {
      return data.distances as number[][];
    }

    // Fallback to Haversine if API fails
    return calculateHaversineMatrix(coordinates);
  } catch (error) {
    console.error("Error calculating distance matrix:", error);
    // Fallback to Haversine
    return calculateHaversineMatrix(coordinates);
  }
}

/**
 * Calculate distance matrix using Haversine formula (fallback)
 */
function calculateHaversineMatrix(coordinates: Coordinate[]): number[][] {
  const n = coordinates.length;
  const matrix: number[][] = [];

  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = calculateHaversineDistance(
          coordinates[i],
          coordinates[j]
        );
      }
    }
  }

  return matrix;
}

/**
 * Optimize route using Nearest Neighbor algorithm (greedy approach)
 * Returns optimized order of place indices
 */
export function optimizeRouteNearestNeighbor(
  distanceMatrix: number[][],
  startIndex: number = 0
): number[] {
  const n = distanceMatrix.length;
  if (n <= 1) return [0];

  const visited = new Set<number>();
  const route: number[] = [startIndex];
  visited.add(startIndex);

  let current = startIndex;

  while (visited.size < n) {
    let nearest = -1;
    let minDistance = Infinity;

    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && distanceMatrix[current][i] < minDistance) {
        minDistance = distanceMatrix[current][i];
        nearest = i;
      }
    }

    if (nearest !== -1) {
      route.push(nearest);
      visited.add(nearest);
      current = nearest;
    } else {
      break;
    }
  }

  return route;
}

/**
 * Optimize route using 2-opt algorithm (improves on nearest neighbor)
 * Returns optimized order of place indices
 */
export function optimizeRoute2Opt(
  distanceMatrix: number[][],
  initialRoute: number[]
): number[] {
  const n = distanceMatrix.length;
  if (n <= 2) return initialRoute;

  let route = [...initialRoute];
  let improved = true;

  while (improved) {
    improved = false;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        // Calculate current distance
        const currentDistance =
          distanceMatrix[route[i]][route[i + 1]] +
          distanceMatrix[route[j]][route[(j + 1) % n]];

        // Calculate new distance after swapping
        const newDistance =
          distanceMatrix[route[i]][route[j]] +
          distanceMatrix[route[i + 1]][route[(j + 1) % n]];

        if (newDistance < currentDistance) {
          // Reverse the segment between i+1 and j
          const segment = route.slice(i + 1, j + 1).reverse();
          route = [
            ...route.slice(0, i + 1),
            ...segment,
            ...route.slice(j + 1),
          ];
          improved = true;
        }
      }
    }
  }

  return route;
}

/**
 * Calculate total distance for a route
 */
export function calculateRouteDistance(
  route: number[],
  distanceMatrix: number[][]
): number {
  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += distanceMatrix[route[i]][route[i + 1]];
  }
  return totalDistance;
}

/**
 * Main function to optimize places order
 * Returns optimized places array and total distance in meters
 */
export async function optimizePlacesOrder(
  places: Place[],
  profile: "driving" | "walking" | "cycling" = "driving"
): Promise<{
  optimizedPlaces: Place[];
  totalDistance: number; // in meters
  totalDuration?: number; // in seconds (if available from Matrix API)
} | null> {
  // Filter places with coordinates
  const placesWithCoords = places.filter(
    (place) =>
      typeof place.latitude === "number" && typeof place.longitude === "number"
  );

  if (placesWithCoords.length < 2) {
    return null;
  }

  // Extract coordinates
  const coordinates: Coordinate[] = placesWithCoords.map((place) => [
    place.longitude!,
    place.latitude!,
  ]);

  // Calculate distance matrix
  const distanceMatrix = await calculateDistanceMatrix(coordinates, profile);

  if (!distanceMatrix) {
    return null;
  }

  // Optimize route using nearest neighbor + 2-opt
  const initialRoute = optimizeRouteNearestNeighbor(distanceMatrix, 0);
  const optimizedRoute = optimizeRoute2Opt(distanceMatrix, initialRoute);

  // Reorder places according to optimized route
  const optimizedPlaces = optimizedRoute.map((index) => placesWithCoords[index]);

  // Add places without coordinates at the end (preserving their relative order)
  const placesWithoutCoords = places.filter(
    (place) =>
      typeof place.latitude !== "number" ||
      typeof place.longitude !== "number"
  );
  optimizedPlaces.push(...placesWithoutCoords);

  // Calculate total distance
  const totalDistance = calculateRouteDistance(optimizedRoute, distanceMatrix);

  return {
    optimizedPlaces,
    totalDistance,
  };
}

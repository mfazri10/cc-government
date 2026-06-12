"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchMapLocations(entityType?: string) {
  const params = new URLSearchParams();
  if (entityType) params.append("entity_type", entityType);

  const response = await fetch(
    `${API_URL}/api/v1/map/locations?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch map locations");
  }

  return response.json();
}

export async function fetchHeatmapData() {
  const response = await fetch(`${API_URL}/api/v1/map/heatmap-data`);

  if (!response.ok) {
    throw new Error("Failed to fetch heatmap data");
  }

  return response.json();
}

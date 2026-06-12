"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchAlertLogs(limit: number = 50) {
  const response = await fetch(
    `${API_URL}/api/v1/alerts/logs?limit=${limit}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch alert logs");
  }

  return response.json();
}

export async function fetchAlertConfig() {
  const response = await fetch(`${API_URL}/api/v1/alerts/config`);

  if (!response.ok) {
    throw new Error("Failed to fetch alert config");
  }

  return response.json();
}

export async function processAlerts() {
  const response = await fetch(`${API_URL}/api/v1/alerts/process`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to process alerts");
  }

  return response.json();
}

export async function testAlert(channel: string) {
  const response = await fetch(
    `${API_URL}/api/v1/alerts/test?channel=${channel}`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error("Failed to send test alert");
  }

  return response.json();
}

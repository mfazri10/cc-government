"use client";

import { useState, useEffect, useCallback } from "react";

interface AnalyticsSnapshot {
  timestamp: string;
  total_feedbacks: number;
  sentiment: {
    POSITIVE: number;
    NEGATIVE: number;
    NEUTRAL: number;
  };
  needs_attention: number;
  new_feedbacks?: number;
  unprocessed?: number;
}

export function useRealtimeAnalytics(apiUrl: string = "") {
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    const eventSource = new EventSource(`${apiUrl}/api/v1/realtime/stream`);

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as AnalyticsSnapshot;
        setData(parsed);
      } catch (e) {
        console.error("Failed to parse SSE data:", e);
      }
    };

    eventSource.onerror = (e) => {
      setConnected(false);
      setError("Connection lost. Reconnecting...");
      eventSource.close();

      // Reconnect after 3 seconds
      setTimeout(() => connect(), 3000);
    };

    return eventSource;
  }, [apiUrl]);

  useEffect(() => {
    const eventSource = connect();

    return () => {
      eventSource.close();
    };
  }, [connect]);

  return { data, connected, error };
}

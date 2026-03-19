"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Email } from "@/types";

type SSEEvent =
  | { type: "email:new"; data: Email }
  | { type: "email:deleted"; data: { id: string } }
  | { type: "emails:cleared"; data: { count: number } };

export function useEmailStream(onEvent: (event: SSEEvent) => void) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    const es = new EventSource("/api/events");

    es.addEventListener("connected", () => {
      setConnected(true);
    });

    es.addEventListener("email:new", (e) => {
      const data = JSON.parse(e.data);
      onEventRef.current({ type: "email:new", data });
    });

    es.addEventListener("email:deleted", (e) => {
      const data = JSON.parse(e.data);
      onEventRef.current({ type: "email:deleted", data });
    });

    es.addEventListener("emails:cleared", (e) => {
      const data = JSON.parse(e.data);
      onEventRef.current({ type: "emails:cleared", data });
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Retry after 3 seconds
      setTimeout(connect, 3000);
    };

    return es;
  }, []);

  useEffect(() => {
    const es = connect();
    return () => es.close();
  }, [connect]);

  return { connected };
}

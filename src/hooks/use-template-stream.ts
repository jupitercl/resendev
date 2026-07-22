"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Template } from "@/types";

type SSEEvent =
  | { type: "template:new"; data: Template }
  | { type: "template:updated"; data: Template }
  | { type: "template:deleted"; data: { id: string } };

export function useTemplateStream(onEvent: (event: SSEEvent) => void) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    const es = new EventSource("/api/events");

    es.addEventListener("connected", () => {
      setConnected(true);
    });

    es.addEventListener("template:new", (e) => {
      onEventRef.current({ type: "template:new", data: JSON.parse(e.data) });
    });

    es.addEventListener("template:updated", (e) => {
      onEventRef.current({ type: "template:updated", data: JSON.parse(e.data) });
    });

    es.addEventListener("template:deleted", (e) => {
      onEventRef.current({ type: "template:deleted", data: JSON.parse(e.data) });
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

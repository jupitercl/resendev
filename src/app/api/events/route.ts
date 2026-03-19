import { addClient, removeClient } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  let clientId: string;

  const stream = new ReadableStream({
    start(controller) {
      clientId = addClient(controller);

      // Send initial connection event
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ id: clientId })}\n\n`));
    },
    cancel() {
      removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

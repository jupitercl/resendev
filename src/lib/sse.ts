type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

const clients: SSEClient[] = [];

export function addClient(controller: ReadableStreamDefaultController): string {
  const id = crypto.randomUUID();
  clients.push({ id, controller });
  return id;
}

export function removeClient(id: string): void {
  const index = clients.findIndex((c) => c.id === id);
  if (index !== -1) {
    clients.splice(index, 1);
  }
}

export function broadcast(event: string, data: unknown): void {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(message);

  for (const client of clients) {
    try {
      client.controller.enqueue(encoded);
    } catch {
      // Client disconnected, will be cleaned up
    }
  }
}

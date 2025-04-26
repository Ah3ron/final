import { createServer } from 'http';
import { handler } from '$lib/server/handler.js';

// Create HTTP server
export const server = createServer(handler);

// Start the server if not imported elsewhere
if (import.meta.url === import.meta.main) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

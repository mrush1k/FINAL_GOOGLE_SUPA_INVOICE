WebSocket setup

This project has a small client WebSocket helper at `lib/websocket-client.ts` used by the invoices dashboard to receive live updates.

Recommended production setup

1. Run a dedicated WebSocket server (recommended):
   - Use a lightweight server (Node `ws`) or a managed service (Pusher, Ably, Supabase Realtime).
   - Accept connections at a stable URL (wss://your-ws.example.com).

2. Configure the client with an environment variable:
   - Set NEXT_PUBLIC_WS_URL to your WebSocket base URL (e.g. `wss://your-ws.example.com`).
   - In Vercel/Netlify, add `NEXT_PUBLIC_WS_URL` to environment variables.

3. Behavior in this repo:
   - If `NEXT_PUBLIC_WS_URL` is set the client will use that URL.
   - If not set and running on `localhost`, the client will fall back to `window.location.origin` for local testing.
   - If not set in production, the client will return `null` from `getWebSocketClient()` and the app will fallback to polling (no noisy connection attempts).

Local testing

- To test locally without a WS server:
  - Start the app normally (`npm run dev`). The invoices page will use enhanced polling instead of a WS server.

- To test with a local WS server:
  - Start a local WS server that listens on the same origin + `/api/websocket` or set `NEXT_PUBLIC_WS_URL` to point to your local server (e.g., `ws://localhost:8080`).

Notes

- Next.js API routes are not suitable for raw WebSocket servers. For production use a separate WS server or a managed realtime provider.
- The client now uses exponential backoff with jitter and rate-limited logging to avoid noisy reconnection logs.

If you want, I can add a simple example `ws` server script in `scripts/` for local testing.
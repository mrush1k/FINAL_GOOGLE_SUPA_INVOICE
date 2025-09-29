Local WebSocket testing
=======================

This project includes a lightweight WebSocket client used for real-time invoice updates. Next.js API routes do not support raw WebSockets, so for local testing you can run a small standalone WebSocket server.

1) Install dependencies (one-time):

```powershell
npm install ws --no-save
```

2) Create a small test server (example):

Create `scripts/ws-server.js` with this content:

```js
const WebSocket = require('ws')

const port = process.env.PORT || 8081
const wss = new WebSocket.Server({ port })

wss.on('connection', function connection(ws, req) {
  console.log('Client connected')

  ws.on('message', function incoming(message) {
    console.log('received: %s', message)
  })

  // Send a periodic test message
  const iv = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'invoice_update', data: { invoiceId: 'test', timestamp: new Date().toISOString() } }))
    }
  }, 5000)

  ws.on('close', () => clearInterval(iv))
})

console.log(`WebSocket test server running on ws://localhost:${port}`)
```

3) Run the test server:

```powershell
node scripts/ws-server.js
```

4) Configure the app to use the test server

Set the environment variable `NEXT_PUBLIC_WS_URL` to your test server URL. In development you can set this in a `.env.local` file:

```
NEXT_PUBLIC_WS_URL=http://localhost:8081
```

Note: The client converts http:// to ws:// and https:// to wss:// automatically.

5) Start the app and open the invoices page

```powershell
npm run dev
```

Open `/dashboard/invoices` and watch the browser console — you should see incoming `invoice_update` messages every 5 seconds from the test server.

If you don't want to run a test WS server, the client will gracefully fall back to polling and log a single warning when it does so.

That's it — short, standalone, and easy to test locally.

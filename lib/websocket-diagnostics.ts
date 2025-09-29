// Lightweight diagnostics/reporting helper for WebSocket client
// Tries to use existing diagnostic engine if available, otherwise falls back to console
export function reportWebsocketEvent(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
  try {
    // If an app-level reporting function is registered, use it
    const reporter = (globalThis as any).__REPORT_DIAGNOSTIC__
    if (typeof reporter === 'function') {
      reporter({ level, message, meta })
      return
    }
  } catch (e) {
    // ignore and fall back to console
  }

  // Fallback logging
  if (level === 'error') console.error('[WS]', message, meta)
  else if (level === 'warn') console.warn('[WS]', message, meta)
  else console.info('[WS]', message, meta)
}

export default { reportWebsocketEvent }

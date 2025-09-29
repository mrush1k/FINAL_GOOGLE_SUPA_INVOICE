"use client"

export interface WebSocketMessage {
  type: 'invoice_update' | 'email_tracking' | 'status_change'
  data: {
    invoiceId: string
    field?: string
    value?: any
    timestamp: string
  }
}

export class InvoiceWebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageHandlers: Map<string, (message: WebSocketMessage) => void> = new Map()

  constructor(url: string) {
    // Prefer explicit env config for production; fallback to provided url for dev
    const envUrl = typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_WS_URL
      || (typeof process !== 'undefined' ? (process.env as any).NEXT_PUBLIC_WS_URL : undefined)

    const base = envUrl || url
    this.url = base.replace('http://', 'ws://').replace('https://', 'wss://')
  }

  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.url}/api/websocket?userId=${userId}`)
        
        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          // Provide more context about close
          console.warn('WebSocket disconnected', { code: (event as CloseEvent).code, reason: (event as CloseEvent).reason })
          this.reconnect(userId)
        }

        this.ws.onerror = (event) => {
          // Log as a warning (network blips are common). Avoid rejecting here so callers
          // don't immediately disable WebSocket usage; allow onclose to trigger reconnect flow.
          try {
            console.warn('WebSocket error event:', event)
          } catch (e) {
            console.warn('WebSocket error (unknown event)')
          }
          // do not call reject here
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(message: WebSocketMessage) {
    // Broadcast to all registered handlers
    this.messageHandlers.forEach((handler, key) => {
      try {
        handler(message)
      } catch (error) {
        console.error(`Error in WebSocket handler ${key}:`, error)
      }
    })
  }

  private reconnect(userId: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.info('Max WebSocket reconnection attempts reached — will stop trying and fall back to polling')
      return
    }

    this.reconnectAttempts++
    // Exponential backoff with jitter, cap at 30s
    const base = this.reconnectDelay
    const exp = Math.pow(2, this.reconnectAttempts - 1)
    const jitter = Math.floor(Math.random() * 1000)
    const delay = Math.min(30000, base * exp) + jitter

    setTimeout(() => {
      console.warn(`Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} (delay ${delay}ms)`)
      this.connect(userId).catch(() => {
        console.warn(`WebSocket reconnection attempt ${this.reconnectAttempts} failed`)
      })
    }, delay)
  }

  subscribe(handlerId: string, handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.set(handlerId, handler)
  }

  unsubscribe(handlerId: string) {
    this.messageHandlers.delete(handlerId)
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.messageHandlers.clear()
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Global WebSocket instance
let wsClient: InvoiceWebSocketClient | null = null

export function getWebSocketClient(): InvoiceWebSocketClient | null {
  if (typeof window === 'undefined') return null
  // In production, avoid making blind ws connections if NEXT_PUBLIC_WS_URL is not set
  const envUrl = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_WS_URL || (process.env as any).NEXT_PUBLIC_WS_URL
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  if (!envUrl && !isDev) {
    // No websocket configured for production; return null so callers fall back to polling
    return null
  }

  if (!wsClient) {
    wsClient = new InvoiceWebSocketClient(window.location.origin)
  }

  return wsClient
}
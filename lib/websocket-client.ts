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
    this.url = url.replace('http://', 'ws://').replace('https://', 'wss://')
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

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.reconnect(userId)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
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
      console.error('Max WebSocket reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      console.log(`Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      this.connect(userId).catch(() => {
        console.error(`WebSocket reconnection attempt ${this.reconnectAttempts} failed`)
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
  
  if (!wsClient) {
    wsClient = new InvoiceWebSocketClient(window.location.origin)
  }
  
  return wsClient
}
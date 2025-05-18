/**
 * WebSocket client for real-time communication
 * 
 * This provides a standardized way to connect to WebSocket endpoints
 * with reconnection logic and event handling.
 */

/**
 * Configuration options for WebSocket connection
 */
export interface WebSocketClientOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  protocols?: string | string[];
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onReconnect?: (attempt: number) => void;
  onMaxReconnectAttemptsReached?: () => void;
}

/**
 * Status of the WebSocket connection
 */
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
  RECONNECTING = 'reconnecting',
}

/**
 * WebSocket client for real-time communication
 */
export class WebSocketClient {
  private url: string;
  private protocols?: string | string[];
  private socket: WebSocket | null = null;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts = 0;
  private reconnectTimeout: any = null;
  private status: ConnectionStatus = ConnectionStatus.CLOSED;
  private eventListeners: Map<string, Set<Function>> = new Map();
  
  // Default handlers from options
  private defaultHandlers: {
    onOpen?: (event: Event) => void;
    onMessage?: (event: MessageEvent) => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (event: Event) => void;
    onReconnect?: (attempt: number) => void;
    onMaxReconnectAttemptsReached?: () => void;
  };
  
  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.protocols = options.protocols;
    this.reconnectInterval = options.reconnectInterval || 3000; // 3 seconds
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    
    this.defaultHandlers = {
      onOpen: options.onOpen,
      onMessage: options.onMessage,
      onClose: options.onClose,
      onError: options.onError,
      onReconnect: options.onReconnect,
      onMaxReconnectAttemptsReached: options.onMaxReconnectAttemptsReached,
    };
  }
  
  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.socket && [WebSocket.CONNECTING, WebSocket.OPEN].includes(this.socket.readyState)) {
      return; // Already connecting or connected
    }
    
    this.status = ConnectionStatus.CONNECTING;
    this.socket = new WebSocket(this.url, this.protocols);
    
    this.socket.onopen = (event) => {
      this.status = ConnectionStatus.OPEN;
      this.reconnectAttempts = 0;
      this.emitEvent('open', event);
      if (this.defaultHandlers.onOpen) this.defaultHandlers.onOpen(event);
    };
    
    this.socket.onmessage = (event) => {
      this.emitEvent('message', event);
      if (this.defaultHandlers.onMessage) this.defaultHandlers.onMessage(event);
    };
    
    this.socket.onclose = (event) => {
      this.status = ConnectionStatus.CLOSED;
      this.emitEvent('close', event);
      if (this.defaultHandlers.onClose) this.defaultHandlers.onClose(event);
      
      // Don't reconnect if the close was intended or max attempts reached
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emitEvent('maxReconnectAttemptsReached');
        if (this.defaultHandlers.onMaxReconnectAttemptsReached) {
          this.defaultHandlers.onMaxReconnectAttemptsReached();
        }
      }
    };
    
    this.socket.onerror = (event) => {
      this.emitEvent('error', event);
      if (this.defaultHandlers.onError) this.defaultHandlers.onError(event);
    };
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (!this.socket) return;
    
    this.clearReconnectTimeout();
    this.status = ConnectionStatus.CLOSING;
    this.socket.close();
  }
  
  /**
   * Send a message to the WebSocket server
   * @param data Data to send
   * @returns Whether the message was sent
   */
  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      this.socket.send(data);
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }
  
  /**
   * Send a JSON message to the WebSocket server
   * @param data Object to serialize and send
   * @returns Whether the message was sent
   */
  public sendJson(data: any): boolean {
    try {
      return this.send(JSON.stringify(data));
    } catch (error) {
      console.error('Failed to serialize and send JSON message:', error);
      return false;
    }
  }
  
  /**
   * Get the current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }
  
  /**
   * Add an event listener
   * @param event Event name
   * @param callback Callback function
   */
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)?.add(callback);
  }
  
  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Callback function
   */
  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  /**
   * Remove all event listeners for an event
   * @param event Event name
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.status === ConnectionStatus.RECONNECTING) return;
    
    this.status = ConnectionStatus.RECONNECTING;
    this.reconnectAttempts++;
    
    this.emitEvent('reconnect', this.reconnectAttempts);
    if (this.defaultHandlers.onReconnect) {
      this.defaultHandlers.onReconnect(this.reconnectAttempts);
    }
    
    this.clearReconnectTimeout();
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }
  
  /**
   * Clear the reconnection timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  /**
   * Emit an event to all listeners
   * @param event Event name
   * @param args Arguments to pass to listeners
   */
  private emitEvent(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in ${event} event handler:`, error);
        }
      });
    }
  }
}

/**
 * Create a new WebSocket client instance
 * @param options Configuration options
 * @returns WebSocket client instance
 */
export function createWebSocketClient(options: WebSocketClientOptions): WebSocketClient {
  return new WebSocketClient(options);
}
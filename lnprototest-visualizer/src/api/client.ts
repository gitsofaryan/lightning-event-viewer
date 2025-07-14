import { webSocketService, MessageFlowEvent, SequenceEvent } from "./websocket";

export interface MessageResponse {
  messages: MessageFlowEvent[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Simplified WebSocket API Client - Connect establishes Lightning connection automatically
export const apiClient = {
  // Connect to WebSocket server (automatically establishes Lightning connection)
  async connectWebSocket(): Promise<void> {
    return webSocketService.connect();
  },

  // Connect to Lightning Network (happens automatically when WebSocket connects)
  async connectLightning(): Promise<void> {
    return webSocketService.connectLightning();
  },

  // Send raw message (auto-handles BOLT01 message types like ping->pong)
  async sendMessage(
    type: string,
    content: Record<string, unknown> = {}
  ): Promise<void> {
    return webSocketService.sendRawMessage(type, content);
  },

  // Check if WebSocket is connected
  isConnected(): boolean {
    return webSocketService.isSocketConnected();
  },

  // Disconnect WebSocket
  disconnect(): void {
    return webSocketService.disconnect();
  },

  // WebSocket event handlers
  onMessage(handler: (event: MessageFlowEvent) => void): () => void {
    return webSocketService.onMessage(handler);
  },

  onError(handler: (error: { error: string }) => void): () => void {
    return webSocketService.onError(handler);
  },

  onComplete(handler: () => void): () => void {
    return webSocketService.onComplete(handler);
  },

  onConnection(handler: (connected: boolean) => void): () => void {
    return webSocketService.onConnection(handler);
  },

  runSequence(events: SequenceEvent[]): void {
    return webSocketService.runSequence(events);
  },

  // Simplified connect method - just connects WebSocket and Lightning happens automatically
  async connect(): Promise<MessageResponse> {
    try {
      await this.connectWebSocket();
      return {
        messages: [
          {
            direction: "out" as const,
            event: "connected",
            data: {
              status: "connected",
              timestamp: Date.now(),
            },
            timestamp: Date.now(),
          },
        ],
      };
    } catch (error) {
      console.error("Error in connect:", error);
      throw error;
    }
  },

  // Legacy method for backward compatibility
  async runConnectSequence(): Promise<void> {
    // Now just connects - no separate sequence needed
    return this.connectWebSocket();
  },
};

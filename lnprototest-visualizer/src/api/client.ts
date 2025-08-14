import { webSocketService, MessageFlowEvent } from "./websocket";
import api from "./api";

export interface MessageResponse {
  messages: MessageFlowEvent[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// API Client for minimal endpoints
export const apiClient = {
  // Connect endpoint - runs basic connect sequence
  async connect(): Promise<MessageResponse> {
    try {
      const response = await api.runConnectSequence();
      return {
        messages: [
          {
            direction: "out" as const,
            event: "sequence_completed",
            data: {
              status: response.status,
              events_processed: response.events_processed,
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

  // Send raw message
  async sendMessage(
    type: string,
    content: Record<string, unknown> = {}
  ): Promise<MessageResponse> {
    try {
      const response = await api.sendMessage("send", "03", type);
      return {
        messages: [
          {
            direction: "out" as const,
            event: "message_sent",
            data: {
              type,
              content,
              status: response.status,
              events_processed: response.events_processed,
            },
            timestamp: Date.now(),
          },
        ],
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // WebSocket management
  async connectWebSocket(): Promise<void> {
    return webSocketService.connect();
  },

  async runConnectSequence(nodeId: string = "03"): Promise<void> {
    await api.runConnectSequence(nodeId);
  },

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
};

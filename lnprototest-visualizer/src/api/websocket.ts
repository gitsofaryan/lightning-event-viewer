import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./config";

export interface MessageFlowEvent {
  sequence_id?: string;
  step?: number;
  direction: "in" | "out";
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((event: MessageFlowEvent) => void)[] = [];
  private errorHandlers: ((error: { error: string }) => void)[] = [];
  private completeHandlers: (() => void)[] = [];
  private isConnected: boolean = false;

  public onMessage(handler: (event: MessageFlowEvent) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  public onError(handler: (error: { error: string }) => void): () => void {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter((h) => h !== handler);
    };
  }

  public onComplete(handler: () => void): () => void {
    this.completeHandlers.push(handler);
    return () => {
      this.completeHandlers = this.completeHandlers.filter(
        (h) => h !== handler
      );
    };
  }

  public async connect(): Promise<void> {
    try {
      if (this.isConnected && this.socket?.connected) {
        return;
      }

      // Connect to Socket.IO server
      this.socket = io(API_BASE_URL, {
        transports: ["websocket", "polling"],
        autoConnect: true,
      });

      // Remove any existing listeners before adding new ones
      this.socket.off("message");

      return new Promise((resolve, reject) => {
        if (!this.socket) return reject(new Error("Socket not initialized"));

        this.socket.on("connect", () => {
          console.log("Socket.IO connection established");
          this.isConnected = true;
          resolve();
        });

        // Listen for message events from backend
        this.socket.on("message", (data: MessageFlowEvent) => {
          console.log("Received message:", data);
          this.messageHandlers.forEach((handler) => handler(data));
        });
        this.socket.on("error", (error: { error: string }) => {
          console.error("Socket.IO error:", error);
          this.errorHandlers.forEach((handler) => handler(error));
        });

        this.socket.on("sequence_complete", (data: unknown) => {
          console.log("Sequence complete:", data);
          this.completeHandlers.forEach((handler) => handler());
        });

        this.socket.on("disconnect", () => {
          console.log("Socket.IO disconnected");
          this.isConnected = false;
        });

        this.socket.on("connect_error", (error: Error) => {
          console.error("Socket.IO connection error:", error);
          this.isConnected = false;
          reject(error);
        });
      });
    } catch (error) {
      console.error("Error connecting to Socket.IO:", error);
      this.isConnected = false;
      throw error;
    }
  }

  public async runConnect(_nodeId: string = "03"): Promise<void> {
    // This method is now just a wrapper for the main API
    // The actual HTTP call should be made through the main API
    console.log(
      "Use api.runConnectSequence() instead of webSocketService.runConnect()"
    );
    throw new Error("Use api.runConnectSequence() for HTTP calls");
  }

  public async sendRawMessage(
    _type: string,
    _content: Record<string, unknown> = {}
  ): Promise<void> {
    // This method is now just a wrapper for the main API
    // The actual HTTP call should be made through the main API
    console.log(
      "Use api.sendMessage() instead of webSocketService.sendRawMessage()"
    );
    throw new Error("Use api.sendMessage() for HTTP calls");
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

export const webSocketService = new WebSocketService();

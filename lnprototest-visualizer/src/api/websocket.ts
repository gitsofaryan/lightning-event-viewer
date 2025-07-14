import { io, Socket } from "socket.io-client";

const API_BASE_URL = "http://localhost:5000";

export interface MessageFlowEvent {
  sequence_id?: string;
  step?: number;
  direction: "in" | "out" | "meta";
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export type SequenceEvent =
  | { type: "connect"; connprivkey?: string }
  | { type: "send"; msg_name: string; connprivkey?: string }
  | { type: "expect"; msg_name: string; connprivkey?: string }
  | { type: "disconnect"; connprivkey?: string }
  | { type: "done" };

interface WebSocketMessage {
  direction: "in" | "out" | "meta";
  msg_name: string;
  payload: {
    time: number;
    [key: string]: unknown;
  };
}

interface WebSocketDoneMessage {
  status: string;
  time: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((event: MessageFlowEvent) => void)[] = [];
  private errorHandlers: ((error: { error: string }) => void)[] = [];
  private completeHandlers: (() => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];
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

  public onConnection(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(
        (h) => h !== handler
      );
    };
  }

  public async connect(): Promise<void> {
    try {
      if (this.isConnected && this.socket?.connected) {
        return;
      }

      this.socket = io(API_BASE_URL, {
        transports: ["websocket", "polling"],
        autoConnect: true,
      });

      return new Promise((resolve, reject) => {
        if (!this.socket) return reject(new Error("Socket not initialized"));

        this.socket.on("connect", () => {
          console.log("Socket.IO connection established");
          this.isConnected = true;
          this.connectionHandlers.forEach((handler) => handler(true));
          resolve();
        });

        // Handle Lightning Network protocol messages
        this.socket.on("message", (data: WebSocketMessage) => {
          console.log("Lightning message event:", data);
          const event: MessageFlowEvent = {
            direction: data.direction,
            event: data.msg_name,
            data: data.payload,
            timestamp: data.payload.time,
          };
          this.messageHandlers.forEach((handler) => handler(event));
        });

        this.socket.on("done", (data: WebSocketDoneMessage) => {
          console.log("Operation completed:", data);
          const event: MessageFlowEvent = {
            direction: "out",
            event: "done",
            data: { ...data },
            timestamp: data.time,
          };
          this.messageHandlers.forEach((handler) => handler(event));

          // Call complete handlers if sequence is complete
          if (data.status === "complete") {
            this.completeHandlers.forEach((handler) => handler());
          }
        });

        this.socket.on("error", (error: { error: string }) => {
          console.error("Lightning protocol error:", error);
          this.errorHandlers.forEach((handler) => handler(error));
        });

        this.socket.on("disconnect", () => {
          console.log("Socket.IO disconnected");
          this.isConnected = false;
          this.connectionHandlers.forEach((handler) => handler(false));
        });

        this.socket.on("connect_error", (error: Error) => {
          console.error("Socket.IO connection error:", error);
          this.isConnected = false;
          this.connectionHandlers.forEach((handler) => handler(false));
          reject(error);
        });
      });
    } catch (error) {
      console.error("Error connecting to Socket.IO:", error);
      this.isConnected = false;
      this.connectionHandlers.forEach((handler) => handler(false));
      throw error;
    }
  }

  // Establish Lightning Network connection
  public async connectLightning(connprivkey?: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error("WebSocket not connected");
    }

    console.log("Connecting to Lightning Network...");
    this.runSequence([{ type: "connect", connprivkey: connprivkey || "02" }]);
  }

  // Send raw message
  public async sendRawMessage(
    type: string,
    connprivkey?: string
  ): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error("WebSocket not connected");
    }

    console.log("Sending raw message:", { type });
    this.runSequence([
      {
        type: "send",
        msg_name: type,
        connprivkey: connprivkey || "02",
      },
    ]);
  }

  public runSequence(events: SequenceEvent[]): void {
    if (!this.socket?.connected) {
      throw new Error("WebSocket not connected");
    }
    this.socket.emit("sequence", events);
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.connectionHandlers.forEach((handler) => handler(false));
  }
}

export const webSocketService = new WebSocketService();

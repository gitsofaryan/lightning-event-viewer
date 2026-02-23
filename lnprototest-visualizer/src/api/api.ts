import { webSocketService } from "./websocket";
import { API_BASE_URL } from "./config";

// Backend expects these exact formats:
export interface BackendEvent {
  type: "connect" | "send" | "expect" | "disconnect";
  connprivkey?: string;
  msg?: {
    type: string;
    connprivkey: string;
  };
  is_housekeeping?: boolean;
}

export interface SequenceEvent {
  type: "connect" | "send" | "expect" | "disconnect";
  connprivkey: string;
  msg_name?: string;
  is_housekeeping?: boolean;
}

export interface SequenceResponse {
  status: string;
  events_processed: number;
  error?: string;
}

// Convert frontend format to backend format
const convertToBackendFormat = (events: SequenceEvent[]): BackendEvent[] => {
  return events
    .map((event) => {
      if (event.type === "connect" || event.type === "disconnect") {
        return {
          type: event.type,
          connprivkey: event.connprivkey,
          is_housekeeping: event.is_housekeeping
        };
      } else if (event.type === "send" || event.type === "expect") {
        return {
          type: event.type,
          msg: {
            type: event.msg_name || "init",
            connprivkey: event.connprivkey,
          },
          is_housekeeping: event.is_housekeeping
        };
      }
      return null;
    })
    .filter(Boolean) as BackendEvent[];
};

const api = {
  // Main sequence endpoint - converts format for backend
  runSequence: (events: SequenceEvent[]): Promise<SequenceResponse> => {
    const backendEvents = convertToBackendFormat(events);

    return fetch(`${API_BASE_URL}/sequence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendEvents),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      return data;
    });
  },

  // WebSocket connection management
  connectWebSocket: () => webSocketService.connect(),

  // Helper method to run a basic connect sequence
  runConnectSequence: (nodeId: string = "03") => {
    const events: SequenceEvent[] = [
      { type: "connect", connprivkey: nodeId },
      { type: "send", connprivkey: nodeId, msg_name: "init" },
    ];
    return api.runSequence(events);
  },

  // Helper method to send a single message or dynamic protocol sequence
  sendMessage: (
    type: "send" | "connect",
    connprivkey: string = "03",
    msg_name?: string
  ) => {
    let events: SequenceEvent[];

    if (type === "send" && msg_name) {
      // Dynamic Protocol Sequences: If there is an expected response, we build an array
      // of Send -> Expect to validate BOLT #1 interactions locally.
      events = [
        { type: "connect", connprivkey, is_housekeeping: true },
        { type: "send", connprivkey, msg_name },
      ];

      // Native Ping -> Pong expectation
      if (msg_name === "ping") {
        events.push({ type: "expect", connprivkey, msg_name: "pong" });
      }
      // Add more dynamic expectations here if needed in the future
      
    } else {
      events = [{ type, connprivkey, msg_name }];
    }

    return api.runSequence(events);
  },

  // Custom events - for sending raw backend format
  runCustomEvents: (events: BackendEvent[]): Promise<SequenceResponse> => {
    return fetch(`${API_BASE_URL}/sequence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(events),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      return data;
    });
  },

  disconnect: () => webSocketService.disconnect(),
};

export default api;

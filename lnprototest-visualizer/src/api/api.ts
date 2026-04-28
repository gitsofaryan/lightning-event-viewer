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
  content?: Record<string, unknown>;
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
            content: event.content || {}
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
      { type: "connect", connprivkey: nodeId, is_housekeeping: true },
      { type: "send", connprivkey: nodeId, msg_name: "init", is_housekeeping: false },
      { type: "expect", connprivkey: nodeId, msg_name: "init", is_housekeeping: false },
    ];

    return api.runSequence(events);
  },



  // Helper method to send a single message or dynamic protocol sequence
  sendMessage: (
    type: "send" | "connect",
    connprivkey: string = "03",
    msg_name?: string,
    content: Record<string, unknown> = {}
  ) => {
    let events: any[];

    if (type === "send" && msg_name) {
      // Dynamic Protocol Sequences: If there is an expected response, we build an array
      // of Send -> Expect to validate BOLT #1 interactions locally.
      events = [
        { type: "connect", connprivkey, is_housekeeping: true },
        { type: "send", connprivkey, msg_name, content },
      ];

      // Native Ping -> Pong expectation
      if (msg_name === "ping") {
        events.push({ type: "expect", connprivkey, msg_name: "pong" });
      } else if (msg_name === "open_channel") {
        events.push({ type: "expect", connprivkey, msg_name: "accept_channel" });
      } else if (msg_name === "funding_created") {
        events.push({ type: "expect", connprivkey, msg_name: "funding_signed" });
      } else if (msg_name === "commitment_signed") {
        events.push({ type: "expect", connprivkey, msg_name: "revoke_and_ack" });
      }
    } else {
      events = [{ type, connprivkey, msg_name, content }];
    }

    return api.runSequence(events as any);
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
  
  // Heartbeat endpoint to keep connection alive
  heartbeat: () => {
    return fetch(`${API_BASE_URL}/heartbeat`)
      .then(res => res.json())
      .catch(err => {
        console.warn("Heartbeat failed", err);
        throw err;
      });
  }
};


export default api;

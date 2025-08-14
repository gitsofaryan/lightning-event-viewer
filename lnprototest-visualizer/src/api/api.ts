import { webSocketService } from "./websocket";

const API_BASE_URL = "https://lightning-event-viewer-4.onrender.com";

export interface SequenceEvent {
  type: "connect" | "send" | "expect" | "disconnect";
  connprivkey: string;
  msg_name?: string;
}

export interface SequenceRequest {
  events: SequenceEvent[];
}

export interface SequenceResponse {
  status: string;
  events_processed: number;
}

const validateEvents = (events: SequenceEvent[]): true | string => {
  for (const e of events) {
    if (!e.type || !e.connprivkey) return `Event missing type or connprivkey: ${JSON.stringify(e)}`;
    if ((e.type === "send" || e.type === "expect") && !e.msg_name) return `Event of type '${e.type}' missing msg_name: ${JSON.stringify(e)}`;
  }
  return true;
};

const api = {
  // Main sequence endpoint - accepts array of events
  runSequence: (events: SequenceEvent[]) => {
    const valid = validateEvents(events);
    if (valid !== true) {
      return Promise.reject(new Error(valid));
    }
    return fetch(`${API_BASE_URL}/sequence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(events),
    }).then((res) => res.json() as Promise<SequenceResponse>);
  },

  // WebSocket connection management
  connectWebSocket: () => webSocketService.connect(),

  // Helper method to run a basic connect sequence
  runConnectSequence: (nodeId: string = "03") => {
    const events: SequenceEvent[] = [
      { type: "connect", connprivkey: nodeId },
      { type: "send", connprivkey: nodeId, msg_name: "init" },
      { type: "expect", connprivkey: nodeId, msg_name: "init" },
    ];
    return api.runSequence(events);
  },
  // Helper method to send a single message
  sendMessage: (
    type: string,
    connprivkey: string = "03",
    msg_name?: string
  ) => {
    const events: SequenceEvent[] = [
      { type: type as any, connprivkey, msg_name },
    ];
    return api.runSequence(events);
  },

  disconnect: () => webSocketService.disconnect(),
};

export default api;

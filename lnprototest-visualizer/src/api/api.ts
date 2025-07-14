// Legacy HTTP API - Now replaced with WebSocket-only communication
// This file is kept for reference but is no longer used

export interface ConnectRequest {
  node_id?: string;
}

export interface RawMessageRequest {
  type: string;
  content?: Record<string, unknown>;
}

export interface ConnectResponse {
  status: string;
  sequence_id: string;
  node_id: string;
  steps_completed: number;
}

export interface RawMessageResponse {
  status: string;
  message_type: string;
  content: Record<string, unknown>;
}

// NOTE: All API calls are now handled via WebSocket in client.ts
// This file is deprecated and will be removed in future versions

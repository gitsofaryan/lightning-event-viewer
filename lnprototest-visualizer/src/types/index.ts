// Node Types
export type NodeType = "runner" | "ldk";

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  position: {
    x: number;
    y: number;
  };
}

// Message Types - Complete BOLT #1 specification
export type MessageType =
  // Setup & Control (types 0-31)
  | "init" // 16
  | "error" // 17
  | "warning" // 1
  | "ping" // 18
  | "pong" // 19
  | "peer_storage" // 7
  | "peer_storage_retrieval" // 9

  // Channel (types 32-127)
  | "open_channel" // 32
  | "accept_channel" // 33
  | "funding_created" // 34
  | "funding_signed" // 35
  | "channel_ready" // 36
  | "shutdown" // 38
  | "closing_signed" // 39

  // Commitment (types 128-255)
  | "update_add_htlc" // 128
  | "update_fulfill_htlc" // 130
  | "update_fail_htlc" // 131
  | "commitment_signed" // 132
  | "revoke_and_ack" // 133
  | "update_fee" // 134
  | "update_fail_malformed_htlc" // 135

  // Routing (types 256-511)
  | "channel_announcement" // 256
  | "node_announcement" // 257
  | "channel_update" // 258
  | "query_short_channel_ids" // 261
  | "reply_short_channel_ids_end" // 262
  | "query_channel_range" // 263
  | "reply_channel_range"; // 264

export interface Message {
  id: string;
  type: MessageType;
  name: string;
  description: string;
  category: MessageCategory;
  payload?: Record<string, unknown>;
}

export type MessageCategory =
  | "connection"
  | "channel"
  | "commitment"
  | "routing"
  | "misc";

// Connection States
export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

// Message Log
export interface MessageLog {
  id: string;
  timestamp: number;
  source: NodeType;
  target: NodeType;
  message: Message;
  status: "sent" | "received" | "error";
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Flask API Types
export interface FlaskNode {
  id: string;
  privkey: string;
  pubkey: string;
  state: string;
  type: string;
}

export interface FlaskConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  state: string;
}

export interface FlaskMessage {
  id: string;
  connectionId: string;
  content: {
    features: string;
    globalfeatures: string;
  };
  direction: "sent" | "received";
  status: string;
  timestamp: number;
  type: string;
}

export interface MessageFlowType {
  id: string;
  direction: "sent" | "received";
  type: MessageType;
  status: "pending" | "success" | "error";
}

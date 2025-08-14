import { Message } from "../types";

export const defaultMessages: Message[] = [
  // Setup & Control Messages (types 0-31)
  {
    id: "msg-init",
    type: "init",
    name: "Init (16)",
    description: "First message reveals features supported by this node",
    category: "connection",
    payload: {
      gflen: 0,
      globalfeatures: "00",
      flen: 2,
      features: "2082",
    },
  },
  {
    id: "msg-error",
    type: "error",
    name: "Error (17)",
    description: "Reports an error for a specific channel or all channels",
    category: "connection",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      len: 15,
      data: "Protocol error",
    },
  },
  {
    id: "msg-warning",
    type: "warning",
    name: "Warning (1)",
    description: "Reports a warning that allows recovery",
    category: "connection",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      len: 12,
      data: "Minor warning",
    },
  },
  {
    id: "msg-ping",
    type: "ping",
    name: "Ping (18)",
    description: "Keepalive message to check connection liveness",
    category: "connection",
    payload: {
      num_pong_bytes: 0,
      byteslen: 0,
      ignored: "",
    },
  },
  {
    id: "msg-pong",
    type: "pong",
    name: "Pong (19)",
    description: "Response to ping message",
    category: "connection",
    payload: {
      byteslen: 0,
      ignored: "",
    },
  },
  {
    id: "msg-peer-storage",
    type: "peer_storage",
    name: "Peer Storage (7)",
    description: "Request peer to store encrypted backup data",
    category: "connection",
    payload: {
      length: 32,
      blob: "0000000000000000000000000000000000000000000000000000000000000000",
    },
  },
  {
    id: "msg-peer-storage-retrieval",
    type: "peer_storage_retrieval",
    name: "Peer Storage Retrieval (9)",
    description: "Return stored data to peer after reconnection",
    category: "connection",
    payload: {
      length: 32,
      blob: "0000000000000000000000000000000000000000000000000000000000000000",
    },
  },

  // Channel Messages (types 32-127)
  {
    id: "msg-open-channel",
    type: "open_channel",
    name: "Open Channel (32)",
    description: "Initiate opening of a payment channel",
    category: "channel",
    payload: {
      chain_hash:
        "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
      temporary_channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      funding_satoshis: 100000,
      push_msat: 0,
      dust_limit_satoshis: 546,
      max_htlc_value_in_flight_msat: 100000000,
      channel_reserve_satoshis: 1000,
      htlc_minimum_msat: 1,
      feerate_per_kw: 253,
      to_self_delay: 144,
      max_accepted_htlcs: 483,
      funding_pubkey:
        "023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb",
      revocation_basepoint:
        "0212a140cd0c6539d07cd08dfe09984dec3251ea808b892efeac3ede9402bf2b19",
      payment_basepoint:
        "0292df73e0d6647aa1e2f30059902142bc357da7f1e3241906d4e5e7cbd36d7db9",
      delayed_payment_basepoint:
        "0392e8bee4d50c5eb98e3aeaf6749b5493becdc7f6bfd607d27f20f7b268bb48a9",
      htlc_basepoint:
        "0391b6348b50c1740f4def4013553895ed20da97c5b036701aee9e922a5b5c31d4",
      first_per_commitment_point:
        "02466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f27",
      channel_flags: 1,
    },
  },
  {
    id: "msg-accept-channel",
    type: "accept_channel",
    name: "Accept Channel (33)",
    description: "Accept channel opening proposal",
    category: "channel",
    payload: {
      temporary_channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      dust_limit_satoshis: 546,
      max_htlc_value_in_flight_msat: 100000000,
      channel_reserve_satoshis: 1000,
      htlc_minimum_msat: 1,
      minimum_depth: 3,
      to_self_delay: 144,
      max_accepted_htlcs: 483,
      funding_pubkey:
        "023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb",
      revocation_basepoint:
        "0212a140cd0c6539d07cd08dfe09984dec3251ea808b892efeac3ede9402bf2b19",
      payment_basepoint:
        "0292df73e0d6647aa1e2f30059902142bc357da7f1e3241906d4e5e7cbd36d7db9",
      delayed_payment_basepoint:
        "0392e8bee4d50c5eb98e3aeaf6749b5493becdc7f6bfd607d27f20f7b268bb48a9",
      htlc_basepoint:
        "0391b6348b50c1740f4def4013553895ed20da97c5b036701aee9e922a5b5c31d4",
      first_per_commitment_point:
        "02466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f27",
    },
  },
  {
    id: "msg-funding-created",
    type: "funding_created",
    name: "Funding Created (34)",
    description: "Provides funding transaction info",
    category: "channel",
    payload: {
      temporary_channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      funding_txid:
        "0000000000000000000000000000000000000000000000000000000000000000",
      funding_output_index: 0,
      signature: "304402203ad...",
    },
  },
  {
    id: "msg-funding-signed",
    type: "funding_signed",
    name: "Funding Signed (35)",
    description: "Provides signature for funding transaction",
    category: "channel",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      signature: "3044022001...",
    },
  },
  {
    id: "msg-channel-ready",
    type: "channel_ready",
    name: "Channel Ready (36)",
    description: "Channel is ready for payments",
    category: "channel",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      next_per_commitment_point:
        "02466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f27",
    },
  },
  {
    id: "msg-shutdown",
    type: "shutdown",
    name: "Shutdown (38)",
    description: "Initiate channel closure",
    category: "channel",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      len: 22,
      scriptpubkey: "0014123456789abcdef...",
    },
  },
  {
    id: "msg-closing-signed",
    type: "closing_signed",
    name: "Closing Signed (39)",
    description: "Signature for closing transaction",
    category: "channel",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      fee_satoshis: 253,
      signature: "3044022002...",
    },
  },

  // Commitment Messages (types 128-255)
  {
    id: "msg-update-add-htlc",
    type: "update_add_htlc",
    name: "Update Add HTLC (128)",
    description: "Add a new HTLC to the commitment transaction",
    category: "commitment",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      id: 0,
      amount_msat: 1000000,
      payment_hash:
        "0000000000000000000000000000000000000000000000000000000000000000",
      cltv_expiry: 500000,
      onion_routing_packet: "0002...",
    },
  },
  {
    id: "msg-update-fulfill-htlc",
    type: "update_fulfill_htlc",
    name: "Update Fulfill HTLC (130)",
    description: "Fulfill an HTLC with the payment preimage",
    category: "commitment",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      id: 0,
      payment_preimage:
        "0000000000000000000000000000000000000000000000000000000000000000",
    },
  },
  {
    id: "msg-update-fail-htlc",
    type: "update_fail_htlc",
    name: "Update Fail HTLC (131)",
    description: "Fail an HTLC with an error reason",
    category: "commitment",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      id: 0,
      len: 32,
      reason:
        "0000000000000000000000000000000000000000000000000000000000000000",
    },
  },
  {
    id: "msg-commitment-signed",
    type: "commitment_signed",
    name: "Commitment Signed (132)",
    description: "Signature for new commitment transaction",
    category: "commitment",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      signature: "3044022003...",
      num_htlcs: 0,
      htlc_signature: [],
    },
  },
  {
    id: "msg-revoke-and-ack",
    type: "revoke_and_ack",
    name: "Revoke and ACK (133)",
    description: "Revoke old commitment and acknowledge new one",
    category: "commitment",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      per_commitment_secret:
        "0000000000000000000000000000000000000000000000000000000000000000",
      next_per_commitment_point:
        "02466d7fcae563e5cb09a0d1870bb580344804617879a14949cf22285f1bae3f27",
    },
  },
  {
    id: "msg-update-fee",
    type: "update_fee",
    name: "Update Fee (134)",
    description: "Update the commitment transaction fee",
    category: "commitment",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      feerate_per_kw: 253,
    },
  },
  {
    id: "msg-update-fail-malformed-htlc",
    type: "update_fail_malformed_htlc",
    name: "Update Fail Malformed HTLC (135)",
    description: "Fail a malformed HTLC",
    category: "commitment",
    payload: {
      channel_id:
        "0000000000000000000000000000000000000000000000000000000000000000",
      id: 0,
      sha256_of_onion:
        "0000000000000000000000000000000000000000000000000000000000000000",
      failure_code: 0x4000,
    },
  },

  // Routing Messages (types 256-511)
  {
    id: "msg-channel-announcement",
    type: "channel_announcement",
    name: "Channel Announcement (256)",
    description: "Announce a new channel to the network",
    category: "routing",
    payload: {
      node_signature_1: "3044022004...",
      node_signature_2: "3044022005...",
      bitcoin_signature_1: "3044022006...",
      bitcoin_signature_2: "3044022007...",
      len: 70,
      features: "00",
      chain_hash:
        "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
      short_channel_id: "0x0123456789abcdef",
      node_id_1:
        "023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb",
      node_id_2:
        "0212a140cd0c6539d07cd08dfe09984dec3251ea808b892efeac3ede9402bf2b19",
      bitcoin_key_1:
        "0292df73e0d6647aa1e2f30059902142bc357da7f1e3241906d4e5e7cbd36d7db9",
      bitcoin_key_2:
        "0392e8bee4d50c5eb98e3aeaf6749b5493becdc7f6bfd607d27f20f7b268bb48a9",
    },
  },
  {
    id: "msg-node-announcement",
    type: "node_announcement",
    name: "Node Announcement (257)",
    description: "Announce node and its services",
    category: "routing",
    payload: {
      signature: "3044022008...",
      flen: 0,
      features: "00",
      timestamp: Math.floor(Date.now() / 1000),
      node_id:
        "023da092f6980e58d2c037173180e9a465476026ee50f96695963e8efe436f54eb",
      rgb_color: "ff0000",
      alias: "my-lightning-node",
      addrlen: 7,
      addresses: "0127.0.0.1:9735",
    },
  },
  {
    id: "msg-channel-update",
    type: "channel_update",
    name: "Channel Update (258)",
    description: "Update channel routing policy",
    category: "routing",
    payload: {
      signature: "3044022009...",
      chain_hash:
        "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
      short_channel_id: "0x0123456789abcdef",
      timestamp: Math.floor(Date.now() / 1000),
      message_flags: 1,
      channel_flags: 0,
      cltv_expiry_delta: 144,
      htlc_minimum_msat: 1,
      fee_base_msat: 1000,
      fee_proportional_millionths: 100,
      htlc_maximum_msat: 100000000,
    },
  },
  {
    id: "msg-query-short-channel-ids",
    type: "query_short_channel_ids",
    name: "Query Short Channel IDs (261)",
    description: "Query information about specific channels",
    category: "routing",
    payload: {
      chain_hash:
        "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
      len: 8,
      encoded_short_ids: "0123456789abcdef",
    },
  },
  {
    id: "msg-reply-short-channel-ids-end",
    type: "reply_short_channel_ids_end",
    name: "Reply Short Channel IDs End (262)",
    description: "End of query short channel IDs response",
    category: "routing",
    payload: {
      chain_hash:
        "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
      complete: 1,
    },
  },
  {
    id: "msg-query-channel-range",
    type: "query_channel_range",
    name: "Query Channel Range (263)",
    description: "Query channels in a block range",
    category: "routing",
    payload: {
      chain_hash:
        "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
      first_blocknum: 500000,
      number_of_blocks: 1000,
    },
  },
  {
    id: "msg-reply-channel-range",
    type: "reply_channel_range",
    name: "Reply Channel Range (264)",
    description: "Response to query channel range",
    category: "routing",
    payload: {
      chain_hash:
        "6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000",
      first_blocknum: 500000,
      number_of_blocks: 1000,
      complete: 1,
      len: 8,
      encoded_short_ids: "0123456789abcdef",
    },
  },
];

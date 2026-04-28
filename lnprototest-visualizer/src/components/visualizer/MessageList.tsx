import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { apiClient } from '../../api/client';
import { Eye, EyeOff, Search, Send, X, Plus, Terminal, Play, Trash2, ShieldCheck } from 'lucide-react';

const MessageList: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState("handshake");
  const [pendingSequence, setPendingSequence] = useState<any[]>([]);
  const [customEventJson, setCustomEventJson] = useState('[\n  {\n    "type": "send",\n    "msg_name": "ping",\n    "content": {\n      "num_pong_bytes": 1,\n      "ignored": "00"\n    }\n  }\n]');

  const messageCategories = {
    handshake: [
      { name: 'init', type: 'Handshake', description: 'Initialize connection/exchange features.' },
      { name: 'error', type: 'Global', description: 'Protocol error & termination.' },
      { name: 'ping', type: 'Control', description: 'Check peer vitality.' },
      { name: 'pong', type: 'Control', description: 'Respond to ping.' },
    ],
    channel: [
      { name: 'open_channel', type: 'Setup', description: 'Initiate channel opening.' },
      { name: 'accept_channel', type: 'Setup', description: 'Accept channel request.' },
      { name: 'funding_created', type: 'Setup', description: 'Funding transaction created.' },
      { name: 'funding_signed', type: 'Setup', description: 'Funding transaction signed.' },
      { name: 'funding_locked', type: 'Setup', description: 'Funding transaction locked.' },
      { name: 'shutdown', type: 'Close', description: 'Initiate channel shutdown.' },
      { name: 'closing_signed', type: 'Close', description: 'Signed closing transaction.' },
    ],
    payments: [
      { name: 'update_add_htlc', type: 'HTLC', description: 'Add a new HTLC to the commitment.' },
      { name: 'update_fulfill_htlc', type: 'HTLC', description: 'Fulfill an existing HTLC.' },
      { name: 'update_fail_htlc', type: 'HTLC', description: 'Fail an existing HTLC.' },
      { name: 'commitment_signed', type: 'HTLC', description: 'Sign the new commitment state.' },
      { name: 'revoke_and_ack', type: 'HTLC', description: 'Revoke old commitment state.' },
    ],
    gossip: [
      { name: 'channel_announcement', type: 'Gossip', description: 'Announce a new channel.' },
      { name: 'node_announcement', type: 'Gossip', description: 'Announce node URI/features.' },
      { name: 'channel_update', type: 'Gossip', description: 'Update channel parameters.' },
      { name: 'query_short_channel_ids', type: 'Gossip', description: 'Query for specific channels.' },
      { name: 'reply_short_channel_ids_end', type: 'Gossip', description: 'End of channel query reply.' },
    ]
  };

  const handleSendInstant = (msgName: string) => {
    const availableMsgs = useStore.getState().availableMessages;
    const msgDef = availableMsgs.find(m => m.type === msgName || m.id === msgName);
    useStore.getState().sendMessage(msgName, msgDef?.content || {});
  };

  const addToSequence = (msgName: string, type: 'send' | 'expect' = 'send') => {
    const availableMsgs = useStore.getState().availableMessages;
    const msgDef = availableMsgs.find(m => m.type === msgName || m.id === msgName);
    setPendingSequence([...pendingSequence, { type, msg_name: msgName, content: msgDef?.content || {} }]);
  };

  const executeSequence = () => {
    if (pendingSequence.length === 0) return;
    const finalSequence = [
      { type: 'connect', connprivkey: '03', is_housekeeping: true },
      ...pendingSequence
    ];
    apiClient.runSequence(finalSequence as any);
    setPendingSequence([]);
  };

  const handleSendCustom = () => {
    try {
      const events = JSON.parse(customEventJson);
      apiClient.runSequence(events);
    } catch (e) {
      console.error("Invalid sequence JSON", e);
    }
  };

  const tabs = ["handshake", "channel", "payments", "gossip", "custom"];
  const currentMessages = selectedTab !== "custom" ? messageCategories[selectedTab as keyof typeof messageCategories] : [];

  return (
    <div className="h-full flex flex-col text-white bg-black relative">
      <div className="px-5 py-4 border-b border-[#111] bg-[#050505] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-500">Protocol Library</span>
          {pendingSequence.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-[9px] font-bold rounded flex items-center gap-2">
              {pendingSequence.length} STACKED
            </span>
          )}
        </div>
      </div>

      <div className="flex border-b border-[#111] bg-[#020202] overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap
                            ${selectedTab === tab ? 'text-blue-500 bg-blue-900/5' : 'text-gray-700 hover:text-gray-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-40">
        {selectedTab !== "custom" ? (
          <div className="divide-y divide-[#111] border-b border-[#111]">
            {currentMessages.map((msg) => (
              <div
                key={msg.name}
                className="px-6 py-5 bg-[#000] hover:bg-[#030303] transition-all duration-200 flex items-center justify-between gap-4 border-l-2 border-transparent hover:border-blue-600 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[14px] font-black uppercase tracking-tight truncate">{msg.name}</span>
                    <span className="px-2 py-0.5 bg-blue-900/10 border border-blue-900/20 text-[8px] text-blue-500 rounded font-bold uppercase shrink-0">
                      {msg.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-normal font-medium line-clamp-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    {msg.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-[#050505] rounded-lg border border-white/5 overflow-hidden">
                    <button
                      onClick={() => addToSequence(msg.name, 'send')}
                      className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/5 border-r border-white/5 transition-all active:scale-90"
                      title="Add SEND event"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => addToSequence(msg.name, 'expect')}
                      className="p-2 text-gray-500 hover:text-green-400 hover:bg-green-500/5 transition-all active:scale-90"
                      title="Add EXPECT event (Wait for Peer)"
                    >
                      <ShieldCheck size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleSendInstant(msg.name)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 active:scale-95 shrink-0 shadow-lg shadow-blue-900/10"
                  >
                    RUN
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <textarea
              value={customEventJson}
              onChange={(e) => setCustomEventJson(e.target.value)}
              className="w-full h-80 p-5 bg-[#010101] border border-[#111] rounded font-mono text-[11px] text-gray-700 focus:border-blue-500/40 outline-none scrollbar-hide"
            />
            <button
              onClick={handleSendCustom}
              className="w-full py-5 bg-blue-700 text-white rounded font-black text-[11px] uppercase tracking-[0.3em] hover:bg-blue-600 shadow-xl shadow-blue-900/10"
            >
              TRANSMIT SEQUENCE
            </button>
          </div>
        )}
      </div>

      {/* Sticky Sequence Builder Footer */}
      {pendingSequence.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#050505] border-t border-blue-500/20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-[100]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 overflow-x-auto scrollbar-hide flex items-center gap-2">
              {pendingSequence.map((s, i) => (
                <div 
                  key={i} 
                  className={`px-3 py-2 border rounded-md flex items-center gap-3 transition-all
                    ${s.type === 'send' ? 'bg-blue-600/10 border-blue-600/20' : 'bg-green-600/10 border-green-600/20'}`}
                >
                  <div className="flex flex-col">
                    <span className={`text-[7px] font-black uppercase ${s.type === 'send' ? 'text-blue-500' : 'text-green-500'}`}>
                      {s.type}
                    </span>
                    <span className="text-[10px] font-black uppercase text-white whitespace-nowrap">{s.msg_name}</span>
                  </div>
                  <button onClick={() => setPendingSequence(prev => prev.filter((_, idx) => idx !== i))}>
                    <X size={10} className="text-gray-500 hover:text-white" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPendingSequence([])}
                className="p-3 bg-red-900/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={executeSequence}
                className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-600/20"
              >
                <Play size={14} />
                Execute Sequence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
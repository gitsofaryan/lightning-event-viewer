import React from 'react';
import { useStore } from '../../store';

const MessageDetails: React.FC = () => {
  const { messages, selectedMessage } = useStore(state => ({
    messages: state.messages,
    selectedMessage: state.selectedMessage
  }));

  const messageStats = {
    total: messages.length,
    outgoing: messages.filter(m => m.direction === 'out').length,
    incoming: messages.filter(m => m.direction === 'in').length,
    unique_events: new Set(messages.map(m => m.event)).size
  };

  const recentMessage = messages[messages.length - 1];

  return (
    <div className="h-full flex flex-col text-white bg-black">
      <div className="px-5 py-4 border-b border-[#111] bg-[#050505]">
        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-500">System Metrics</span>
      </div>

      <div className="p-6 space-y-10">
        {/* Statistics Grid */}
        <div className="grid grid-cols-4 divide-x divide-[#111] border border-[#111] rounded overflow-hidden">
          {[
            { label: 'ALL', value: messageStats.total, color: 'text-gray-400' },
            { label: 'OUT', value: messageStats.outgoing, color: 'text-blue-500' },
            { label: 'IN', value: messageStats.incoming, color: 'text-orange-500' },
            { label: 'TYPE', value: messageStats.unique_events, color: 'text-purple-500' }
          ].map((stat) => (
            <div key={stat.label} className="bg-black py-5 flex flex-col items-center justify-center">
              <span className="text-[8px] font-black text-gray-700 uppercase mb-1.5 tracking-widest">{stat.label}</span>
              <span className={`text-[15px] font-black ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Latest Feed Activity */}
        <div className="space-y-5">
          <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
            LATEST FEED
          </span>

          {recentMessage ? (
            <div className="bg-[#020202] p-6 rounded border border-[#111] transition-all hover:border-blue-900/30">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[12px] font-black uppercase tracking-tight ${recentMessage.direction === 'out' ? 'text-blue-500' : 'text-orange-500'}`}>
                  {recentMessage.event}
                </span>
                <span className="text-[9px] text-gray-700 font-mono">
                  {new Date(recentMessage.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <pre className="text-[10px] text-gray-400 bg-black p-5 rounded border border-[#111] font-mono leading-relaxed max-h-48 overflow-auto scrollbar-hide">
                {JSON.stringify(recentMessage.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-[#111] rounded opacity-10">
              <span className="text-[11px] font-black uppercase tracking-widest">AWAITING SIGNAL</span>
            </div>
          )}
        </div>

        {/* Data Schema */}
        {selectedMessage && (
          <div className="space-y-5">
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest block mb-2 opacity-50">SCHEMA</span>
            <div className="bg-[#020202] p-6 rounded border border-[#111]">
              <span className="text-[12px] font-black text-white uppercase block mb-2 truncate">{selectedMessage.name}</span>
              <p className="text-[10px] text-gray-500 mb-5 font-bold leading-relaxed line-clamp-2 italic">{selectedMessage.description}</p>
              <pre className="text-[10px] text-gray-600 bg-black p-5 rounded border border-[#111] font-mono leading-relaxed max-h-48 overflow-auto scrollbar-hide">
                {JSON.stringify(selectedMessage.content || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageDetails;
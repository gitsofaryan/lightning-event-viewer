import React, { useState, useEffect, useRef } from 'react';
import { Toggle } from '@cloudscape-design/components';
import { useStore } from '../../store';
import { MessageFlowEvent } from '../../api/websocket';
import { Copy, Download, Trash2, Eye, EyeOff } from 'lucide-react';

const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }) + '.' + String(date.getMilliseconds()).padStart(3, '0');
};

const MessageLog: React.FC = () => {
    const [autoScroll, setAutoScroll] = useState(true);
    const [showTimestamps, setShowTimestamps] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
    const messages = useStore(state => state.messages);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (autoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, autoScroll]);

    const handleDownload = () => {
        const data = JSON.stringify(messages, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lightning-messages-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleCopy = async () => {
        try {
            const data = JSON.stringify(messages, null, 2);
            await navigator.clipboard.writeText(data);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    const handleClear = () => {
        useStore.getState().clearMessages();
        setExpandedMessages(new Set());
    };

    const toggleMessageExpansion = (messageId: string) => {
        const newExpanded = new Set(expandedMessages);
        if (newExpanded.has(messageId)) {
            newExpanded.delete(messageId);
        } else {
            newExpanded.add(messageId);
        }
        setExpandedMessages(newExpanded);
    };

    const renderMessage = (message: MessageFlowEvent, index: number) => {
        const messageId = `${message.sequence_id || 'raw'}-${message.timestamp}-${index}`;
        const isExpanded = expandedMessages.has(messageId);
        const timestamp = showTimestamps ? formatTimestamp(message.timestamp) : '';
        const directionIcon = message.direction === 'out' ? '→' : '←';
        const messageColor = message.direction === 'out' ? 'text-blue-500' : 'text-green-500';

        return (
            <div
                key={messageId}
                className="border-b border-[#111] bg-black hover:bg-[#050505] transition-colors group"
            >
                <div className="flex items-center px-6 py-3.5 hover:bg-[#0a0a0a] cursor-pointer" onClick={() => toggleMessageExpansion(messageId)}>
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                        {showTimestamps && (
                            <span className="text-[10px] text-gray-700 font-mono shrink-0">
                                {timestamp}
                            </span>
                        )}
                        <span className={`text-[12px] font-black uppercase tracking-tight shrink-0 ${messageColor}`}>
                            {message.event}
                        </span>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-700 uppercase truncate">
                            <span className="opacity-40">{message.direction === 'out' ? 'RUNNER' : 'LDK'}</span>
                            <span className="opacity-20">{directionIcon}</span>
                            <span className="opacity-40">{message.direction === 'out' ? 'LDK' : 'RUNNER'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isExpanded ? <EyeOff size={14} className="text-gray-600" /> : <Eye size={14} className="text-gray-600" />}
                    </div>
                </div>

                {isExpanded && (
                    <div className="p-8 bg-black border-t border-[#111]">
                        <pre className="text-[11px] font-mono text-gray-500 whitespace-pre-wrap leading-relaxed shadow-inner p-5 bg-[#020202] rounded border border-[#111]">
                            {JSON.stringify(message.data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    const filteredMessages = messages.filter(msg => {
        if (msg.is_housekeeping) return false;
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            msg.event.toLowerCase().includes(searchLower) ||
            JSON.stringify(msg.data).toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="h-full flex flex-col text-white bg-black">
            {/* Control Bar */}
            <div className="px-6 py-3 border-b border-[#111] bg-[#080808] flex justify-between items-center shrink-0">
                <div className="flex gap-6">
                    <button onClick={handleDownload} title="Download" className="text-gray-600 hover:text-white transition-colors"><Download size={16} /></button>
                    <button onClick={handleCopy} title="Copy" className="text-gray-600 hover:text-white transition-colors"><Copy size={16} /></button>
                    <button onClick={handleClear} disabled={messages.length === 0} title="Clear" className="text-gray-600 hover:text-red-500 transition-colors disabled:opacity-20"><Trash2 size={16} /></button>
                </div>

                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">FEED LOCK</span>
                        <Toggle checked={autoScroll} onChange={({ detail }) => setAutoScroll(detail.checked)} />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">TIME</span>
                        <Toggle checked={showTimestamps} onChange={({ detail }) => setShowTimestamps(detail.checked)} />
                    </div>
                </div>
            </div>

            <div className="bg-black border-b border-[#111] px-6 py-4 shrink-0">
                <input
                    value={searchText}
                    type="search"
                    placeholder="PROTOCOL SCANNER / SEARCH SIGNAL..."
                    className="w-full bg-transparent text-[11px] font-black uppercase tracking-[0.3em] text-gray-700 outline-none placeholder:opacity-20 focus:text-white transition-colors"
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {filteredMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-40 opacity-10">
                        <span className="text-[12px] font-black uppercase tracking-[1em] italic">Awaiting Protocol Signal...</span>
                    </div>
                ) : (
                    <>
                        {filteredMessages.map(renderMessage)}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <div className="px-6 py-2 border-t border-[#111] bg-[#050505] shrink-0">
                <div className="text-[9px] font-black text-gray-800 uppercase font-mono text-right py-1">
                    [{String(messages.length).padStart(4, '0')}] CAPTURED PACKETS
                </div>
            </div>
        </div>
    );
};

export default MessageLog;
import React, { useState } from 'react';
import api, { SequenceEvent } from '../api/api';

interface LogEntry {
    id: string;
    timestamp: string;
    type: 'request' | 'response' | 'error';
    data: unknown;
}

const ApiVisualizer: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [customEvents, setCustomEvents] = useState<string>('');

    const addLog = (type: LogEntry['type'], data: unknown) => {
        const newLog: LogEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type,
            data
        };
        setLogs(prev => [newLog, ...prev]);
    };

    const runApiCall = async (events: SequenceEvent[], description: string) => {
        setLoading(true);
        addLog('request', { description, events });

        try {
            const response = await api.runSequence(events);
            addLog('response', response);
        } catch (error) {
            addLog('error', { message: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        const events: SequenceEvent[] = [
            { type: "connect", connprivkey: "03" }
        ];
        runApiCall(events, "Connect to node");
    };

    const handleBasicSequence = () => {
        const events: SequenceEvent[] = [
            { type: "connect", connprivkey: "03" },
            { type: "send", connprivkey: "03", msg_name: "init" }
        ];
        runApiCall(events, "Connect + Init");
    };

    const handleSendInit = () => {
        const events: SequenceEvent[] = [
            { type: "send", connprivkey: "03", msg_name: "init" }
        ];
        runApiCall(events, "Send Init Message");
    };

    const handleCustomEvents = () => {
        try {
            const events = JSON.parse(customEvents);
            runApiCall(events, "Custom Events");
        } catch {
            addLog('error', { message: 'Invalid JSON format' });
        }
    };

    const clearLogs = () => setLogs([]);

    const formatJson = (obj: unknown) => JSON.stringify(obj, null, 2);

    return (
        <div className="max-w-6xl mx-auto p-10 bg-black min-h-screen text-white">
            <div className="bg-[#050505] rounded-2xl shadow-2xl border border-[#222]">
                <div className="border-b border-[#222] px-8 py-6">
                    <h1 className="text-xl font-black text-white uppercase tracking-[0.2em]">Lightning Events API</h1>
                    <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mt-1">Low-level protocol sequence testing</p>
                </div>

                <div className="p-10">
                    {/* Quick Actions */}
                    <div className="mb-10">
                        <h2 className="text-[12px] font-black mb-5 text-gray-400 uppercase tracking-widest">Quick Actions</h2>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleConnect}
                                disabled={loading}
                                className="px-6 py-3 bg-blue-900/20 text-blue-400 border border-blue-900/50 rounded-lg hover:bg-blue-900/40 transition-all font-bold text-[11px] uppercase tracking-wider disabled:opacity-30"
                            >
                                Connect Node
                            </button>
                            <button
                                onClick={handleBasicSequence}
                                disabled={loading}
                                className="px-6 py-3 bg-green-900/20 text-green-400 border border-green-900/50 rounded-lg hover:bg-green-900/40 transition-all font-bold text-[11px] uppercase tracking-wider disabled:opacity-30"
                            >
                                Connect + Init
                            </button>
                            <button
                                onClick={handleSendInit}
                                disabled={loading}
                                className="px-6 py-3 bg-purple-900/20 text-purple-400 border border-purple-900/50 rounded-lg hover:bg-purple-900/40 transition-all font-bold text-[11px] uppercase tracking-wider disabled:opacity-30"
                            >
                                Send Init
                            </button>
                            <button
                                onClick={clearLogs}
                                className="px-6 py-3 bg-[#111] text-gray-400 border border-[#222] rounded-lg hover:bg-[#222] transition-all font-bold text-[11px] uppercase tracking-wider"
                            >
                                Clear Logs
                            </button>
                        </div>
                    </div>

                    {/* Custom Events */}
                    <div className="mb-10">
                        <h2 className="text-[12px] font-black mb-5 text-gray-400 uppercase tracking-widest">Custom Events</h2>
                        <div className="space-y-5">
                            <textarea
                                value={customEvents}
                                onChange={(e) => setCustomEvents(e.target.value)}
                                placeholder='[{"type": "connect", "connprivkey": "03"}, {"type": "send", "connprivkey": "03", "msg_name": "init"}]'
                                className="w-full h-40 p-5 bg-black border border-[#222] rounded-xl font-mono text-[11px] text-gray-400 focus:border-blue-700 outline-none shadow-inner"
                            />
                            <button
                                onClick={handleCustomEvents}
                                disabled={loading || !customEvents.trim()}
                                className="px-6 py-3 bg-orange-900/20 text-orange-400 border border-orange-900/50 rounded-lg hover:bg-orange-900/40 transition-all font-bold text-[11px] uppercase tracking-wider disabled:opacity-30"
                            >
                                Send Custom Events
                            </button>
                        </div>
                    </div>

                    {/* API Status */}
                    <div className="mb-10">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-ping' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                API Status: {loading ? 'PROCESSING' : 'READY'}
                            </span>
                        </div>
                    </div>

                    {/* Logs */}
                    <div>
                        <h2 className="text-[12px] font-black mb-5 text-gray-400 uppercase tracking-widest">API Logs</h2>
                        <div className="space-y-5 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                            {logs.length === 0 ? (
                                <div className="text-gray-700 text-center py-20 border-2 border-dashed border-[#1a1a1a] rounded-2xl">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-30">NO COMMANDS EXECUTED</span>
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className={`p-6 rounded-xl border border-[#1a1a1a] transition-all hover:border-[#333] ${log.type === 'request'
                                            ? 'bg-blue-900/5 border-l-2 border-l-blue-900'
                                            : log.type === 'response'
                                                ? 'bg-green-900/5 border-l-2 border-l-green-900'
                                                : 'bg-red-900/5 border-l-2 border-l-red-900'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-[10px] font-black tracking-widest ${log.type === 'request'
                                                ? 'text-blue-500'
                                                : log.type === 'response'
                                                    ? 'text-green-500'
                                                    : 'text-red-500'
                                                }`}>
                                                {log.type.toUpperCase()}
                                            </span>
                                            <span className="text-[9px] uppercase font-mono text-gray-600 tracking-tighter">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <pre className="text-[11px] bg-black/80 p-5 rounded-lg border border-[#111] overflow-x-auto text-gray-400 font-mono shadow-inner scrollbar-hide">
                                            {formatJson(log.data)}
                                        </pre>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiVisualizer;

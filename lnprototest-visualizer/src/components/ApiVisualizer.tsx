import React, { useState } from 'react';
import api, { ApiEvent } from '../api/api';

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

    const runApiCall = async (events: ApiEvent[], description: string) => {
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
        const events: ApiEvent[] = [
            { type: "connect", connprivkey: "03" }
        ];
        runApiCall(events, "Connect to node");
    };

    const handleBasicSequence = () => {
        const events: ApiEvent[] = [
            { type: "connect", connprivkey: "03" },
            { type: "send", msg: { type: "init", connprivkey: "03" } }
        ];
        runApiCall(events, "Connect + Send Init");
    };

    const handleSendInit = () => {
        const events: ApiEvent[] = [
            { type: "send", msg: { type: "init", connprivkey: "03" } }
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
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg">
                <div className="border-b px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Lightning Events API Visualizer</h1>
                    <p className="text-gray-600">Test and visualize API calls to your Lightning Events backend</p>
                </div>

                <div className="p-6">
                    {/* Quick Actions */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleConnect}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                Connect Node
                            </button>
                            <button
                                onClick={handleBasicSequence}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                Connect + Init
                            </button>
                            <button
                                onClick={handleSendInit}
                                disabled={loading}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                            >
                                Send Init
                            </button>
                            <button
                                onClick={clearLogs}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                Clear Logs
                            </button>
                        </div>
                    </div>

                    {/* Custom Events */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3">Custom Events</h2>
                        <div className="space-y-3">
                            <textarea
                                value={customEvents}
                                onChange={(e) => setCustomEvents(e.target.value)}
                                placeholder='[{"type": "connect", "connprivkey": "03"}, {"type": "send", "msg": {"type": "init", "connprivkey": "03"}}]'
                                className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm"
                            />
                            <button
                                onClick={handleCustomEvents}
                                disabled={loading || !customEvents.trim()}
                                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                            >
                                Send Custom Events
                            </button>
                        </div>
                    </div>

                    {/* API Status */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                            <span className="text-sm font-medium">
                                API Status: {loading ? 'Processing...' : 'Ready'}
                            </span>
                        </div>
                    </div>

                    {/* Logs */}
                    <div>
                        <h2 className="text-lg font-semibold mb-3">API Logs</h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {logs.length === 0 ? (
                                <div className="text-gray-500 text-center py-8">
                                    No API calls yet. Click a button above to start testing.
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className={`p-4 rounded-lg border-l-4 ${log.type === 'request'
                                                ? 'bg-blue-50 border-blue-500'
                                                : log.type === 'response'
                                                    ? 'bg-green-50 border-green-500'
                                                    : 'bg-red-50 border-red-500'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-sm font-semibold ${log.type === 'request'
                                                    ? 'text-blue-700'
                                                    : log.type === 'response'
                                                        ? 'text-green-700'
                                                        : 'text-red-700'
                                                }`}>
                                                {log.type.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
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

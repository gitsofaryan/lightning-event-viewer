import React, { useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Node,
    Edge,
    Position,
    Handle,
    Connection,
    addEdge,
    NodeProps,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    SpaceBetween
} from '@cloudscape-design/components';
import { useStore } from '../../store';
import { MessageFlowEvent } from '../../api/websocket';
import { Zap, Activity } from 'lucide-react';
import { apiClient } from '../../api/client';

interface CustomNodeData {
    label: string;
    type: string;
    isConnected: boolean;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
    return (
        <div
            className={`flex flex-col items-center justify-start p-10 rounded-[2.5rem] border-2 shadow-2xl bg-[#000000] text-white transition-all duration-700
        ${data.type === 'runner' ? 'border-blue-900/40 hover:border-blue-500 shadow-blue-900/10' : 'border-orange-900/40 hover:border-orange-500 shadow-orange-900/10'}
        ${data.isConnected ? 'opacity-100' : 'opacity-40 filter grayscale'}`}
            style={{
                width: '320px',
                height: '520px',
                pointerEvents: 'all',
                boxShadow: data.isConnected ? (data.type === 'runner' ? '0 0 50px rgba(37,99,235,0.1)' : '0 0 50px rgba(249,115,22,0.1)') : 'none',
            }}
        >
            <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-10 transition-all duration-700
        ${data.type === 'runner' ? 'bg-blue-900/5 text-blue-500 border border-blue-900/20' : 'bg-orange-900/5 text-orange-500 border border-orange-900/20'}
        ${data.isConnected ? 'scale-100' : 'scale-90'}`}
            >
                {data.type === 'runner' ? <Activity size={50} strokeWidth={1} /> : <Zap size={50} strokeWidth={1} />}
            </div>

            <div className="text-[20px] font-black mb-4 tracking-[0.2em] uppercase text-center">{data.label}</div>

            <div className={`text-[10px] px-6 py-2 rounded-full font-black uppercase tracking-[0.3em] border transition-all duration-700
        ${data.isConnected ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                {data.isConnected ? 'ACTIVE NODE' : 'DISCONNECTED'}
            </div>

            <div className="mt-auto w-full space-y-3 px-8 pb-10 opacity-10">
                <div className="h-1 bg-white rounded-full w-full"></div>
                <div className="h-1 bg-white rounded-full w-3/4 mx-auto"></div>
                <div className="h-1 bg-white rounded-full w-1/2 mx-auto"></div>
            </div>

            {/* Left Handles (Inputs) */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center gap-3">
                {[...Array(15)].map((_, i) => (
                    <Handle
                        key={`left-${i}`}
                        type="target"
                        position={Position.Left}
                        id={`left-${i}`}
                        className="!w-2.5 !h-2.5 !border-none !min-h-0 !static !translate-y-0"
                        style={{
                            background: data.isConnected ? (data.type === 'runner' ? '#3b82f6' : '#f97316') : '#111',
                            boxShadow: data.isConnected ? `0 0 10px ${data.type === 'runner' ? '#3b82f6' : '#f97316'}` : 'none',
                        }}
                    />
                ))}
            </div>

            {/* Right Handles (Outputs) */}
            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center gap-3">
                {[...Array(15)].map((_, i) => (
                    <Handle
                        key={`right-${i}`}
                        type="source"
                        position={Position.Right}
                        id={`right-${i}`}
                        className="!w-2.5 !h-2.5 !border-none !min-h-0 !static !translate-y-0"
                        style={{
                            background: data.isConnected ? (data.type === 'runner' ? '#3b82f6' : '#f97316') : '#111',
                            boxShadow: data.isConnected ? `0 0 10px ${data.type === 'runner' ? '#3b82f6' : '#f97316'}` : 'none',
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

const initialNodes: Node<CustomNodeData>[] = [
    {
        id: 'runner',
        type: 'custom',
        position: { x: 100, y: 100 },
        data: { label: 'Protocol Runner', type: 'runner', isConnected: false },
        draggable: true,
    },
    {
        id: 'ldk',
        type: 'custom',
        position: { x: 700, y: 100 },
        data: { label: 'Target LDK Node', type: 'ldk', isConnected: false },
        draggable: true,
    },
];

const MessageFlowComponent: React.FC = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { connected, messages } = useStore();

    const baseConnectionEdge: Edge = useMemo(() => ({
        id: 'base-connection',
        source: 'runner',
        target: 'ldk',
        type: 'smoothstep',
        animated: connected,
        style: {
            strokeWidth: 4,
            stroke: connected ? '#14b8a6' : '#111',
            strokeDasharray: connected ? '0' : '10 5',
            opacity: connected ? 0.6 : 0.1,
        },
        label: connected ? 'TUNNEL ESTABLISHED' : 'OFFLINE',
        labelStyle: {
            fontSize: '9px',
            fontWeight: 900,
            fill: connected ? '#14b8a6' : '#333',
            transform: 'translateY(80px)',
            letterSpacing: '0.4em',
        },
        labelBgStyle: {
            fill: '#000',
            fillOpacity: 0.9,
        },
    }), [connected]);

    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    isConnected: connected,
                },
            }))
        );
    }, [connected, setNodes]);

    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) => addEdge({
                ...params,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#2563eb', strokeWidth: 2 },
            }, eds));
        },
        [setEdges]
    );

    const handleConnectionToggle = useCallback(async () => {
        try {
            if (!connected) {
                useStore.getState().setConnectionState('connecting');
                await useStore.getState().connect();
            } else {
                apiClient.disconnect();
                useStore.getState().setConnectionState('disconnected');
            }
        } catch (error) {
            console.error('Connection error:', error);
            useStore.getState().setConnectionState('disconnected');
        }
    }, [connected]);

    const handleClearMessages = useCallback(() => {
        useStore.getState().clearMessages();
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageFlowEvent) => {
            useStore.getState().addMessage(event);
        };

        const unsubscribeMessage = apiClient.onMessage(handleMessage);
        return () => unsubscribeMessage();
    }, []);

    useEffect(() => {
        const newEdges: Edge[] = [baseConnectionEdge];
        let outCount = 0;
        let inCount = 0;

        messages.forEach((msg, index) => {
            const direction = msg.direction;
            const event = msg.event;
            let id, source, target, sourceHandle, targetHandle, label, style, markerEnd;

            if (direction === 'out') {
                id = `edge-out-${index}`;
                source = 'runner';
                target = 'ldk';
                sourceHandle = `right-${outCount % 15}`;
                targetHandle = `left-${outCount % 15}`;
                label = event;
                style = { stroke: '#3b82f6', strokeWidth: 3, opacity: 0.9 };
                markerEnd = { type: MarkerType.ArrowClosed, color: '#3b82f6' };
                outCount++;
            } else {
                id = `edge-in-${index}`;
                source = 'ldk';
                target = 'runner';
                sourceHandle = `left-${inCount % 15}`;
                targetHandle = `right-${inCount % 15}`;
                label = event;
                style = { stroke: event === 'error' ? '#ef4444' : '#f97316', strokeWidth: 3, opacity: 0.9 };
                markerEnd = { type: MarkerType.ArrowClosed, color: event === 'error' ? '#ef4444' : '#f97316' };
                inCount++;
            }

            newEdges.push({
                id, source, target, sourceHandle, targetHandle, label,
                type: 'smoothstep', animated: false, style, markerEnd,
                labelStyle: { fill: '#000', fontWeight: 900, fontSize: '9px', letterSpacing: '0.1em' },
                labelBgStyle: { fill: '#fff', fillOpacity: 1, rx: 4, ry: 4 },
                labelBgPadding: [8, 4]
            });
        });

        setEdges(newEdges);
    }, [messages, connected, baseConnectionEdge, setEdges]);

    return (
        <div className="h-full w-full flex flex-col bg-[#000000] overflow-hidden relative">
            {/* Interface Header */}
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-50 pointer-events-none">
                <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                    <div className="text-[14px] font-black text-white tracking-[0.4em] uppercase opacity-80">
                        Protocol Flow Interface
                    </div>
                </div>
                <div className="flex items-center gap-4 pointer-events-auto">
                    <button
                        onClick={handleConnectionToggle}
                        className={`px-8 py-3 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all
                            ${connected ? 'bg-red-600/10 text-red-500 border border-red-600/30 hover:bg-red-600 hover:text-white' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}
                    >
                        {connected ? 'TERMINATE' : 'INITIALIZE'}
                    </button>
                    <button
                        onClick={handleClearMessages}
                        className="px-8 py-3 bg-[#050505] text-gray-500 border border-[#111] rounded-lg hover:border-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        PURGE LOGS
                    </button>
                </div>
            </div>

            <div className="flex-1 relative bg-[#000000]">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.5}
                    maxZoom={1.5}
                    style={{ background: '#000000' }}
                >
                    <Background color="#111" gap={40} size={1} />
                </ReactFlow>
            </div>
        </div>
    );
};

function MessageFlow() {
    return (
        <ReactFlowProvider>
            <MessageFlowComponent />
        </ReactFlowProvider>
    );
}

export default MessageFlow;

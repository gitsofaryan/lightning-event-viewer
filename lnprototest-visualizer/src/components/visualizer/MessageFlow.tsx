import React, { useEffect, useCallback } from 'react';
import ReactFlow, {
    Background,
    Node,
    Edge,
    Position,
    Handle,
    NodeProps,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    MarkerType,
    useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '../../store';
import { Activity, Zap, Trash2, Power, Play, Maximize2 } from 'lucide-react';
import { apiClient } from '../../api/client';

interface CustomNodeData {
    label: string;
    type: 'runner' | 'ldk';
    isConnected: boolean;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
    const Icon = data.type === 'runner' ? Activity : Zap;
    const colorHex = data.type === 'runner' ? '#3b82f6' : '#f97316';

    return (
        <div className="flex flex-col items-center">
            <div
                className={`flex flex-col items-center justify-start w-72 p-10 rounded-[2.5rem] border-2 bg-[#000] transition-all duration-700
                ${data.isConnected ? 'opacity-100 shadow-[0_0_50px_rgba(0,0,0,0.6)]' : 'opacity-40 grayscale'}`}
                style={{ 
                    borderColor: data.isConnected ? `${colorHex}66` : '#111',
                    boxShadow: data.isConnected ? `0 0 40px ${colorHex}22` : 'none'
                }}
            >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 border transition-all duration-700
                    ${data.isConnected ? 'bg-[#050505] scale-110' : 'bg-transparent scale-100'}`}
                    style={{ borderColor: data.isConnected ? `${colorHex}33` : '#111', color: colorHex }}
                >
                    <Icon size={40} strokeWidth={1} />
                </div>
                
                <div className="text-[16px] font-black uppercase tracking-[0.4em] text-white text-center mb-2">{data.label}</div>
                
                <div className={`mt-4 text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest border
                    ${data.isConnected ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-gray-700 border-gray-800 bg-transparent'}`}>
                    {data.isConnected ? 'ACTIVE' : 'OFFLINE'}
                </div>
            </div>

            <div className="w-[1px] h-[4000px] bg-dashed transition-all duration-1000 opacity-20"
                style={{ 
                    backgroundImage: `linear-gradient(to bottom, ${colorHex} 50%, transparent 50%)`,
                    backgroundSize: '1px 16px'
                }}
            />

            <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
                {[...Array(100)].map((_, i) => (
                    <React.Fragment key={i}>
                        <Handle type="source" position={data.type === 'runner' ? Position.Right : Position.Left} id={`h-${i}-src`} style={{ top: `${280 + i * 80}px`, opacity: 0 }} />
                        <Handle type="target" position={data.type === 'runner' ? Position.Right : Position.Left} id={`h-${i}-tgt`} style={{ top: `${280 + i * 80}px`, opacity: 0 }} />
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const nodeTypes = { custom: CustomNode };

const initialNodes: Node<CustomNodeData>[] = [
    { id: 'runner', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'CLIENT (RUNNER)', type: 'runner', isConnected: false } },
    { id: 'ldk', type: 'custom', position: { x: 1200, y: 0 }, data: { label: 'TARGET LDK NODE', type: 'ldk', isConnected: false } },
];

const MessageFlowComponent: React.FC = () => {
    const [nodes, setNodes] = useNodesState(initialNodes);
    const [edges, setEdges] = useEdgesState([]);
    const { fitView } = useReactFlow();
    const connected = useStore(state => state.connected);
    const messages = useStore(state => state.messages);

    useEffect(() => {
        setNodes((nds) => nds.map((node) => ({
            ...node,
            data: { ...node.data, isConnected: connected },
        })));
    }, [connected, setNodes]);

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
        const newEdges: Edge[] = [];
        const flowMessages = messages.filter(m => !m.is_housekeeping);
        const recentMessages = flowMessages.slice(-40);
        const startIndex = Math.max(0, flowMessages.length - 40);

        recentMessages.forEach((msg, index) => {
            const actualIndex = startIndex + index;
            const direction = msg.direction;
            const eventName = (msg.event || 'unknown').toLowerCase();
            const yOffset = index; 
            const opacity = Math.max(0.2, 1 - (recentMessages.length - 1 - index) * 0.05);
            const isOut = direction === 'out';
            
            newEdges.push({
                id: `edge-${actualIndex}`,
                source: isOut ? 'runner' : 'ldk',
                target: isOut ? 'ldk' : 'runner',
                sourceHandle: `h-${yOffset}-src`,
                targetHandle: `h-${yOffset}-tgt`,
                label: msg.event.toUpperCase(),
                type: 'straight',
                animated: index === recentMessages.length - 1,
                markerEnd: { 
                    type: MarkerType.ArrowClosed, 
                    color: isOut ? '#3b82f6' : (eventName === 'error' ? '#ef4444' : '#22c55e') 
                },
                style: { 
                    stroke: isOut ? '#3b82f6' : (eventName === 'error' ? '#ef4444' : '#22c55e'), 
                    strokeWidth: 4, 
                    opacity 
                },
                labelStyle: { fill: '#fff', fontWeight: 900, fontSize: '12px', opacity, letterSpacing: '0.15em' },
                labelBgStyle: { fill: '#000', fillOpacity: 0.9, rx: 6, ry: 6 },
                labelBgPadding: [16, 8],
            });
        });

        setEdges(newEdges);
    }, [messages, connected, setEdges]);

    return (
        <div className="h-full w-full bg-black overflow-hidden relative group">
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-end items-center z-50 pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <button
                        onClick={() => fitView({ duration: 800, padding: 0.5 })}
                        className="flex items-center gap-3 px-6 py-3 bg-[#050505] text-gray-500 border border-white/5 rounded-xl hover:border-blue-500/50 hover:text-blue-400 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        <Maximize2 size={14} />
                        Recenter
                    </button>
                    <button
                        onClick={handleConnectionToggle}
                        className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all
                            ${connected ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.3)]'}`}
                    >
                        {connected ? <Power size={14} /> : <Play size={14} />}
                        {connected ? 'Terminate Session' : 'Initialize Session'}
                    </button>
                    <button
                        onClick={handleClearMessages}
                        className="flex items-center gap-3 px-8 py-3 bg-[#050505] text-gray-500 border border-white/5 rounded-xl hover:border-white/20 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        <Trash2 size={14} />
                        Purge History
                    </button>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.5 }}
                minZoom={0.05}
                maxZoom={2.5}
                style={{ background: '#000' }}
            >
                <Background color="#111" gap={120} size={1} />
            </ReactFlow>
        </div>
    );
};


export default function MessageFlow() {
    return <ReactFlowProvider><MessageFlowComponent /></ReactFlowProvider>;
}


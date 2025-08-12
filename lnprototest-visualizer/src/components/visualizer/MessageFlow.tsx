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
    Container,
    Header,
    Box,
    SpaceBetween,
    Button
} from '@cloudscape-design/components';
import { useStore } from '../../store';
import { MessageFlowEvent } from '../../api/websocket';
import MessageLog from './MessageLog';
import { Zap } from 'lucide-react';
import { apiClient } from '../../api/client';

interface CustomNodeData {
    label: string;
    type: string;
    isConnected: boolean;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
    return (
        <div
            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 shadow-lg bg-white transition-all duration-500
        ${data.type === 'runner' ? 'border-blue-500 hover:border-blue-600' : 'border-yellow-500 hover:border-yellow-600'}
        ${data.isConnected ? 'shadow-xl animate-pulse' : 'opacity-75'}`}
            style={{
                minWidth: '200px',
                minHeight: '400px', // taller for more rows
                pointerEvents: 'all',
                transform: data.isConnected ? 'translateY(-2px)' : 'translateY(0px)',
                animation: data.isConnected ? 'float 3s ease-in-out infinite' : 'none'
            }}
        >
            <style dangerouslySetInnerHTML={{
                __html: `
          @keyframes float {
            0%, 100% { transform: translateY(-2px); }
            50% { transform: translateY(-6px); }
          }
        `
            }} />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300
        ${data.type === 'runner' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}
        ${data.isConnected ? 'scale-110' : 'scale-100'}`}
            >
                <Zap size={32} />
            </div>
            <div className="text-base font-bold text-gray-800 mb-2">{data.label}</div>
            <div className={`text-sm px-3 py-1 rounded-full font-medium
        ${data.isConnected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {data.isConnected ? 'Online' : 'Offline'}
            </div>
            {/* Render 20 vertical handles for stacking arrows */}
            {[...Array(20)].map((_, i) => (
                <React.Fragment key={i}>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id={`right-${i}`}
                        style={{
                            background: data.type === 'runner' ? '#3b82f6' : '#eab308',
                            width: 12,
                            height: 12,
                            opacity: data.isConnected ? 1 : 0.5,
                            top: `${5 + i * 4.5}%`,
                            right: '-6px',
                        }}
                    />
                    <Handle
                        type="target"
                        position={Position.Left}
                        id={`left-${i}`}
                        style={{
                            background: data.type === 'runner' ? '#3b82f6' : '#eab308',
                            width: 12,
                            height: 12,
                            opacity: data.isConnected ? 1 : 0.5,
                            top: `${5 + i * 4.5}%`,
                            left: '-6px',
                        }}
                    />
                </React.Fragment>
            ))}
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
        position: { x: 100, y: 100 }, // fixed y
        data: { label: 'Protocol Runner', type: 'runner', isConnected: false },
        draggable: false,
    },
    {
        id: 'ldk',
        type: 'custom',
        position: { x: 650, y: 100 }, // fixed y
        data: { label: 'LDK Node', type: 'ldk', isConnected: false },
        draggable: false,
    },
];

const MessageFlowComponent: React.FC = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { connected, messages } = useStore();

    // Base connection edge (no arrows, just a line)
    const baseConnectionEdge: Edge = useMemo(() => ({
        id: 'base-connection',
        source: 'runner',
        target: 'ldk',
        type: 'smoothstep',
        animated: connected,
        style: {
            strokeWidth: 3,
            stroke: connected ? '#10b981' : '#d1d5db',
            strokeDasharray: connected ? '0' : '8 4',
        },
        // No markerEnd to remove arrows
        label: connected ? 'Lightning Network Connection' : 'Disconnected',
        labelStyle: {
            fontSize: '12px',
            fontWeight: 600,
            color: connected ? '#059669' : '#6b7280',
            transform: 'translateY(60px)', // Move base connection label lower
        },
        labelBgStyle: {
            fill: 'white',
            fillOpacity: 0.9,
        },
    }), [connected]);

    // Update base connection edge when connection status changes
    useEffect(() => {
        setEdges([baseConnectionEdge]);
    }, [baseConnectionEdge, setEdges]);

    // Update node connection status
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
            if (params.source && params.target) {
                setEdges((eds) => addEdge({
                    ...params,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#4CAF50', strokeWidth: 2 },
                    // No markerEnd to remove arrows
                }, eds));
            }
        },
        [setEdges]
    );

    // Handle connection toggling
    const handleConnectionToggle = useCallback(async () => {
        try {
            if (!connected) {
                useStore.getState().setConnectionState('connecting');
                await useStore.getState().connect();
                console.log('Connection initiated');
            } else {
                apiClient.disconnect();
                useStore.getState().setConnectionState('disconnected');
                setEdges([baseConnectionEdge]);
                console.log('Connection terminated');
            }
        } catch (error) {
            console.error('Connection error:', error);
            useStore.getState().setConnectionState('disconnected');
        }
    }, [connected, baseConnectionEdge, setEdges]);

    // Handle WebSocket events by adding them to the store
    useEffect(() => {
        const handleMessage = (event: MessageFlowEvent) => {
            try {
                console.log('Processing message event:', event); // Debug log
                if (!event || !event.event) {
                    console.warn('Received invalid event:', event);
                    return;
                }
                // Add message to store, which will trigger the edge rendering effect
                useStore.getState().addMessage(event);
            } catch (err) {
                console.error('Error handling message:', err);
            }
        };

        const unsubscribeMessage = apiClient.onMessage(handleMessage);
        const unsubscribeError = apiClient.onError((error: { error: string }) => {
            console.error('WebSocket error:', error);
            useStore.getState().setConnectionState('disconnected');
            // Optionally show a UI error message here
        });

        return () => {
            unsubscribeMessage();
            unsubscribeError();
        };
    }, []); // No dependencies, this should only run once

    // Consolidated effect to visualize every message in the store as an arrow
    useEffect(() => {
        const newEdges: Edge<MessageFlowEvent>[] = [baseConnectionEdge];

        let outCount = 0;
        let inCount = 0;

        messages.forEach((msg, index) => {
            const direction = msg.direction;
            const event = msg.event;
            let id, source, target, sourceHandle, targetHandle, label, style, markerEnd, data;

            if (direction === 'out') {
                id = `edge-out-${index}`;
                source = 'runner';
                target = 'ldk';
                sourceHandle = `right-${outCount % 20}`;
                targetHandle = `left-${outCount % 20}`;
                label = String(event);
                style = { stroke: '#3b82f6', strokeWidth: 2 };
                markerEnd = { type: MarkerType.Arrow, color: '#3b82f6', width: 12, height: 12 };
                data = msg;
                outCount++;
            } else { // 'in'
                if (event === 'error') {
                    id = `edge-error-${index}`;
                    source = 'ldk';
                    target = 'runner';
                    sourceHandle = `left-${inCount % 20}`;
                    targetHandle = `right-${inCount % 20}`;
                    label = String(msg.data?.error || 'Error');
                    style = { stroke: '#dc2626', strokeWidth: 2, strokeDasharray: '6 3' };
                    markerEnd = { type: MarkerType.Arrow, color: '#dc2626', width: 12, height: 12 };
                    data = msg;
                } else {
                    id = `edge-in-${index}`;
                    source = 'ldk';
                    target = 'runner';
                    sourceHandle = `left-${inCount % 20}`;
                    targetHandle = `right-${inCount % 20}`;
                    label = String(event);
                    style = { stroke: '#f59e0b', strokeWidth: 2 };
                    markerEnd = { type: MarkerType.Arrow, color: '#f59e0b', width: 12, height: 12 };
                    data = msg;
                }
                inCount++;
            }

            newEdges.push({
                id,
                source,
                target,
                sourceHandle,
                targetHandle,
                label,
                type: 'straight',
                animated: false,
                style,
                markerEnd,
                data,
            });
        });

        setEdges(newEdges);
    }, [messages, connected, baseConnectionEdge, setEdges]);

    const handleClearMessages = useCallback(() => {
        // Reset to only base connection edge
        setEdges([baseConnectionEdge]);
        // Clear message store
        useStore.getState().clearMessages();
    }, [baseConnectionEdge, setEdges]);

    return (
        <>
            <Container
                header={
                    <Header
                        variant="h2"
                        description="Real-time visualization of Lightning Network protocol messages"
                        actions={
                            <SpaceBetween direction="horizontal" size="xs">
                                <Button
                                    onClick={handleConnectionToggle}
                                    loading={useStore(state => state.connectionState) === 'connecting'}
                                    disabled={useStore(state => state.connectionState) === 'connecting'}
                                    variant={connected ? "normal" : "primary"}
                                >
                                    {useStore(state => state.connectionState) === 'connecting' ? 'Connecting...' :
                                        connected ? 'Disconnect' : 'Connect'}
                                </Button>
                                <Button
                                    onClick={handleClearMessages}
                                    variant="normal"
                                >
                                    Clear Messages
                                </Button>
                            </SpaceBetween>
                        }
                    >
                        Lightning Network Protocol Visualizer
                    </Header>
                }
            >
                <SpaceBetween size="l">
                    {/* Flow Visualization */}
                    <Box>
                        <div style={{ height: '700px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                nodeTypes={nodeTypes}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                fitView
                                fitViewOptions={{
                                    padding: 0.2,
                                    minZoom: 0.8,
                                    maxZoom: 1.2
                                }}
                                minZoom={0.5}
                                maxZoom={2}
                                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                                style={{
                                    background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
                                }}
                                defaultEdgeOptions={{
                                    type: 'smoothstep',
                                }}
                                nodesDraggable={true}
                                nodesConnectable={connected}
                                elementsSelectable={true}
                            >
                                <Background
                                    color="#cbd5e1"
                                    gap={20}
                                    size={1}
                                />
                                <Controls
                                    showZoom={true}
                                    showFitView={true}
                                    showInteractive={false}
                                />
                            </ReactFlow>
                        </div>
                    </Box>

                    {/* Message Log Panel */}
                    {connected && (
                        <Box>
                            <MessageLog />
                        </Box>
                    )}
                </SpaceBetween>
            </Container>
        </>
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

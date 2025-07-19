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
    const { connected } = useStore();

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

    // Handle WebSocket events and create persistent message arrows with vertical stacking
    useEffect(() => {
        const handleMessage = (event: MessageFlowEvent) => {
            try {
                console.log('Processing message event:', event); // Debug log
                if (!event || !event.event) {
                    console.warn('Received invalid event:', event);
                    return;
                }

                const source = event.direction === 'out' ? 'runner' : 'ldk';
                const target = event.direction === 'out' ? 'ldk' : 'runner';
                const messageId = `message-${event.sequence_id || 'raw'}-${event.step || Date.now()}-${event.direction}`;

                // Create arrow direction indicator and message label
                let arrowDirection, messageLabel;

                if (event.direction === 'out') {
                    arrowDirection = '-->';
                    // For outgoing messages, show the actual message type
                    messageLabel = event.event === 'Msg' ?
                        (event.data?.msgtype || event.event) :
                        event.event;
                } else {
                    arrowDirection = '<--';
                    // For incoming messages, show what we expect/receive
                    if (event.event === 'ExpectMsg') {
                        messageLabel = event.data?.msgtype || 'Expected';
                    } else if (event.event === 'RawMsg') {
                        messageLabel = event.data?.msgtype || 'RawMsg';
                    } else {
                        messageLabel = event.event;
                    }
                }

                // Handle special case for RawMsg - could be incoming or outgoing
                if (event.event === 'RawMsg') {
                    // Check if this is actually an incoming message from LDK
                    const isIncomingRaw = event.data?.fromLDK || event.data?.received;
                    if (isIncomingRaw) {
                        // Override direction for incoming raw messages
                        const actualSource = 'ldk';
                        const actualTarget = 'runner';
                        arrowDirection = '<--';
                        messageLabel = `${event.data?.msgtype || 'RawMsg'}`;

                        const correctedMessageId = `message-${event.sequence_id || 'raw'}-${event.step || Date.now()}-in`;

                        // Create corrected message edge for incoming raw message
                        const correctedMessageEdge: Edge = {
                            id: correctedMessageId,
                            source: actualSource,
                            target: actualTarget,
                            type: 'straight',
                            animated: false,
                            style: {
                                stroke: '#f59e0b', // Orange for incoming
                                strokeWidth: 2,
                                strokeDasharray: '5 5', // Dashed for responses
                            },
                            markerEnd: {
                                type: MarkerType.Arrow,
                                color: '#f59e0b',
                                width: 12,
                                height: 12,
                            },
                            label: `${event.step ? `(${event.step})` : ''} ${messageLabel} ${arrowDirection}`,
                            labelStyle: {
                                fontSize: '8px',
                                fontWeight: 600,
                                color: 'white',
                                padding: '1px 3px',
                                borderRadius: '3px',
                                background: '#f59e0b',
                                whiteSpace: 'nowrap' as const,
                            },
                            labelBgStyle: {
                                fill: 'transparent',
                                fillOpacity: 0,
                            },
                            sourceHandle: `right-${(edges.filter(e => e.id.startsWith('message-') && e.data?.direction === 'in').length) % 10}`,
                            targetHandle: `left-${(edges.filter(e => e.id.startsWith('message-') && e.data?.direction === 'in').length) % 10}`,
                            data: {
                                step: event.step,
                                direction: 'in',
                                messageType: messageLabel,
                                stackIndex: (edges.filter(e => e.id.startsWith('message-') && e.data?.direction === 'in').length) % 10
                            }
                        };

                        setEdges((prevEdges) => [...prevEdges, correctedMessageEdge]);
                        useStore.getState().addMessage({ ...event, direction: 'in' });
                        return;
                    }
                }

                const stepLabel = event.step ? `(${event.step})` : '';

                // Calculate proper stacking for arrows
                const existingMessageEdges = edges.filter(edge => edge.id.startsWith('message-'));

                // Separate stacking for incoming vs outgoing
                const outgoingCount = existingMessageEdges.filter(edge => edge.data?.direction === 'out').length;
                const incomingCount = existingMessageEdges.filter(edge => edge.data?.direction === 'in').length;

                const actualStackIndex = event.direction === 'out' ? outgoingCount % 10 : incomingCount % 10;

                const messageEdge: Edge = {
                    id: messageId,
                    source,
                    target,
                    type: 'straight', // Use straight edges for cleaner arrow stacking
                    animated: false,
                    style: {
                        stroke: event.direction === 'out' ? '#3b82f6' : '#f59e0b',
                        strokeWidth: 2,
                        strokeDasharray: event.direction === 'in' ? '5 5' : '0', // Dashed for responses
                    },
                    markerEnd: {
                        type: MarkerType.Arrow,
                        color: event.direction === 'out' ? '#3b82f6' : '#f59e0b',
                        width: 12,
                        height: 12,
                    },
                    label: `${stepLabel} ${messageLabel} ${arrowDirection}`,
                    labelStyle: {
                        fontSize: '8px',
                        fontWeight: 600,
                        color: 'white',
                        padding: '1px 3px',
                        borderRadius: '3px',
                        background: event.direction === 'out' ? '#3b82f6' : '#f59e0b',
                        whiteSpace: 'nowrap' as const,
                    },
                    labelBgStyle: {
                        fill: 'transparent',
                        fillOpacity: 0,
                    },
                    // Use different handles for each arrow to create proper stacking
                    sourceHandle: event.direction === 'out' ? `right-${actualStackIndex}` : `left-${actualStackIndex}`,
                    targetHandle: event.direction === 'out' ? `left-${actualStackIndex}` : `right-${actualStackIndex}`,
                    data: {
                        step: event.step,
                        direction: event.direction,
                        messageType: messageLabel,
                        stackIndex: actualStackIndex
                    }
                };

                // Add the message edge to existing edges (keep all previous messages)
                setEdges((prevEdges) => {
                    // Keep all existing edges and add the new one
                    return [...prevEdges, messageEdge];
                });

                // Add message to store
                useStore.getState().addMessage(event);

                // No timeout removal - keep all arrows persistent
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
    }, [edges, setEdges]);

    // Add this effect to visualize every message in the store as an arrow
    useEffect(() => {
        setEdges((prevEdges) => {
            // Only add new edges for messages that don't already have an edge
            const existingIds = new Set(prevEdges.map(e => e.id));
            let outStack = 0;
            let inStack = 0;
            const newEdges = useStore.getState().messages.map((event, idx) => {
                const edgeId = `message-${event.timestamp}-${event.event}-${idx}`;
                if (existingIds.has(edgeId)) return null;
                let edgeColor = event.direction === 'out' ? '#3b82f6' : '#f59e0b';
                let markerColor = event.event === 'error' ? '#dc2626' : edgeColor;
                let sourceHandle = 'right-0';
                let targetHandle = 'left-0';
                let label = '';
                let labelStyle = {
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: edgeColor,
                    border: '1px solid ' + edgeColor,
                    whiteSpace: 'nowrap',
                    transform: `translateY(${idx * 24 - 24}px)`, // Offset each label vertically
                };
                let edgeStyle = {
                    stroke: edgeColor,
                    strokeWidth: 2,
                    strokeDasharray: '0',
                };
                if (event.direction === 'out') {
                    sourceHandle = `right-${outStack % 10}`;
                    targetHandle = `left-${outStack % 10}`;
                    outStack++;
                    // Badge for outgoing message name
                    label = `${event.event}`;
                } else {
                    sourceHandle = `left-${inStack % 10}`;
                    targetHandle = `right-${inStack % 10}`;
                    inStack++;
                    // Badge for error/incoming
                    if (event.event === 'error') {
                        edgeColor = '#dc2626';
                        markerColor = '#dc2626';
                        label = `Error: ${event.data?.error ? String(event.data.error).slice(0, 32) + (String(event.data.error).length > 32 ? '…' : '') : 'Unknown error'}`;
                        labelStyle.background = '#dc2626';
                        labelStyle.border = '1px solid #dc2626';
                        labelStyle.color = '#fff';
                        edgeStyle.stroke = '#dc2626';
                        edgeStyle.strokeDasharray = '6 3';
                    } else {
                        label = `${event.event}`;
                    }
                }
                return {
                    id: edgeId,
                    source: event.direction === 'out' ? 'runner' : 'ldk',
                    target: event.direction === 'out' ? 'ldk' : 'runner',
                    type: 'straight',
                    animated: false,
                    style: edgeStyle,
                    markerEnd: {
                        type: MarkerType.Arrow,
                        color: markerColor,
                        width: 12,
                        height: 12,
                    },
                    label,
                    labelStyle,
                    labelBgStyle: {
                        fill: 'transparent',
                        fillOpacity: 0,
                    },
                    sourceHandle,
                    targetHandle,
                    data: {
                        step: event.step,
                        direction: event.direction,
                        messageType: event.event,
                        isError: event.event === 'error',
                    }
                };
            }).filter(Boolean);
            return [baseConnectionEdge, ...prevEdges.filter(e => e.id === 'base-connection'), ...newEdges];
        });
    }, [useStore.getState().messages]);

    // Sequence diagram edge logic
    useEffect(() => {
        const messages = useStore.getState().messages;
        const newEdges: Edge<any>[] = [];

        // Outgoing (Runner -> LDK)
        let outCount = 0;
        messages.forEach((msg, idx) => {
            if (msg.direction === 'out') {
                newEdges.push({
                    id: `edge-out-${outCount}`,
                    source: 'runner',
                    target: 'ldk',
                    sourceHandle: `right-${outCount}`,
                    targetHandle: `left-${outCount}`,
                    label: String(msg.event),
                    labelStyle: { background: '#3b82f6', color: '#fff', fontWeight: 700 },
                    type: 'straight',
                    animated: false,
                    style: { stroke: '#3b82f6', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.Arrow, color: '#3b82f6', width: 12, height: 12 },
                    data: msg,
                });
                outCount++;
            }
        });

        // Incoming error (LDK -> Runner)
        let errorCount = 0;
        messages.forEach((msg, idx) => {
            if (msg.event === 'error' && msg.direction === 'in') {
                newEdges.push({
                    id: `edge-error-${errorCount}`,
                    source: 'ldk',
                    target: 'runner',
                    sourceHandle: `left-${errorCount}`,
                    targetHandle: `right-${errorCount}`,
                    label: String(msg.data?.error || 'Error'),
                    labelStyle: { background: '#dc2626', color: '#fff', fontWeight: 700 },
                    type: 'straight',
                    animated: false,
                    style: { stroke: '#dc2626', strokeWidth: 2, strokeDasharray: '6 3' },
                    markerEnd: { type: MarkerType.Arrow, color: '#dc2626', width: 12, height: 12 },
                    data: msg,
                });
                errorCount++;
            }
        });

        setEdges(newEdges);
    }, [useStore.getState().messages]);

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

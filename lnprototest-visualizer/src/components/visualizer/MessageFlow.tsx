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
        minHeight: '200px',
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

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: data.type === 'runner' ? '#3b82f6' : '#eab308',
          width: 12,
          height: 12,
          opacity: data.isConnected ? 1 : 0.5
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: data.type === 'runner' ? '#3b82f6' : '#eab308',
          width: 12,
          height: 12,
          opacity: data.isConnected ? 1 : 0.5
        }}
      />

      {/* Additional handles for stacking arrows */}
      {[...Array(10)].map((_, i) => (
        <React.Fragment key={i}>
          <Handle
            type="source"
            position={Position.Right}
            id={`right-${i}`}
            style={{
              background: data.type === 'runner' ? '#3b82f6' : '#eab308',
              width: 8,
              height: 8,
              opacity: data.isConnected ? 0.7 : 0.3,
              top: `${15 + i * 8}%`,
              right: '-4px'
            }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id={`left-${i}`}
            style={{
              background: data.type === 'runner' ? '#3b82f6' : '#eab308',
              width: 8,
              height: 8,
              opacity: data.isConnected ? 0.7 : 0.3,
              top: `${15 + i * 8}%`,
              left: '-4px'
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
    position: { x: 100, y: 250 },
    data: { label: 'Protocol Runner', type: 'runner', isConnected: false },
    draggable: true,
  },
  {
    id: 'ldk',
    type: 'custom',
    position: { x: 650, y: 250 },
    data: { label: 'LDK Node', type: 'ldk', isConnected: false },
    draggable: true,
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
    });

    return () => {
      unsubscribeMessage();
      unsubscribeError();
    };
  }, [edges, setEdges]);

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

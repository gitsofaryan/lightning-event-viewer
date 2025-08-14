import React, { useState } from 'react';
import {
  Box,
  Container,
  Header,
  Tabs,
  SpaceBetween,
  Button,
  Table,
  TextFilter,
  Textarea,
  Alert
} from '@cloudscape-design/components';
import { useStore } from '../../store';
import api from '../../api/api';

const MessageList: React.FC = () => {
  const availableMessages = useStore(state => state.availableMessages);
  const selectedMessage = useStore(state => state.selectedMessage);
  const selectMessage = useStore(state => state.selectMessage);
  const sendMessage = useStore(state => state.sendMessage);
  const connected = useStore(state => state.connected);

  const [filterText, setFilterText] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [customEvents, setCustomEvents] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');

  const filteredMessages = availableMessages.filter(message => {
    const matchesFilter = message.name.toLowerCase().includes(filterText.toLowerCase()) ||
      message.description.toLowerCase().includes(filterText.toLowerCase());
    const matchesCategory = activeCategory === 'all' || message.category === activeCategory;

    return matchesFilter && matchesCategory;
  });

  const handleSendMessage = async () => {
    if (selectedMessage && connected) {
      await sendMessage(selectedMessage.type, selectedMessage.content);
      selectMessage(null);
    }
  };

  const handleSendCustomEvents = async () => {
    setLoading(true);
    try {
      const events = JSON.parse(customEvents);
      const response = await api.runCustomEvents(events);
      setLastResponse(`Success: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setLastResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const exampleEvents = [
    { type: "connect", connprivkey: "03" },
    { type: "send", msg: { type: "init", connprivkey: "03" } }
  ];

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Select a message to send to the Lightning node"
        >
          Message Catalog
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Tabs
          tabs={
            [
              {
                id: 'all',
                label: 'All',
                content: (
                  <Box padding={{ top: 'l' }}>
                    <TextFilter
                      filteringText={filterText}
                      onChange={({ detail }) => setFilterText(detail.filteringText)}
                      filteringPlaceholder="Find messages"
                    />
                  </Box>
                )
              },
              {
                id: 'custom',
                label: 'Custom Events',
                content: (
                  <Box padding={{ top: 'l' }}>
                    <SpaceBetween size="m">
                      <Alert>
                        Send custom events directly to the backend. Use the exact format expected by the API.
                      </Alert>
                      <Textarea
                        value={customEvents}
                        onChange={({ detail }) => setCustomEvents(detail.value)}
                        placeholder={JSON.stringify(exampleEvents, null, 2)}
                        rows={8}
                      />
                      <Button
                        variant="primary"
                        loading={loading}
                        disabled={!customEvents.trim()}
                        onClick={handleSendCustomEvents}
                      >
                        Send Custom Events
                      </Button>
                      {lastResponse && (
                        <Box>
                          <pre style={{
                            background: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {lastResponse}
                          </pre>
                        </Box>
                      )}
                    </SpaceBetween>
                  </Box>
                )
              },
              {
                id: 'connection',
                label: 'Connection',
                content: null
              },
              {
                id: 'channel',
                label: 'Channel',
                content: null
              },
              {
                id: 'commitment',
                label: 'Commitment',
                content: null
              },
              {
                id: 'routing',
                label: 'Routing',
                content: null
              }
            ]
          }
          onChange={({ detail }) => setActiveCategory(detail.activeTabId)}
        />

        {activeCategory !== 'custom' && (
          <>
            <Table
              items={filteredMessages}
              trackBy="id"
              selectionType="single"
              selectedItems={selectedMessage ? [selectedMessage] : []}
              onSelectionChange={({ detail }) => {
                selectMessage(detail.selectedItems[0]);
              }}
              columnDefinitions={
                [
                  {
                    id: 'name',
                    header: 'Message',
                    cell: item => item.name,
                    sortingField: 'name'
                  },
                  {
                    id: 'description',
                    header: 'Description',
                    cell: item => item.description
                  },
                  {
                    id: 'category',
                    header: 'Category',
                    cell: item => item.category.charAt(0).toUpperCase() + item.category.slice(1)
                  }
                ]
              }
              empty={
                <Box textAlign="center" color="inherit">
                  <b>No messages</b>
                  <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                    No messages match the current filter.
                  </Box>
                </Box>
              }
            />

            <Box textAlign="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  disabled={!selectedMessage || !connected}
                  variant="primary"
                  onClick={handleSendMessage}
                >
                  Send Message
                </Button>
              </SpaceBetween>
            </Box>
          </>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default MessageList;
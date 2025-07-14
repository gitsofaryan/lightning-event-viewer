import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout, ContentLayout } from '@cloudscape-design/components';
import AppNavigation from './components/layout/AppNavigation';
import Header from './components/layout/Header';
import VisualizerPage from './pages/VisualizerPage';
import SettingsPage from './pages/SettingsPage';
import DocsPage from './pages/DocsPage';
import { apiClient } from './api/client';
import { useStore } from './store';

function App() {
  const [navigationOpen, setNavigationOpen] = React.useState(false);
  const addMessage = useStore(state => state.addMessage);
  const setConnectionState = useStore(state => state.setConnectionState);

  useEffect(() => {
    // Initialize WebSocket connection and set up event handlers
    const initializeWebSocket = async () => {
      try {
        await apiClient.connectWebSocket();
        setConnectionState('connected');
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setConnectionState('disconnected');
      }
    };

    // Set up event handlers
    const unsubscribeMessage = apiClient.onMessage((event) => {
      addMessage(event);
    });

    const unsubscribeError = apiClient.onError((error) => {
      console.error('WebSocket error:', error);
      addMessage({
        direction: 'in',
        event: 'error',
        data: { error: error.error },
        timestamp: Date.now(),
      });
    });

    const unsubscribeConnection = apiClient.onConnection((connected) => {
      setConnectionState(connected ? 'connected' : 'disconnected');
    });

    // Initialize connection
    initializeWebSocket();

    // Cleanup on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeError();
      unsubscribeConnection();
      apiClient.disconnect();
    };
  }, [addMessage, setConnectionState]);

  return (
    <AppLayout
      navigation={<AppNavigation />}
      navigationOpen={navigationOpen}
      onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
      content={
        <ContentLayout header={<Header />}>
          <Routes>
            <Route path="/" element={<VisualizerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/docs" element={<DocsPage />} />
          </Routes>
        </ContentLayout>
      }
      toolsHide
    />
  );
}

export default App;
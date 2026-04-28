import { useEffect, useRef } from 'react';
import { apiClient } from '../api/client';
import { useStore } from '../store';

/**
 * Hook to send a heartbeat request to the server every 15 seconds
 * to maintain the connection and monitor server health.
 */
export const useHeartbeat = (intervalMs: number = 15000) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const connected = useStore(state => state.connected);

  useEffect(() => {
    // Only run heartbeat if the app "thinks" it should be connected
    if (!connected) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const sendHeartbeat = async () => {
      try {
        await apiClient.heartbeat();
        console.debug('Heartbeat successful');
      } catch (error) {
        console.error('Heartbeat failed:', error);
        // We don't necessarily want to disconnect here, 
        // but we could set a warning state in the store if needed.
      }
    };

    // Initial heartbeat
    sendHeartbeat();

    // Setup interval
    timerRef.current = setInterval(sendHeartbeat, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [connected, intervalMs]);
};

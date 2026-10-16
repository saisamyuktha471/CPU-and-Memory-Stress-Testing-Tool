import { useState, useEffect, useRef, useCallback } from 'react';

export function useMetricsStream(maxPoints = 40) {
  const [latestMetrics, setLatestMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use window.location.host in dev with Vite proxy, or fallback directly to port 8000
    const host = window.location.host || '127.0.0.1:8000';
    const wsUrl = `${protocol}//${host}/ws/metrics`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const snapshot = JSON.parse(event.data);
          const timeLabel = new Date(snapshot.timestamp * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });

          const point = {
            ...snapshot,
            timeLabel,
          };

          setLatestMetrics(point);
          setHistory((prev) => {
            const next = [...prev, point];
            if (next.length > maxPoints) {
              return next.slice(next.length - maxPoints);
            }
            return next;
          });
        } catch (e) {
          console.error('Error parsing metrics WebSocket message:', e);
        }
      };

      ws.onerror = (e) => {
        setIsConnected(false);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        // Schedule reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };
    } catch (err) {
      setError(err.message);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    }
  }, [maxPoints]);

  const sendInterval = useCallback((intervalSeconds) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ interval: intervalSeconds }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return {
    latestMetrics,
    history,
    isConnected,
    error,
    sendInterval,
  };
}

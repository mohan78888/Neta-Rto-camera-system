'use client';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function useSocket(handlers = {}) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: '/api/socket',
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to backend gateway');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from backend gateway');
      setConnected(false);
    });

    Object.keys(handlersRef.current).forEach((event) => {
      socket.on(event, (payload) => handlersRef.current[event]?.(payload));
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connected };
}

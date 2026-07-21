import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const activeConversationIdRef = useRef(null);
  const [reconnectCounter, setReconnectCounter] = useState(0);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const newSocket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('[SocketContext] Connected to server, socket ID:', newSocket.id);
      setIsConnected(true);

      // If reconnected while having an active conversation, re-join the room
      if (activeConversationIdRef.current) {
        const convId = activeConversationIdRef.current;
        console.log('[SocketContext] Re-joining conversation room on reconnect:', convId);
        newSocket.emit('join_conversation', convId);
        setReconnectCounter(prev => prev + 1);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('[SocketContext] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[SocketContext] Connection error:', err.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const joinConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    activeConversationIdRef.current = conversationId;
    if (socket && socket.connected) {
      console.log('[SocketContext] Joining conversation room:', conversationId);
      socket.emit('join_conversation', conversationId);
    }
  }, [socket]);

  const leaveConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    if (activeConversationIdRef.current === conversationId) {
      activeConversationIdRef.current = null;
    }
    if (socket && socket.connected) {
      console.log('[SocketContext] Leaving conversation room:', conversationId);
      socket.emit('leave_conversation', conversationId);
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      joinConversation,
      leaveConversation,
      activeConversationId: activeConversationIdRef.current,
      reconnectCounter
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

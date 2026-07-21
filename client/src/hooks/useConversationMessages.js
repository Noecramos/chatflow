import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export function useConversationMessages(conversationId) {
  const { socket, isConnected, joinConversation, leaveConversation, reconnectCounter } = useSocket();
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchedAtRef = useRef(null);

  // Fetch full message list or backfill
  const fetchMessages = useCallback(async (isBackfill = false) => {
    if (!conversationId || !token) return;
    try {
      if (!isBackfill) setLoading(true);
      const res = await fetch(`/inbox/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        lastFetchedAtRef.current = new Date().toISOString();
      }
    } catch (err) {
      console.error('[useConversationMessages] Failed to fetch messages:', err);
      setError(err.message);
    } finally {
      if (!isBackfill) setLoading(false);
    }
  }, [conversationId, token]);

  // Handle room joining and initial fetch
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    joinConversation(conversationId);
    fetchMessages();

    return () => {
      leaveConversation(conversationId);
    };
  }, [conversationId, joinConversation, leaveConversation, fetchMessages]);

  // Handle socket reconnection backfill
  useEffect(() => {
    if (reconnectCounter > 0 && conversationId) {
      console.log('[useConversationMessages] Reconnect detected, backfilling messages for conversation:', conversationId);
      fetchMessages(true);
    }
  }, [reconnectCounter, conversationId, fetchMessages]);

  // Listen for live socket message events
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleNewMessage = (incomingMsg) => {
      // Check if message belongs to this conversation
      if (incomingMsg.conversationId !== conversationId && incomingMsg.conversation?.id !== conversationId) {
        return;
      }

      setMessages(prev => {
        // If message already exists (e.g. reconciled from optimistic UI or duplicate event)
        const existsIndex = prev.findIndex(m => m.id === incomingMsg.id || (m.tempId && m.tempId === incomingMsg.tempId));
        if (existsIndex >= 0) {
          const updated = [...prev];
          updated[existsIndex] = { ...incomingMsg, isSending: false };
          return updated;
        }
        return [...prev, { ...incomingMsg, isSending: false }];
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message', handleNewMessage);
    };
  }, [socket, conversationId]);

  // Optimistic message send helper
  const addOptimisticMessage = useCallback((content, senderType = 'AGENT', metadata = {}) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMsg = {
      id: tempId,
      tempId,
      conversationId,
      senderType,
      content,
      metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
      createdAt: new Date().toISOString(),
      isSending: true
    };

    setMessages(prev => [...prev, tempMsg]);
    return tempId;
  }, [conversationId]);

  return {
    messages,
    setMessages,
    loading,
    error,
    refetch: fetchMessages,
    addOptimisticMessage
  };
}

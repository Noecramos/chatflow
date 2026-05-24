import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, User, Tag, FileText, Send, ShoppingCart, 
  Bot, RefreshCw, Layers, ShieldAlert, Sparkles, UserCheck 
} from 'lucide-react';
import io from 'socket.io-client';

export default function OmnichannelInbox({ token, user }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  
  // Sidebar Search & Filter state
  const [searchFilter, setSearchFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');

  // Sidebar Metadata fields
  const [assignedUser, setAssignedUser] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');

  // AI Suggestions
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [generatingSuggestion, setGeneratingSuggestion] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch active conversation list
  const fetchConversations = async () => {
    try {
      const res = await fetch('/inbox/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (e) {
      console.error("Failed to load omnichannel conversations:", e);
    }
  };

  // Fetch history details for a single conversation
  const fetchConversationDetails = async (convId) => {
    try {
      const res = await fetch(`/inbox/conversations/${convId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        setCartItems(data.cartItems || []);
        setAiSuggestion(''); // Clear past suggestions
      }
    } catch (e) {
      console.error("Failed to load conversation history:", e);
    }
  };

  // Socket Connections & Real-time setup
  useEffect(() => {
    if (!token) return;

    fetchConversations();

    const socket = io('http://localhost:5000', {
      auth: { token }
    });
    
    socketRef.current = socket;

    socket.on('message_received', (data) => {
      console.log("[Socket client] Inbox message arrived:", data);
      
      // Update local sidebar threads dynamically
      setConversations(prev => {
        const idx = prev.findIndex(s => s.id === data.session.id);
        const updated = {
          ...data.session,
          contact: prev[idx]?.contact || data.session.contact || { name: 'Visitor' },
          channel: prev[idx]?.channel || data.session.channel || { type: 'WHATSAPP' },
          bot: prev[idx]?.bot || data.session.bot || { name: 'Volt AI' }
        };
        
        if (idx > -1) {
          const arr = [...prev];
          arr.splice(idx, 1);
          return [updated, ...arr];
        }
        return [updated, ...prev];
      });

      // Append chat to list if currently focusing on it
      if (activeConv && activeConv.id === data.session.id) {
        setMessages(prev => [...prev, data.message]);
        // Trigger cart items refetch if cart is updated
        if (data.message.content.toLowerCase().includes("cart") || data.message.content.toLowerCase().includes("order")) {
          fetchConversationDetails(activeConv.id);
        }
      }
    });

    socket.on('message_sent', (data) => {
      if (activeConv && activeConv.id === data.session.id) {
        setMessages(prev => [...prev, data.message]);
      }
      fetchConversations();
    });

    socket.on('session_updated', (data) => {
      setConversations(prev => prev.map(s => s.id === data.session.id ? {
        ...data.session,
        contact: s.contact,
        channel: s.channel,
        bot: s.bot
      } : s));
      
      if (activeConv && activeConv.id === data.session.id) {
        setActiveConv(prev => ({
          ...prev,
          ...data.session
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, activeConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConv = (conv) => {
    // Leave previous thread room to minimize overhead
    if (activeConv && socketRef.current) {
      socketRef.current.emit('leave_conversation', activeConv.id);
    }

    setActiveConv(conv);
    setAssignedUser(conv.assignedUserId || '');
    setLabel(conv.label || '');
    setNotes(conv.notes || '');
    fetchConversationDetails(conv.id);

    // Join focused thread room for real-time messages streaming
    if (socketRef.current) {
      socketRef.current.emit('join_conversation', conv.id);
    }
  };


  // Submit manual live agent message
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConv) return;

    const body = { content: replyText };
    setReplyText('');

    try {
      const res = await fetch(`/inbox/conversations/${activeConv.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to deliver response.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Human Takeover (take control from AI bot)
  const handleToggleHandover = async () => {
    if (!activeConv) return;
    setHandoverLoading(true);

    const targetState = !activeConv.isHumanHandoverActive;

    try {
      const res = await fetch(`/inbox/conversations/${activeConv.id}/handover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isHumanHandoverActive: targetState })
      });
      const data = await res.json();
      if (data.success) {
        setActiveConv(prev => ({ ...prev, isHumanHandoverActive: targetState }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHandoverLoading(false);
    }
  };

  // Save changes to CRM properties
  const handleSaveProperties = async () => {
    if (!activeConv) return;
    setMetaLoading(true);

    try {
      const res = await fetch(`/inbox/conversations/${activeConv.id}/properties`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ label, notes })
      });
      const data = await res.json();
      if (data.success) {
        alert("Conversation properties updated successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMetaLoading(false);
    }
  };

  // Assign agent user
  const handleAssignUser = async (userId) => {
    if (!activeConv) return;
    setAssignedUser(userId);

    try {
      await fetch(`/inbox/conversations/${activeConv.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Generate AI Suggestion (Copilot reply draft)
  const handleGenerateSuggestion = async () => {
    if (!activeConv) return;
    setGeneratingSuggestion(true);
    setAiSuggestion('');

    try {
      const res = await fetch(`/inbox/conversations/${activeConv.id}/suggestions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAiSuggestion(data.suggestion);
      } else {
        alert(data.error || "Failed to generate copilot reply.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingSuggestion(false);
    }
  };

  const renderChannelBadge = (type) => {
    const norm = type?.toUpperCase();
    if (norm === 'WHATSAPP') return <span className="badge badge-whatsapp">WhatsApp</span>;
    if (norm === 'INSTAGRAM') return <span className="badge badge-instagram">Instagram</span>;
    if (norm === 'MESSENGER') return <span className="badge badge-messenger">Messenger</span>;
    return <span className="badge badge-widget">Web widget</span>;
  };

  // Filters threads
  const filteredConversations = conversations.filter(c => {
    const contactName = c.contact?.name || '';
    const platformId = c.contact?.platformId || '';
    const matchesSearch = contactName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          platformId.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          (c.label && c.label.toLowerCase().includes(searchFilter.toLowerCase()));
    
    const matchesChannel = channelFilter === 'ALL' || c.channel.type.toUpperCase() === channelFilter.toUpperCase();
    
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="glass" style={{ display: 'flex', height: 'calc(100vh - 110px)', margin: '20px', overflow: 'hidden' }}>
      
      {/* 1. Side List Scroller */}
      <div style={{ width: '320px', borderRight: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', background: 'hsl(var(--bg-card) / 0.3)' }}>
        
        {/* Filters */}
        <div style={{ padding: '15px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'hsl(var(--primary))' }} /> Conversations
            </h3>
            <button onClick={fetchConversations} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>
              <RefreshCw size={14} />
            </button>
          </div>
          
          <input 
            type="text" 
            placeholder="Search channels & contacts..." 
            value={searchFilter} 
            onChange={(e) => setSearchFilter(e.target.value)} 
            style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
          />

          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['ALL', 'WHATSAPP', 'INSTAGRAM', 'MESSENGER', 'WIDGET'].map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                style={{
                  background: channelFilter === ch ? 'hsl(var(--primary))' : 'hsl(var(--border) / 0.4)',
                  color: channelFilter === ch ? '#fff' : 'hsl(var(--text-muted))',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Scroller list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>
              No conversations found.
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = activeConv && activeConv.id === conv.id;
              const isHandover = conv.isHumanHandoverActive;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid hsl(var(--border) / 0.5)',
                    cursor: 'pointer',
                    background: isActive ? 'hsl(var(--primary-glow) / 0.5)' : 'transparent',
                    borderLeft: isActive ? '3px solid hsl(var(--primary))' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {conv.contact?.name || 'Visitor'}
                      {isHandover && <UserCheck size={13} style={{ color: 'hsl(var(--secondary))' }} title="Agent Assumed" />}
                    </span>
                    <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {renderChannelBadge(conv.channel.type)}
                    {conv.label && (
                      <span style={{ fontSize: '10px', background: 'hsl(var(--border))', padding: '2px 6px', borderRadius: '4px', color: 'hsl(var(--text-muted))' }}>
                        {conv.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Middle Panel: Messages History Timeline */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'hsl(var(--bg-main) / 0.1)' }}>
        {activeConv ? (
          <>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--bg-card) / 0.2)' }}>
              <div>
                <h4 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeConv.contact?.name || 'Customer'}
                  {renderChannelBadge(activeConv.channel.type)}
                </h4>
                <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                  Platform ID: <code>{activeConv.contact?.platformId}</code> | Bot: <strong>{activeConv.bot?.name || "Volt AI"}</strong>
                </p>
              </div>

              {/* Handover & Smart Suggestions Action controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleGenerateSuggestion}
                  disabled={generatingSuggestion}
                  style={{
                    background: 'transparent',
                    border: '1px solid hsl(var(--primary))',
                    color: 'hsl(var(--primary))',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} className="pulse-glowing" />
                  {generatingSuggestion ? "Thinking..." : "AI Suggestion"}
                </button>

                <button
                  onClick={handleToggleHandover}
                  disabled={handoverLoading}
                  style={{
                    background: activeConv.isHumanHandoverActive 
                      ? 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--secondary) / 0.8))'
                      : 'hsl(var(--border))',
                    border: 'none',
                    color: activeConv.isHumanHandoverActive ? '#000' : 'hsl(var(--text-main))',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Bot size={14} />
                  {activeConv.isHumanHandoverActive ? "AI Muted (Live)" : "AI Replying (Auto)"}
                </button>
              </div>
            </div>

            {/* AI Suggestion box */}
            {aiSuggestion && (
              <div className="glass" style={{ margin: '15px 24px 0 24px', padding: '15px', background: 'hsl(var(--primary-glow) / 0.25)', borderColor: 'hsl(var(--primary) / 0.4)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={12} /> AI ASSISTANT SUGGESTED CO-REPLY
                  </span>
                  <button onClick={() => setAiSuggestion('')} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', fontSize: '11px' }}>
                    Dismiss
                  </button>
                </div>
                <p style={{ fontSize: '13px', lineHeight: '1.4', margin: 0, fontStyle: 'italic' }}>
                  "{aiSuggestion}"
                </p>
                <button
                  onClick={() => { setReplyText(aiSuggestion); setAiSuggestion(''); }}
                  className="btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '4px 10px', fontSize: '11px' }}
                >
                  Use Draft Reply
                </button>
              </div>
            )}

            {/* Messages timeline */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {messages.map((msg) => {
                const isUser = msg.senderType === 'USER';
                const isSystem = msg.senderType === 'SYSTEM';
                const isAgent = msg.senderType === 'AGENT';

                if (isSystem) {
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                      <div className="glass" style={{ padding: '6px 16px', borderRadius: '16px', fontSize: '11px', color: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'hsl(var(--secondary) / 0.3)' }}>
                        <ShieldAlert size={12} /> {msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-start' : 'flex-end',
                      maxWidth: '80%',
                      alignSelf: isUser ? 'flex-start' : 'flex-end'
                    }}
                  >
                    <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginBottom: '3px', padding: '0 4px' }}>
                      {isUser ? activeConv.contact?.name : (isAgent ? "Agent (You)" : `${activeConv.bot?.name || "Volt AI"}`)}
                    </span>
                    
                    <div
                      style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        background: isUser 
                          ? 'hsl(var(--border) / 0.5)' 
                          : (isAgent ? 'linear-gradient(135deg, hsl(var(--secondary) / 0.3), hsl(var(--secondary) / 0.15))' : 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.2))'),
                        border: '1px solid',
                        borderColor: isUser 
                          ? 'hsl(var(--border))' 
                          : (isAgent ? 'hsl(var(--secondary) / 0.3)' : 'hsl(var(--primary) / 0.3)'),
                        color: 'hsl(var(--text-main))',
                        boxShadow: isUser ? 'none' : (isAgent ? '0 0 10px hsl(var(--secondary-glow))' : '0 0 10px hsl(var(--primary-glow))')
                      }}
                    >
                      {msg.content}
                    </div>

                    <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))', marginTop: '3px', alignSelf: isUser ? 'flex-start' : 'flex-end', padding: '0 4px' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <form onSubmit={handleSendReply} style={{ padding: '16px 20px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card) / 0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Quick Replies Dropdown */}
              {activeConv.isHumanHandoverActive && (() => {
                const saved = localStorage.getItem('chatvolt_quick_replies');
                const qrs = saved ? JSON.parse(saved) : [];
                if (qrs.length === 0) return null;
                return (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>Resposta Rápida:</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setReplyText(e.target.value);
                          e.target.value = ''; // Reset select
                        }
                      }}
                      style={{
                        background: 'hsl(var(--border) / 0.4)',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        outline: 'none',
                        color: 'hsl(var(--text-main))',
                        maxWidth: '220px'
                      }}
                    >
                      <option value="">Selecionar modelo...</option>
                      {qrs.map(qr => (
                        <option key={qr.id} value={qr.content}>{qr.title}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={activeConv.isHumanHandoverActive 
                    ? "Type your live agent reply here..." 
                    : "AI is active. Toggle Live reply mode to send manual responses."}
                  disabled={!activeConv.isHumanHandoverActive}
                  style={{
                    flex: 1,
                    background: 'hsl(var(--border) / 0.4)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!activeConv.isHumanHandoverActive || !replyText.trim()}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: activeConv.isHumanHandoverActive 
                      ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))'
                      : 'hsl(var(--border))',
                    cursor: activeConv.isHumanHandoverActive ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Send size={14} /> Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))' }}>
            <MessageSquare size={48} style={{ color: 'hsl(var(--border))', marginBottom: '14px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Select a Conversation</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Choose a customer thread to begin live omnichannel agent operations.</p>
          </div>
        )}
      </div>

      {/* 3. Right Sidebar: Customer Meta Details & Active Cart Inspector */}
      {activeConv && (
        <div style={{ width: '300px', borderLeft: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', background: 'hsl(var(--bg-card) / 0.3)', padding: '20px', gap: '20px', overflowY: 'auto' }}>
          
          {/* Assigned Agent */}
          <div>
            <h4 style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <User size={14} /> Assigned Agent
            </h4>
            <select
              value={assignedUser}
              onChange={(e) => handleAssignUser(e.target.value)}
              style={{
                width: '100%',
                background: 'hsl(var(--border) / 0.5)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              <option value="">Unassigned</option>
              <option value={user.id}>{user.firstName} {user.lastName} (You)</option>
            </select>
          </div>

          {/* Contact profile */}
          <div>
            <h4 style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contact Profile
            </h4>
            <div className="glass" style={{ padding: '12px', borderRadius: '6px', background: 'hsl(var(--bg-card) / 0.2)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Name:</strong> {activeConv.contact?.name}</div>
              <div><strong>Platform:</strong> {activeConv.contact?.platformType}</div>
              <div><strong>Recipient ID:</strong> <code style={{ fontSize: '11px' }}>{activeConv.contact?.platformId}</code></div>
              {activeConv.contact?.phone && <div><strong>Phone:</strong> {activeConv.contact.phone}</div>}
              {activeConv.contact?.email && <div><strong>Email:</strong> {activeConv.contact.email}</div>}
            </div>
          </div>

          {/* Properties */}
          <div>
            <h4 style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Tag size={14} /> Labels
            </h4>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={{
                width: '100%',
                background: 'hsl(var(--border) / 0.5)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '13px',
                outline: 'none',
                marginBottom: '14px'
              }}
            >
              <option value="">No Label</option>
              <option value="Lead">Lead</option>
              <option value="Billing">Billing</option>
              <option value="Support">Support</option>
              <option value="Spam">Spam</option>
            </select>

            <h4 style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <FileText size={14} /> CRM Internal Notes
            </h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record transaction summaries or customer preferences..."
              rows={4}
              style={{
                width: '100%',
                background: 'hsl(var(--border) / 0.5)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '12px',
                outline: 'none',
                resize: 'none',
                lineHeight: '1.4',
                marginBottom: '10px'
              }}
            />

            <button
              onClick={handleSaveProperties}
              disabled={metaLoading}
              className="btn-secondary"
              style={{ width: '100%', padding: '8px', fontSize: '12px' }}
            >
              {metaLoading ? "Saving..." : "Save Properties"}
            </button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border))', margin: '0' }} />

          {/* Active Shopping Cart Inspector */}
          <div>
            <h4 style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <ShoppingCart size={14} style={{ color: 'hsl(var(--secondary))' }} /> Active Shopping Cart
            </h4>
            
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 10px', border: '1px dashed hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--text-muted))', fontSize: '12px' }}>
                Customer cart is currently empty.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cartItems.map((item) => (
                  <div key={item.id} className="glass" style={{ padding: '8px 12px', borderRadius: '6px', background: 'hsl(var(--bg-card) / 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderColor: 'hsl(var(--border) / 0.5)' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{item.name}</div>
                      <div style={{ color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Qty: {item.quantity} × ${item.price.toFixed(2)}</div>
                    </div>
                    <div style={{ fontWeight: '700', color: 'hsl(var(--secondary))' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontSize: '13px', fontWeight: '700', marginTop: '6px' }}>
                  <span>Total Est:</span>
                  <span style={{ color: 'hsl(var(--secondary))' }}>
                    ${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

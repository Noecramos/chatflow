import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, User, Tag, FileText, Send, ShoppingCart, 
  Bot, RefreshCw, Layers, ShieldAlert, Sparkles, UserCheck,
  Search, AlertTriangle, CheckCircle, Clock, Eye, EyeOff, X, Plus, Hash
} from 'lucide-react';
import io from 'socket.io-client';

const STATUS_TABS = [
  { key: 'unresolved', label: 'Não Resolvidas', icon: Clock },
  { key: 'unread', label: 'Não Lidas', icon: EyeOff },
  { key: 'human_requested', label: 'Humano Solicitado', icon: UserCheck },
  { key: 'resolved', label: 'Resolvidas', icon: CheckCircle },
  { key: 'all', label: 'Todas conversas', icon: MessageSquare }
];

const PRIORITY_OPTIONS = [
  { key: 'BAIXA', label: 'Baixa', color: '#4caf50' },
  { key: 'MEDIA', label: 'Média', color: '#ff9800' },
  { key: 'ALTA', label: 'Alta', color: '#f44336' },
  { key: 'URGENTE', label: 'Urgente', color: '#d50000' }
];

const STATUS_OPTIONS = [
  { key: 'OPEN', label: 'Não Resolvida', color: '#f44336' },
  { key: 'PENDING', label: 'Pendente', color: '#ff9800' },
  { key: 'CLOSED', label: 'Resolvida', color: '#4caf50' }
];

export default function OmnichannelInbox({ token, user }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  
  // Tab & Filter state
  const [activeTab, setActiveTab] = useState('unresolved');
  const [searchFilter, setSearchFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [tabCounts, setTabCounts] = useState({});
  const [stats, setStats] = useState({ totalConversations: 0, distinctChannels: 0 });

  // Sidebar Metadata fields
  const [assignedUser, setAssignedUser] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('MEDIA');
  const [convStatus, setConvStatus] = useState('OPEN');
  const [convTags, setConvTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  // Detail panel tab
  const [detailTab, setDetailTab] = useState('details'); // details | notes

  // AI Suggestions
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [generatingSuggestion, setGeneratingSuggestion] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch conversation list with current tab/filters
  const fetchConversations = async (tabOverride) => {
    try {
      const t = tabOverride || activeTab;
      const params = new URLSearchParams({ tab: t });
      if (channelFilter !== 'ALL') params.set('channel', channelFilter);
      if (searchFilter.trim()) params.set('search', searchFilter.trim());

      const res = await fetch(`/inbox/conversations?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
        if (data.tabCounts) setTabCounts(data.tabCounts);
        if (data.stats) setStats(data.stats);
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
        setAiSuggestion('');
      }
    } catch (e) {
      console.error("Failed to load conversation history:", e);
    }
  };

  // Mark conversation as read
  const markAsRead = async (convId) => {
    try {
      await fetch(`/inbox/conversations/${convId}/properties`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isRead: true })
      });
    } catch (e) { console.error(e); }
  };

  // Socket Connections & Real-time setup
  useEffect(() => {
    if (!token) return;

    fetchConversations();

    const socket = io(window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin, {
      auth: { token }
    });
    
    socketRef.current = socket;

    socket.on('message_received', (data) => {
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

      if (activeConv && activeConv.id === data.session.id) {
        setMessages(prev => [...prev, data.message]);
        if (data.message.content.toLowerCase().includes("cart") || data.message.content.toLowerCase().includes("order")) {
          fetchConversationDetails(activeConv.id);
        }
      }

      // Refresh tab counts
      fetchConversations();
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

  // Refetch when tab or channel filter changes
  useEffect(() => {
    if (token) fetchConversations();
  }, [activeTab, channelFilter]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { if (token) fetchConversations(); }, 300);
    return () => clearTimeout(t);
  }, [searchFilter]);

  const handleSelectConv = (conv) => {
    if (activeConv && socketRef.current) {
      socketRef.current.emit('leave_conversation', activeConv.id);
    }

    setActiveConv(conv);
    setAssignedUser(conv.assignedUserId || '');
    setLabel(conv.label || '');
    setNotes(conv.notes || '');
    setPriority(conv.priority || 'MEDIA');
    setConvStatus(conv.status || 'OPEN');
    setConvTags(() => { try { return JSON.parse(conv.tags || '[]'); } catch { return []; } });
    setDetailTab('details');
    fetchConversationDetails(conv.id);
    markAsRead(conv.id);

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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.success) alert(data.error || "Failed to deliver response.");
    } catch (err) { console.error(err); }
  };

  // Toggle Human Takeover
  const handleToggleHandover = async () => {
    if (!activeConv) return;
    setHandoverLoading(true);
    const targetState = !activeConv.isHumanHandoverActive;

    try {
      const res = await fetch(`/inbox/conversations/${activeConv.id}/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isHumanHandoverActive: targetState })
      });
      const data = await res.json();
      if (data.success) setActiveConv(prev => ({ ...prev, isHumanHandoverActive: targetState }));
    } catch (err) { console.error(err); }
    finally { setHandoverLoading(false); }
  };

  // Save CRM properties
  const handleSaveProperties = async () => {
    if (!activeConv) return;
    setMetaLoading(true);

    try {
      const res = await fetch(`/inbox/conversations/${activeConv.id}/properties`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ label, notes, priority, status: convStatus, tags: convTags })
      });
      const data = await res.json();
      if (data.success) {
        setActiveConv(prev => ({ ...prev, label, notes, priority, status: convStatus, tags: JSON.stringify(convTags) }));
        fetchConversations();
      }
    } catch (err) { console.error(err); }
    finally { setMetaLoading(false); }
  };

  // Quick update priority or status
  const handleQuickUpdate = async (field, value) => {
    if (!activeConv) return;
    const body = {};
    body[field] = value;

    try {
      await fetch(`/inbox/conversations/${activeConv.id}/properties`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      setActiveConv(prev => ({ ...prev, [field]: value }));
      if (field === 'status') setConvStatus(value);
      if (field === 'priority') setPriority(value);
      fetchConversations();
    } catch (err) { console.error(err); }
  };

  // Add tag
  const handleAddTag = () => {
    if (!newTag.trim() || convTags.includes(newTag.trim())) return;
    const updated = [...convTags, newTag.trim()];
    setConvTags(updated);
    setNewTag('');
  };

  // Remove tag
  const handleRemoveTag = (tag) => {
    setConvTags(prev => prev.filter(t => t !== tag));
  };

  // Assign agent user
  const handleAssignUser = async (userId) => {
    if (!activeConv) return;
    setAssignedUser(userId);
    try {
      await fetch(`/inbox/conversations/${activeConv.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId })
      });
    } catch (err) { console.error(err); }
  };

  // Generate AI Suggestion
  const handleGenerateSuggestion = async () => {
    if (!activeConv) return;
    setGeneratingSuggestion(true);
    setAiSuggestion('');

    try {
      const res = await fetch(`/inbox/conversations/${activeConv.id}/suggestions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAiSuggestion(data.suggestion);
      else alert(data.error || "Failed to generate copilot reply.");
    } catch (e) { console.error(e); }
    finally { setGeneratingSuggestion(false); }
  };

  const renderChannelBadge = (type) => {
    const norm = type?.toUpperCase();
    if (norm === 'WHATSAPP') return <span className="badge badge-whatsapp">WhatsApp</span>;
    if (norm === 'INSTAGRAM') return <span className="badge badge-instagram">Instagram</span>;
    if (norm === 'MESSENGER') return <span className="badge badge-messenger">Messenger</span>;
    return <span className="badge badge-widget">Web widget</span>;
  };

  const getPriorityBadge = (p) => {
    const opt = PRIORITY_OPTIONS.find(o => o.key === p) || PRIORITY_OPTIONS[1];
    return <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '10px', background: `${opt.color}20`, color: opt.color, fontWeight: '700' }}>● {opt.label}</span>;
  };

  const getRelativeTime = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `há ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs} horas`;
    const days = Math.floor(hrs / 24);
    return `há ${days} dias`;
  };

  return (
    <div className="glass" style={{ display: 'flex', height: 'calc(100vh - 110px)', margin: '20px', overflow: 'hidden' }}>
      
      {/* 1. Side List */}
      <div style={{ width: '340px', borderRight: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', background: 'hsl(var(--bg-card) / 0.3)' }}>
        
        {/* Status Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border))', overflowX: 'auto' }}>
          {STATUS_TABS.map(tab => {
            const count = tabCounts[tab.key] || 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: '0 0 auto',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                  color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                  fontSize: '11px',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
                {count > 0 && tab.key !== 'all' && (
                  <span style={{
                    background: tab.key === 'unread' ? '#f44336' : 'hsl(var(--primary))',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '9px',
                    fontWeight: '700',
                    minWidth: '16px',
                    textAlign: 'center'
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Channel Filter */}
        <div style={{ padding: '12px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'hsl(var(--text-muted))' }} />
            <input 
              type="text" 
              placeholder="Filtro de Texto" 
              value={searchFilter} 
              onChange={(e) => setSearchFilter(e.target.value)} 
              style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '8px 12px 8px 32px', borderRadius: '6px', fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
            {['ALL', 'WHATSAPP', 'INSTAGRAM', 'MESSENGER', 'WIDGET'].map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                style={{
                  background: channelFilter === ch ? 'hsl(var(--primary))' : 'hsl(var(--border) / 0.4)',
                  color: channelFilter === ch ? '#fff' : 'hsl(var(--text-muted))',
                  border: 'none', borderRadius: '12px', padding: '3px 8px', fontSize: '10px',
                  fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >{ch}</button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>
              <MessageSquare size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
              <p>Nenhuma conversa encontrada.</p>
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = activeConv && activeConv.id === conv.id;
              const isHandover = conv.isHumanHandoverActive;
              const isUnread = !conv.isRead;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid hsl(var(--border) / 0.4)',
                    cursor: 'pointer',
                    background: isActive ? 'hsl(var(--primary-glow) / 0.5)' : 'transparent',
                    borderLeft: isActive ? '3px solid hsl(var(--primary))' : isUnread ? '3px solid #f44336' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ fontWeight: isUnread ? '700' : '500', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {isUnread && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f44336', flexShrink: 0 }} />}
                      {conv.contact?.name || 'Visitante'}
                      {isHandover && <UserCheck size={12} style={{ color: 'hsl(var(--secondary))' }} />}
                    </span>
                    <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                      {getRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    {renderChannelBadge(conv.channel.type)}
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {conv.priority && conv.priority !== 'MEDIA' && getPriorityBadge(conv.priority)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Stats Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-around', background: 'hsl(var(--bg-card) / 0.2)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '800' }}>{stats.totalConversations}</div>
            <div style={{ fontSize: '9px', color: 'hsl(var(--text-muted))' }}>Total de Conversas</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'hsl(var(--primary))' }}>{tabCounts.unread || 0}</div>
            <div style={{ fontSize: '9px', color: 'hsl(var(--text-muted))' }}>Não Lidas</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '800' }}>{stats.distinctChannels}</div>
            <div style={{ fontSize: '9px', color: 'hsl(var(--text-muted))' }}>Canais</div>
          </div>
        </div>
      </div>

      {/* 2. Middle Panel: Messages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'hsl(var(--bg-main) / 0.1)' }}>
        {activeConv ? (
          <>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--bg-card) / 0.2)' }}>
              <div>
                <h4 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeConv.contact?.name || 'Customer'}
                  {renderChannelBadge(activeConv.channel.type)}
                </h4>
                <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                  Platform ID: <code>{activeConv.contact?.platformId}</code> | Bot: <strong>{activeConv.bot?.name || "Zimmy"}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={handleGenerateSuggestion} disabled={generatingSuggestion}
                  style={{ background: 'transparent', border: '1px solid hsl(var(--primary))', color: 'hsl(var(--primary))', padding: '7px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={13} /> {generatingSuggestion ? "..." : "AI Suggestion"}
                </button>

                <button onClick={handleToggleHandover} disabled={handoverLoading}
                  style={{
                    background: activeConv.isHumanHandoverActive 
                      ? 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--secondary) / 0.8))' : 'hsl(var(--border))',
                    border: 'none', color: activeConv.isHumanHandoverActive ? '#000' : 'hsl(var(--text-main))',
                    padding: '7px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}>
                  <Bot size={13} />
                  {activeConv.isHumanHandoverActive ? "AI Muted (Live)" : "AI Replying (Auto)"}
                </button>
              </div>
            </div>

            {/* AI Suggestion box */}
            {aiSuggestion && (
              <div className="glass" style={{ margin: '12px 20px 0', padding: '12px', background: 'hsl(var(--primary-glow) / 0.25)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(var(--primary))' }}><Sparkles size={11} /> AI SUGGESTION</span>
                  <button onClick={() => setAiSuggestion('')} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', fontSize: '10px' }}>Dismiss</button>
                </div>
                <p style={{ fontSize: '12px', lineHeight: '1.4', margin: 0, fontStyle: 'italic' }}>"{aiSuggestion}"</p>
                <button onClick={() => { setReplyText(aiSuggestion); setAiSuggestion(''); }} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '3px 8px', fontSize: '10px' }}>
                  Use Draft
                </button>
              </div>
            )}

            {/* Messages timeline */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg) => {
                const isUser = msg.senderType === 'USER';
                const isSystem = msg.senderType === 'SYSTEM';
                const isAgent = msg.senderType === 'AGENT';

                if (isSystem) {
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
                      <div className="glass" style={{ padding: '5px 14px', borderRadius: '16px', fontSize: '10px', color: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ShieldAlert size={11} /> {msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-start' : 'flex-end', maxWidth: '75%', alignSelf: isUser ? 'flex-start' : 'flex-end' }}>
                    <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))', marginBottom: '2px', padding: '0 4px' }}>
                      {isUser ? activeConv.contact?.name : (isAgent ? "Agent (You)" : `${activeConv.bot?.name || "Zimmy"}`)}
                    </span>
                    <div style={{
                      padding: '10px 14px', borderRadius: '12px', fontSize: '13px', lineHeight: '1.4', wordBreak: 'break-word',
                      background: isUser ? 'hsl(var(--border) / 0.5)' : (isAgent ? 'linear-gradient(135deg, hsl(var(--secondary) / 0.3), hsl(var(--secondary) / 0.15))' : 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.2))'),
                      border: '1px solid', borderColor: isUser ? 'hsl(var(--border))' : (isAgent ? 'hsl(var(--secondary) / 0.3)' : 'hsl(var(--primary) / 0.3)'),
                      boxShadow: isUser ? 'none' : (isAgent ? '0 0 8px hsl(var(--secondary-glow))' : '0 0 8px hsl(var(--primary-glow))')
                    }}>
                      {msg.content}
                    </div>
                    <span style={{ fontSize: '8px', color: 'hsl(var(--text-muted))', marginTop: '2px', padding: '0 4px' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <form onSubmit={handleSendReply} style={{ padding: '14px 18px', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: '8px' }}>
              <input
                type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                placeholder={activeConv.isHumanHandoverActive ? "Digite sua resposta..." : "AI ativa. Ative o modo Live para responder."}
                disabled={!activeConv.isHumanHandoverActive}
                style={{ flex: 1, background: 'hsl(var(--border) / 0.4)', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', outline: 'none' }}
              />
              <button type="submit" disabled={!activeConv.isHumanHandoverActive || !replyText.trim()} className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: activeConv.isHumanHandoverActive ? 'pointer' : 'not-allowed' }}>
                <Send size={14} /> Send
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))' }}>
            <MessageSquare size={48} style={{ color: 'hsl(var(--border))', marginBottom: '14px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Selecione uma Conversa</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Escolha uma conversa para iniciar o atendimento.</p>
          </div>
        )}
      </div>

      {/* 3. Right Sidebar: Details/Notes Panel */}
      {activeConv && (
        <div style={{ width: '280px', borderLeft: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', background: 'hsl(var(--bg-card) / 0.3)', overflowY: 'auto' }}>
          
          {/* Conversation Name Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{activeConv.contact?.name || 'Visitante'}</h4>
          </div>

          {/* Detalhes / Notas Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border))' }}>
            <button onClick={() => setDetailTab('details')} style={{
              flex: 1, padding: '10px', border: 'none', background: detailTab === 'details' ? 'hsl(var(--primary) / 0.1)' : 'transparent',
              borderBottom: detailTab === 'details' ? '2px solid hsl(var(--primary))' : 'none',
              color: detailTab === 'details' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer'
            }}>Detalhes</button>
            <button onClick={() => setDetailTab('notes')} style={{
              flex: 1, padding: '10px', border: 'none', background: detailTab === 'notes' ? 'hsl(var(--primary) / 0.1)' : 'transparent',
              borderBottom: detailTab === 'notes' ? '2px solid hsl(var(--primary))' : 'none',
              color: detailTab === 'notes' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer'
            }}>Notas</button>
          </div>

          {/* Intervir Button */}
          <div style={{ padding: '12px 16px' }}>
            <button onClick={handleToggleHandover} style={{
              width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              background: activeConv.isHumanHandoverActive ? 'hsl(var(--secondary))' : '#c62828', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
              🖐 {activeConv.isHumanHandoverActive ? 'Devolver ao AI' : 'Intervir'}
            </button>
          </div>

          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {detailTab === 'details' ? (
              <>
                {/* Etiquetas / Tags */}
                <div>
                  <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Etiquetas</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    {convTags.length === 0 && <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Não possui etiquetas.</span>}
                    {convTags.map(tag => (
                      <span key={tag} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {tag}
                        <X size={10} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(tag)} />
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Adicionar etiqueta..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      style={{ flex: 1, background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '5px 8px', borderRadius: '4px', fontSize: '11px' }} />
                    <button onClick={handleAddTag} style={{ background: 'hsl(var(--primary))', border: 'none', color: '#fff', borderRadius: '4px', padding: '5px 8px', cursor: 'pointer' }}>
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Status & Priority */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Status</h5>
                    <select value={convStatus} onChange={(e) => handleQuickUpdate('status', e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '6px', fontSize: '11px', color: STATUS_OPTIONS.find(s => s.key === convStatus)?.color || '#fff' }}>
                      {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Prioridade</h5>
                    <select value={priority} onChange={(e) => handleQuickUpdate('priority', e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '6px', fontSize: '11px', color: PRIORITY_OPTIONS.find(p => p.key === priority)?.color || '#fff' }}>
                      {PRIORITY_OPTIONS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Responsável */}
                <div>
                  <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Responsável</h5>
                  <select value={assignedUser} onChange={(e) => handleAssignUser(e.target.value)}
                    style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '6px', fontSize: '11px' }}>
                    <option value="">Responsável</option>
                    <option value={user.id}>{user.firstName} {user.lastName}</option>
                  </select>
                </div>

                {/* Contact Profile */}
                <div>
                  <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Perfil do Contato</h5>
                  <div className="glass" style={{ padding: '10px', borderRadius: '6px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div><strong>Nome:</strong> {activeConv.contact?.name}</div>
                    <div><strong>Plataforma:</strong> {activeConv.contact?.platformType}</div>
                    <div><strong>ID:</strong> <code style={{ fontSize: '10px' }}>{activeConv.contact?.platformId}</code></div>
                    {activeConv.contact?.phone && <div><strong>Fone:</strong> {activeConv.contact.phone}</div>}
                  </div>
                </div>

                {/* Shopping Cart */}
                <div>
                  <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    <ShoppingCart size={12} style={{ marginRight: '4px' }} /> Carrinho
                  </h5>
                  {cartItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '12px', border: '1px dashed hsl(var(--border))', borderRadius: '6px', color: 'hsl(var(--text-muted))', fontSize: '11px' }}>
                      Carrinho vazio.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {cartItems.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '4px 0' }}>
                          <span>{item.quantity}× {item.name}</span>
                          <span style={{ color: 'hsl(var(--secondary))' }}>R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Notes Tab */
              <>
                <div>
                  <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Notas internas do CRM</h5>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Registre observações, resumos ou preferências do cliente..."
                    rows={8}
                    style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '10px', fontSize: '12px', outline: 'none', resize: 'none', lineHeight: '1.5' }}
                  />
                </div>

                <div>
                  <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Label</h5>
                  <select value={label} onChange={(e) => setLabel(e.target.value)}
                    style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '6px', fontSize: '11px' }}>
                    <option value="">Sem Label</option>
                    <option value="Lead">Lead</option>
                    <option value="Support">Suporte</option>
                    <option value="Billing">Faturamento</option>
                    <option value="Spam">Spam</option>
                  </select>
                </div>

                <button onClick={handleSaveProperties} disabled={metaLoading} className="btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '12px' }}>
                  {metaLoading ? "Salvando..." : "Salvar Propriedades"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

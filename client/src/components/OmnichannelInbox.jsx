import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, User, Tag, FileText, Send, ShoppingCart, 
  Bot, RefreshCw, Layers, ShieldAlert, Sparkles, UserCheck,
  Search, AlertTriangle, CheckCircle, Clock, Eye, EyeOff, X, Plus, Hash, Filter
} from 'lucide-react';
import io from 'socket.io-client';

const STATUS_TABS = [
  { key: 'unresolved', label: 'Não Resolvidas' },
  { key: 'unread', label: 'Não Lidas' },
  { key: 'human_requested', label: 'Humano Solicitado' },
  { key: 'resolved', label: 'Resolvidas' },
  { key: 'all', label: 'Todas conversas' }
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
  const [detailTab, setDetailTab] = useState('details');

  // AI Suggestions
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [generatingSuggestion, setGeneratingSuggestion] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

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
      console.error("Failed to load conversations:", e);
    }
  };

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
    } catch (e) { console.error(e); }
  };

  const markAsRead = async (convId) => {
    try {
      await fetch(`/inbox/conversations/${convId}/properties`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isRead: true })
      });
    } catch (e) { console.error(e); }
  };

  // Socket setup
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
        const updated = { ...data.session, contact: prev[idx]?.contact || data.session.contact || { name: 'Visitor' }, channel: prev[idx]?.channel || data.session.channel || { type: 'WHATSAPP' }, bot: prev[idx]?.bot || data.session.bot || { name: 'Zimmy' } };
        if (idx > -1) { const arr = [...prev]; arr.splice(idx, 1); return [updated, ...arr]; }
        return [updated, ...prev];
      });
      if (activeConv && activeConv.id === data.session.id) setMessages(prev => [...prev, data.message]);
      fetchConversations();
    });

    socket.on('message_sent', (data) => {
      if (activeConv && activeConv.id === data.session.id) setMessages(prev => [...prev, data.message]);
      fetchConversations();
    });

    socket.on('session_updated', (data) => {
      setConversations(prev => prev.map(s => s.id === data.session.id ? { ...data.session, contact: s.contact, channel: s.channel, bot: s.bot } : s));
      if (activeConv && activeConv.id === data.session.id) setActiveConv(prev => ({ ...prev, ...data.session }));
    });

    return () => socket.disconnect();
  }, [token, activeConv?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (token) fetchConversations(); }, [activeTab, channelFilter]);
  useEffect(() => { const t = setTimeout(() => { if (token) fetchConversations(); }, 300); return () => clearTimeout(t); }, [searchFilter]);

  const handleSelectConv = (conv) => {
    if (activeConv && socketRef.current) socketRef.current.emit('leave_conversation', activeConv.id);
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
    if (socketRef.current) socketRef.current.emit('join_conversation', conv.id);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConv) return;
    setReplyText('');
    try {
      const res = await fetch(`/inbox/conversations/${activeConv.id}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ content: replyText }) });
      const data = await res.json();
      if (!data.success) alert(data.error || "Failed to deliver.");
    } catch (err) { console.error(err); }
  };

  const handleToggleHandover = async () => {
    if (!activeConv) return;
    setHandoverLoading(true);
    const targetState = !activeConv.isHumanHandoverActive;
    try {
      const res = await fetch(`/inbox/conversations/${activeConv.id}/handover`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ isHumanHandoverActive: targetState }) });
      const data = await res.json();
      if (data.success) setActiveConv(prev => ({ ...prev, isHumanHandoverActive: targetState }));
    } catch (err) { console.error(err); }
    finally { setHandoverLoading(false); }
  };

  const handleSaveProperties = async () => {
    if (!activeConv) return;
    setMetaLoading(true);
    try {
      const res = await fetch(`/inbox/conversations/${activeConv.id}/properties`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ label, notes, priority, status: convStatus, tags: convTags }) });
      const data = await res.json();
      if (data.success) { setActiveConv(prev => ({ ...prev, label, notes, priority, status: convStatus, tags: JSON.stringify(convTags) })); fetchConversations(); }
    } catch (err) { console.error(err); }
    finally { setMetaLoading(false); }
  };

  const handleQuickUpdate = async (field, value) => {
    if (!activeConv) return;
    try {
      await fetch(`/inbox/conversations/${activeConv.id}/properties`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ [field]: value }) });
      setActiveConv(prev => ({ ...prev, [field]: value }));
      if (field === 'status') setConvStatus(value);
      if (field === 'priority') setPriority(value);
      fetchConversations();
    } catch (err) { console.error(err); }
  };

  const handleAddTag = () => {
    if (!newTag.trim() || convTags.includes(newTag.trim())) return;
    setConvTags(prev => [...prev, newTag.trim()]);
    setNewTag('');
  };

  const handleAssignUser = async (userId) => {
    if (!activeConv) return;
    setAssignedUser(userId);
    try { await fetch(`/inbox/conversations/${activeConv.id}/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ userId }) }); } catch (err) { console.error(err); }
  };

  const handleGenerateSuggestion = async () => {
    if (!activeConv) return;
    setGeneratingSuggestion(true);
    setAiSuggestion('');
    try {
      const res = await fetch(`/inbox/conversations/${activeConv.id}/suggestions`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAiSuggestion(data.suggestion);
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
    return `há ${Math.floor(hrs / 24)} dias`;
  };

  // ─── CHATVOLT-STYLE LAYOUT ───────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)' }}>

      {/* ═══ TOP BAR: Breadcrumb + Status Tabs + Search ═══ */}
      <div style={{ padding: '0 24px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card) / 0.3)', flexShrink: 0 }}>
        
        {/* Breadcrumb */}
        <div style={{ padding: '12px 0 0', fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
          <span style={{ opacity: 0.6 }}>Início</span> <span style={{ margin: '0 6px' }}>›</span> <strong style={{ color: '#fff' }}>Conversas</strong>
        </div>

        {/* Tabs Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
          
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0' }}>
            {STATUS_TABS.map(tab => {
              const count = tabCounts[tab.key] || 0;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                    color: isActive ? '#fff' : 'hsl(var(--text-muted))',
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '400',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                  {count > 0 && tab.key !== 'all' && (
                    <span style={{
                      background: tab.key === 'unread' ? '#f44336' : 'hsl(var(--primary))',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '1px 7px',
                      fontSize: '11px',
                      fontWeight: '700',
                      minWidth: '18px',
                      textAlign: 'center'
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Bar (right side) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'hsl(var(--text-muted))' }} />
              <input 
                type="text" placeholder="Filtro de Texto" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)}
                style={{ width: '220px', background: 'hsl(var(--border) / 0.4)', border: '1px solid hsl(var(--border))', padding: '8px 12px 8px 30px', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>
            <button style={{ background: 'hsl(var(--border) / 0.4)', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '7px 8px', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>
              <Filter size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT: Left (Conversations) + Right (Chat or Stats) ═══ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ─── LEFT: Conversation List ─── */}
        <div style={{ width: '380px', flexShrink: 0, borderRight: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', background: 'hsl(var(--bg-card) / 0.15)' }}>

          {/* Channel Filter Chips */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid hsl(var(--border) / 0.5)', display: 'flex', gap: '4px', overflowX: 'auto' }}>
            {['ALL', 'WHATSAPP', 'INSTAGRAM', 'MESSENGER', 'WIDGET'].map(ch => (
              <button key={ch} onClick={() => setChannelFilter(ch)}
                style={{
                  background: channelFilter === ch ? 'hsl(var(--primary))' : 'hsl(var(--border) / 0.4)',
                  color: channelFilter === ch ? '#fff' : 'hsl(var(--text-muted))',
                  border: 'none', borderRadius: '14px', padding: '4px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >{ch}</button>
            ))}
          </div>

          {/* Scrollable Conversation List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'hsl(var(--text-muted))' }}>
                <MessageSquare size={40} style={{ marginBottom: '12px', opacity: 0.2 }} />
                <p style={{ fontSize: '14px', fontWeight: '500' }}>Nenhuma conversa encontrada</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>Parece que não há conversas para exibir.</p>
              </div>
            ) : (
              conversations.map(conv => {
                const isActive = activeConv && activeConv.id === conv.id;
                const isHandover = conv.isHumanHandoverActive;
                const isUnread = !conv.isRead;

                return (
                  <div key={conv.id} onClick={() => handleSelectConv(conv)}
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid hsl(var(--border) / 0.3)',
                      cursor: 'pointer',
                      background: isActive ? 'hsl(var(--primary-glow) / 0.4)' : 'transparent',
                      borderLeft: isActive ? '3px solid hsl(var(--primary))' : isUnread ? '3px solid #f44336' : '3px solid transparent',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Avatar circle */}
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.1))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '700', color: 'hsl(var(--primary))', flexShrink: 0
                        }}>
                          {conv.channel.type === 'WHATSAPP' ? '📱' : conv.channel.type === 'INSTAGRAM' ? '📸' : conv.channel.type === 'MESSENGER' ? '💬' : 'API'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {isUnread && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f44336', flexShrink: 0 }} />}
                            <span style={{ fontWeight: isUnread ? '700' : '500', fontSize: '13px' }}>
                              {conv.contact?.name || 'Visitante'}
                            </span>
                            {isHandover && <UserCheck size={12} style={{ color: 'hsl(var(--secondary))' }} />}
                            {conv.status === 'CLOSED' && <CheckCircle size={11} style={{ color: '#4caf50' }} />}
                          </div>
                          <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.label ? `${conv.label} · ` : ''}{conv.contact?.platformType || conv.channel.type}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap' }}>
                        {getRelativeTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    {/* Priority bar indicator (color line at bottom) */}
                    <div style={{
                      height: '2px', borderRadius: '1px', marginTop: '4px',
                      background: conv.priority === 'URGENTE' ? '#d50000' : conv.priority === 'ALTA' ? '#f44336' : conv.priority === 'MEDIA' ? '#ff9800' : '#4caf50',
                      width: conv.priority === 'URGENTE' ? '100%' : conv.priority === 'ALTA' ? '75%' : conv.priority === 'MEDIA' ? '50%' : '25%',
                      opacity: 0.7
                    }} />
                  </div>
                );
              })
            )}
          </div>

          {/* Stats Footer */}
          <div style={{ padding: '14px', borderTop: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-around', background: 'hsl(var(--bg-card) / 0.2)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800' }}>{stats.totalConversations}</div>
              <div style={{ fontSize: '9px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Total de Conversas</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'hsl(var(--primary))' }}>{tabCounts.unread || 0}</div>
              <div style={{ fontSize: '9px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Não Lidas</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800' }}>{stats.distinctChannels}</div>
              <div style={{ fontSize: '9px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Canais</div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Chat Area OR Stats when no conversation selected ─── */}
        {activeConv ? (
          <>
            {/* Chat Messages Panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ padding: '12px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--bg-card) / 0.15)' }}>
                <div>
                  <h4 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeConv.contact?.name || 'Customer'} {renderChannelBadge(activeConv.channel.type)}
                  </h4>
                  <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                    ID: <code style={{ fontSize: '10px' }}>{activeConv.contact?.platformId}</code> · Bot: <strong>{activeConv.bot?.name || "Zimmy"}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={handleGenerateSuggestion} disabled={generatingSuggestion}
                    style={{ background: 'transparent', border: '1px solid hsl(var(--primary))', color: 'hsl(var(--primary))', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sparkles size={13} /> {generatingSuggestion ? "..." : "AI"}
                  </button>
                  <button onClick={handleToggleHandover}
                    style={{
                      background: activeConv.isHumanHandoverActive ? 'hsl(var(--secondary))' : 'hsl(var(--border))',
                      border: 'none', color: activeConv.isHumanHandoverActive ? '#000' : '#fff',
                      padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                    <Bot size={13} /> {activeConv.isHumanHandoverActive ? "AI Muted" : "AI Auto"}
                  </button>
                </div>
              </div>

              {/* AI Suggestion */}
              {aiSuggestion && (
                <div style={{ margin: '10px 20px 0', padding: '10px 14px', background: 'hsl(var(--primary-glow) / 0.2)', borderRadius: '8px', border: '1px solid hsl(var(--primary) / 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(var(--primary))' }}>✨ AI SUGGESTION</span>
                    <button onClick={() => setAiSuggestion('')} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                  </div>
                  <p style={{ fontSize: '12px', fontStyle: 'italic', margin: '0 0 6px' }}>"{aiSuggestion}"</p>
                  <button onClick={() => { setReplyText(aiSuggestion); setAiSuggestion(''); }} className="btn-primary" style={{ padding: '3px 10px', fontSize: '10px' }}>Usar</button>
                </div>
              )}

              {/* Messages */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map(msg => {
                  const isUser = msg.senderType === 'USER';
                  const isSystem = msg.senderType === 'SYSTEM';
                  const isAgent = msg.senderType === 'AGENT';

                  if (isSystem) return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                      <div style={{ padding: '4px 14px', borderRadius: '16px', fontSize: '10px', color: 'hsl(var(--secondary))', background: 'hsl(var(--border) / 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldAlert size={10} /> {msg.content}
                      </div>
                    </div>
                  );

                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-start' : 'flex-end', maxWidth: '70%', alignSelf: isUser ? 'flex-start' : 'flex-end' }}>
                      <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))', marginBottom: '2px', padding: '0 4px' }}>
                        {isUser ? (activeConv.contact?.name || 'User') : (isAgent ? "Agent" : (activeConv.bot?.name || "Zimmy"))}
                      </span>
                      <div style={{
                        padding: '10px 14px', borderRadius: '12px', fontSize: '13px', lineHeight: '1.45', wordBreak: 'break-word',
                        background: isUser ? 'hsl(var(--border) / 0.5)' : (isAgent ? 'linear-gradient(135deg, hsl(var(--secondary) / 0.3), hsl(var(--secondary) / 0.15))' : 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.2))'),
                        border: `1px solid ${isUser ? 'hsl(var(--border))' : (isAgent ? 'hsl(var(--secondary) / 0.3)' : 'hsl(var(--primary) / 0.3)')}`
                      }}>{msg.content}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', padding: '0 4px' }}>
                        <span style={{ fontSize: '8px', color: 'hsl(var(--text-muted))' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!isUser && <span style={{ fontSize: '8px', color: 'hsl(var(--text-muted))' }}>Inbores</span>}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <form onSubmit={handleSendReply} style={{ padding: '12px 18px', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: '8px', background: 'hsl(var(--bg-card) / 0.1)' }}>
                <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                  placeholder={activeConv.isHumanHandoverActive ? "Digite sua resposta..." : "AI ativa. Clique Intervir para responder."}
                  disabled={!activeConv.isHumanHandoverActive}
                  style={{ flex: 1, background: 'hsl(var(--border) / 0.4)', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', outline: 'none' }} />
                <button type="submit" disabled={!activeConv.isHumanHandoverActive || !replyText.trim()} className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Send size={14} /> Enviar
                </button>
              </form>
            </div>

            {/* Right Detail Panel */}
            <div style={{ width: '280px', flexShrink: 0, borderLeft: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', background: 'hsl(var(--bg-card) / 0.2)', overflowY: 'auto' }}>
              {/* Contact Name */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{activeConv.contact?.name || 'Visitante'} ✏️</h4>
                <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>conv_{activeConv.id.slice(0, 16)}</span>
              </div>

              {/* Detalhes / Notas tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border))' }}>
                {['details', 'notes'].map(t => (
                  <button key={t} onClick={() => setDetailTab(t)} style={{
                    flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                    background: detailTab === t ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                    borderBottom: detailTab === t ? '2px solid hsl(var(--primary))' : 'none',
                    color: detailTab === t ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                    fontSize: '12px', fontWeight: '600'
                  }}>{t === 'details' ? 'Detalhes' : 'Notas'}</button>
                ))}
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
                    {/* Tags */}
                    <div>
                      <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Etiquetas</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                        {convTags.length === 0 && <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Não possui etiquetas.</span>}
                        {convTags.map(tag => (
                          <span key={tag} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {tag} <X size={10} style={{ cursor: 'pointer' }} onClick={() => setConvTags(prev => prev.filter(t => t !== tag))} />
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Adicionar ou pesquisar etiquetas..."
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          style={{ flex: 1, background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '5px 8px', borderRadius: '4px', fontSize: '11px' }} />
                        <button onClick={handleAddTag} style={{ background: 'hsl(var(--primary))', border: 'none', color: '#fff', borderRadius: '4px', padding: '5px 8px', cursor: 'pointer' }}><Plus size={12} /></button>
                      </div>
                    </div>

                    {/* Status & Priority side by side */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '4px' }}>Status</h5>
                        <select value={convStatus} onChange={(e) => handleQuickUpdate('status', e.target.value)}
                          style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '6px', fontSize: '11px', color: STATUS_OPTIONS.find(s => s.key === convStatus)?.color }}>
                          {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '4px' }}>Prioridade</h5>
                        <select value={priority} onChange={(e) => handleQuickUpdate('priority', e.target.value)}
                          style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '6px', fontSize: '11px', color: PRIORITY_OPTIONS.find(p => p.key === priority)?.color }}>
                          {PRIORITY_OPTIONS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Responsável */}
                    <div>
                      <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '4px' }}>Responsável</h5>
                      <select value={assignedUser} onChange={(e) => handleAssignUser(e.target.value)}
                        style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '6px', fontSize: '11px' }}>
                        <option value="">Responsável</option>
                        <option value={user.id}>{user.firstName} {user.lastName}</option>
                      </select>
                    </div>

                    {/* Contact */}
                    <div>
                      <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '4px' }}>Contato</h5>
                      <div style={{ padding: '8px', borderRadius: '6px', background: 'hsl(var(--border) / 0.2)', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div><strong>Nome:</strong> {activeConv.contact?.name}</div>
                        <div><strong>Canal:</strong> {activeConv.contact?.platformType}</div>
                        <div><strong>ID:</strong> <code style={{ fontSize: '9px' }}>{activeConv.contact?.platformId}</code></div>
                      </div>
                    </div>

                    {/* Cart */}
                    {cartItems.length > 0 && (
                      <div>
                        <h5 style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '4px' }}>🛒 Carrinho</h5>
                        {cartItems.map(item => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' }}>
                            <span>{item.quantity}× {item.name}</span>
                            <span style={{ color: 'hsl(var(--secondary))' }}>R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Registre observações..." rows={10}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '10px', fontSize: '12px', outline: 'none', resize: 'none', lineHeight: '1.5' }} />
                    <select value={label} onChange={(e) => setLabel(e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '6px', fontSize: '11px' }}>
                      <option value="">Sem Label</option>
                      <option value="Lead">Lead</option>
                      <option value="Support">Suporte</option>
                      <option value="Billing">Faturamento</option>
                    </select>
                    <button onClick={handleSaveProperties} disabled={metaLoading} className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: '12px' }}>
                      {metaLoading ? "Salvando..." : "Salvar Propriedades"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ─── Stats Panel (no conversation selected) ─── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '6px' }}>Estatísticas das Conversas Encontradas</h3>
            <div style={{ display: 'flex', gap: '24px', marginTop: '30px' }}>
              {[
                { icon: '💬', value: stats.totalConversations, label: 'Total de Conversas', color: 'hsl(var(--primary))' },
                { icon: '👤', value: tabCounts.human_requested || 0, label: 'Agentes Distintos', color: '#4caf50' },
                { icon: '✦', value: stats.distinctChannels, label: 'Canais Distintos', color: '#ff9800' }
              ].map((stat, i) => (
                <div key={i} className="glass" style={{
                  padding: '30px 40px', borderRadius: '12px', textAlign: 'center', minWidth: '160px',
                  border: '1px solid hsl(var(--border) / 0.6)'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

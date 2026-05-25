import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, ShoppingCart, Settings, LogOut, 
  Sparkles, Database, LayoutDashboard, Cpu, 
  Layers, User, UserCheck, FileText, Megaphone, 
  FileCode, Globe, Bell, CheckCircle2, ChevronRight, 
  Plus, Search, HelpCircle, ShieldAlert, Clock, ArrowRight,
  TrendingUp, BarChart3, AlertCircle, Copy, ToggleLeft, ToggleRight, Trash2, Edit, Sliders
} from 'lucide-react';
import OmnichannelInbox from './components/OmnichannelInbox';
import EcommerceDashboard from './components/EcommerceDashboard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [activeTab, setActiveTab] = useState('CONVERSAS');

  // Auth form states
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Settings & RAG States
  const [geminiKey, setGeminiKey] = useState('');
  const [verifyToken] = useState('chatflow_verify_token_123');
  const [knowledgeText, setKnowledgeText] = useState('');
  const [knowledgeSource, setKnowledgeSource] = useState('');
  const [uploadingKnowledge, setUploadingKnowledge] = useState(false);

  // CRM & Organization fields
  const [companyWebsite, setCompanyWebsite] = useState('https://noviapp.ai/');
  const [customDashboardUrl, setCustomDashboardUrl] = useState('https://example.com/dashboard');
  const [companySummary, setCompanySummary] = useState('Sistemas de IA sob medida, automação inteligente e software empresarial — projetados para transformar a forma como sua empresa opera. Possibilidades infinitas, um parceiro.');

  // AI Bots (Agentes AI) states
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [botSettingsTab, setBotSettingsTab] = useState('GERAL');
  const [newBotName, setNewBotName] = useState('');

  // Individual Bot Config Forms
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentModel, setAgentModel] = useState('gemini-2.5-flash');
  const [agentTemperature, setAgentTemperature] = useState(0.7);
  const [agentGreeting, setAgentGreeting] = useState('');
  const [outboundWebhook, setOutboundWebhook] = useState('');
  const [outboundHeader, setOutboundHeader] = useState('');
  const [isBotSaving, setIsBotSaving] = useState(false);

  // Tools indicators states
  const [toolKnowledgeBase, setToolKnowledgeBase] = useState(true);
  const [toolHumanHandover, setToolHumanHandover] = useState(true);
  const [toolMockErp, setToolMockErp] = useState(true);

  // Human Operators (Operadores) states
  const [conversations, setConversations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentPassword, setNewAgentPassword] = useState('');
  const [newAgentFirstName, setNewAgentFirstName] = useState('');
  const [newAgentLastName, setNewAgentLastName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('AGENT');
  const [agentLoading, setAgentLoading] = useState(false);

  // Persistent Quick Replies templates (Artefatos)
  const [quickReplies, setQuickReplies] = useState(() => {
    const saved = localStorage.getItem('chatflow_quick_replies');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Saudação de Boas-Vindas', content: 'Olá! Seja muito bem-vindo à nossa empresa. Como posso te ajudar hoje?' },
      { id: '2', title: 'Instruções de Pix', content: 'Para efetuar o pagamento, basta copiar o código Pix Pix-Copiar-e-Colar enviado acima e colar no aplicativo do seu banco.' },
      { id: '3', title: 'Horário de Atendimento', content: 'Nosso horário de funcionamento é de Segunda a Sexta, das 09h às 18h.' }
    ];
  });
  const [newReplyTitle, setNewReplyTitle] = useState('');
  const [newReplyContent, setNewReplyContent] = useState('');

  // Mass Broadcast Campaign states
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastLabel, setBroadcastLabel] = useState('Lead');
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const endpoint = isRegister ? '/inbox/auth/register' : '/inbox/auth/login';
      const body = isRegister 
        ? { email, password, firstName, lastName, organizationName: orgName }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setOrganization(data.organization);
      } else {
        setAuthError(data.error || "Ocorreu um erro na autenticação.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setAuthError("Erro de conexão com o servidor backend.");
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchProfile = async (authToken) => {
    try {
      const res = await fetch('/inbox/auth/profile', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setOrganization(data.organization);
        
        if (data.organization) {
          setOrgName(data.organization.name || '');
          setCompanyWebsite(data.organization.website || 'https://noviapp.ai/');
          setCustomDashboardUrl(data.organization.dashboardUrl || 'https://example.com/dashboard');
          setCompanySummary(data.organization.description || 'Sistemas de IA sob medida, automação inteligente e software empresarial — projetados para transformar a forma como sua empresa opera. Possibilidades infinitas, um parceiro.');
        }
      } else {
        handleLogout();
      }
    } catch (e) {
      console.error("Profile query failed:", e);
      handleLogout();
    }
  };

  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/inbox/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (e) {
      console.error("Failed to load threads:", e);
    }
  };

  const fetchBotsList = async () => {
    if (!token) return;
    try {
      const res = await fetch('/channels/bots', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBots(data.bots);
        if (data.bots.length > 0 && !selectedBot) {
          handleSelectBot(data.bots[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load bots:", e);
    }
  };

  const fetchAgentsList = async () => {
    if (!token) return;
    try {
      const res = await fetch('/inbox/agents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (e) {
      console.error("Failed to load agents list:", e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
      fetchConversations();
      fetchBotsList();
      fetchAgentsList();
    }
  }, [token]);

  // Sync Quick Replies with localStorage
  useEffect(() => {
    localStorage.setItem('chatflow_quick_replies', JSON.stringify(quickReplies));
  }, [quickReplies]);

  const handleSelectBot = (bot) => {
    setSelectedBot(bot);
    setAgentName(bot.name || '');
    setAgentDescription(bot.description || 'Atendimento ao Cliente B2C');
    setAgentPrompt(bot.systemPrompt || '');
    setAgentModel(bot.model || 'gemini-2.5-flash');
    setAgentTemperature(bot.temperature || 0.7);
    setAgentGreeting(bot.greetingMessage || '');
  };

  const handleCreateBot = async (e) => {
    e.preventDefault();
    if (!newBotName.trim()) return;

    try {
      const res = await fetch('/channels/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newBotName })
      });
      const data = await res.json();
      if (data.success) {
        alert("Novo agente AI criado com sucesso!");
        setNewBotName('');
        fetchBotsList();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao criar o bot.");
    }
  };

  // Update Bot Details dynamically in SQLite
  const handleUpdateBotSettings = async (e) => {
    e.preventDefault();
    if (!selectedBot) return;
    setIsBotSaving(true);

    try {
      const res = await fetch(`/channels/bots/${selectedBot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: agentName,
          systemPrompt: agentPrompt,
          greetingMessage: agentGreeting,
          temperature: parseFloat(agentTemperature),
          model: agentModel
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Configurações do Agente AI salvas com sucesso!");
        fetchBotsList();
      } else {
        alert("Falha ao atualizar o bot.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão.");
    } finally {
      setIsBotSaving(false);
    }
  };

  const handleDeleteBot = async () => {
    if (!selectedBot) return;
    if (!window.confirm(`Tem certeza de que deseja excluir o agente "${selectedBot.name}"?`)) return;

    try {
      const res = await fetch(`/channels/bots/${selectedBot.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert("Agente AI excluído com sucesso!");
        setSelectedBot(null);
        fetchBotsList();
      } else {
        alert("Falha ao excluir o agente: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão.");
    }
  };

  const handleUploadKnowledge = async (e) => {
    e.preventDefault();
    if (!knowledgeText.trim() || !knowledgeSource.trim()) return;

    let botId = selectedBot?.id;
    if (!botId) {
      if (bots.length > 0) {
        botId = bots[0].id;
      } else {
        alert("Por favor, crie um Agente AI na aba 'Agentes AI' antes de indexar documentos.");
        return;
      }
    }

    setUploadingKnowledge(true);
    try {
      const res = await fetch(`/channels/bots/${botId}/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceName: knowledgeSource,
          content: knowledgeText
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Documento indexado com sucesso na Base de Conhecimento RAG!");
        setKnowledgeText('');
        setKnowledgeSource('');
      } else {
        alert(`Erro ao indexar documento: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error("Error uploading knowledge:", err);
      alert("Falha de conexão ao indexar documento.");
    } finally {
      setUploadingKnowledge(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/channels/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          geminiKey, 
          name: orgName, 
          website: companyWebsite, 
          dashboardUrl: customDashboardUrl, 
          description: companySummary 
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Configurações da organização salvas no banco de dados!");
        setOrganization(data.organization);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao salvar as configurações.");
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    if (!newAgentEmail || !newAgentPassword || !newAgentFirstName || !newAgentLastName) return;
    setAgentLoading(true);

    try {
      const res = await fetch('/inbox/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newAgentEmail,
          password: newAgentPassword,
          firstName: newAgentFirstName,
          lastName: newAgentLastName,
          role: newAgentRole
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Novo operador cadastrado com sucesso!");
        setNewAgentEmail('');
        setNewAgentPassword('');
        setNewAgentFirstName('');
        setNewAgentLastName('');
        fetchAgentsList();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao cadastrar o operador.");
    } finally {
      setAgentLoading(false);
    }
  };

  const triggerBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setSendingBroadcast(true);
    setBroadcastProgress(10);

    try {
      const res = await fetch('/inbox/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          label: broadcastLabel,
          content: broadcastText
        })
      });
      const data = await res.json();
      setBroadcastProgress(100);
      setSendingBroadcast(false);
      
      if (data.success) {
        alert(data.message);
        setBroadcastText('');
        setBroadcastProgress(0);
        fetchConversations();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      setSendingBroadcast(false);
      alert("Falha ao disparar mensagens.");
    }
  };

  const addQuickReply = (e) => {
    e.preventDefault();
    if (!newReplyTitle.trim() || !newReplyContent.trim()) return;
    setQuickReplies([
      ...quickReplies,
      { id: Date.now().toString(), title: newReplyTitle, content: newReplyContent }
    ]);
    setNewReplyTitle('');
    setNewReplyContent('');
  };

  const deleteQuickReply = (id) => {
    setQuickReplies(quickReplies.filter(r => r.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setOrganization(null);
  };

  if (!token || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'radial-gradient(circle at center, #14141d 0%, #08080c 100%)' }}>
        <div className="glass" style={{ width: '420px', padding: '40px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
          
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))', borderTopLeftRadius: 'var(--radius)', borderTopRightRadius: 'var(--radius)' }}></div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'hsl(var(--primary))', marginBottom: '8px' }}>
              <img src="/icon.png" alt="ChatFlow Icon" className="pulse-glowing" style={{ height: '32px', width: 'auto', borderRadius: '6px' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.03em', color: '#fff' }}>ChatFlow</h2>
            </div>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', marginTop: '4px' }}>
              {isRegister 
                ? "Registre uma nova organização para construir robôs omnichannel de IA."
                : "Entre com suas credenciais para gerenciar conversas, CRM e checkout."}
            </p>
          </div>

          {authError && (
            <div className="glass" style={{ background: 'hsl(var(--danger) / 0.15)', borderColor: 'hsl(var(--danger) / 0.3)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: 'hsl(var(--danger))' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isRegister && (
              <>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Nome</label>
                    <input 
                      type="text" 
                      required 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.4)', border: '1px solid hsl(var(--border))', padding: '10px 12px', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Sobrenome</label>
                    <input 
                      type="text" 
                      required 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.4)', border: '1px solid hsl(var(--border))', padding: '10px 12px', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Nome da Organização</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Noviapp"
                    value={orgName} 
                    onChange={(e) => setOrgName(e.target.value)}
                    style={{ width: '100%', background: 'hsl(var(--border) / 0.4)', border: '1px solid hsl(var(--border))', padding: '10px 12px', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Endereço de E-mail</label>
              <input 
                type="email" 
                required 
                placeholder="exemplo@empresa.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', background: 'hsl(var(--border) / 0.4)', border: '1px solid hsl(var(--border))', padding: '10px 12px', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Senha</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', background: 'hsl(var(--border) / 0.4)', border: '1px solid hsl(var(--border))', padding: '10px 12px', borderRadius: '6px', fontSize: '13px' }}
              />
            </div>

            <button type="submit" disabled={authLoading} className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '6px', fontSize: '14px', fontWeight: '700' }}>
              {authLoading ? "Autenticando..." : (isRegister ? "Registrar Organização" : "Entrar no Painel")}
            </button>
          </form>

          <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border))', margin: '10px 0 0 0' }} />

          <div style={{ textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
            {isRegister ? (
              <span>Já possui uma conta? <button onClick={() => { setIsRegister(false); setAuthError(''); }} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--secondary))', cursor: 'pointer', padding: 0, fontWeight: '600' }}>Faça login aqui</button></span>
            ) : (
              <span>Novo no ChatFlow? <button onClick={() => { setIsRegister(true); setAuthError(''); }} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--secondary))', cursor: 'pointer', padding: 0, fontWeight: '600' }}>Registrar organização</button></span>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      
      {/* SIDEBAR NAVIGATION: PORTUGUESE */}
      <div className="sidebar" style={{ width: '250px' }}>
        
        <div className="sidebar-logo" style={{ paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/icon.png" alt="ChatFlow Logo" style={{ height: '24px', width: 'auto', borderRadius: '4px' }} />
          <span style={{ fontSize: '22px', letterSpacing: '-0.04em', fontWeight: 800, textTransform: 'lowercase', color: '#fff' }}>chatflow</span>
        </div>

        <div className="sidebar-nav" style={{ marginTop: '10px', gap: '4px' }}>
          <div onClick={() => { setActiveTab('CONVERSAS'); fetchConversations(); }} className={`nav-item ${activeTab === 'CONVERSAS' ? 'active' : ''}`}>
            <MessageSquare size={17} />
            <span>Conversas</span>
            {conversations.filter(c => c.status === 'OPEN').length > 0 && (
              <span className="badge badge-whatsapp" style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', borderRadius: '8px' }}>
                {conversations.filter(c => c.status === 'OPEN').length}
              </span>
            )}
          </div>

          <div onClick={() => { setActiveTab('CRM'); fetchConversations(); }} className={`nav-item ${activeTab === 'CRM' ? 'active' : ''}`}>
            <Layers size={17} />
            <span>Fluxo CRM</span>
          </div>

          <div onClick={() => { setActiveTab('CONTATOS'); fetchConversations(); }} className={`nav-item ${activeTab === 'CONTATOS' ? 'active' : ''}`}>
            <User size={17} />
            <span>Contatos</span>
          </div>

          <div onClick={() => { setActiveTab('AGENTES'); fetchBotsList(); }} className={`nav-item ${activeTab === 'AGENTES' ? 'active' : ''}`}>
            <Cpu size={17} />
            <span>Agentes AI</span>
          </div>

          <div onClick={() => { setActiveTab('OPERADORES'); fetchAgentsList(); }} className={`nav-item ${activeTab === 'OPERADORES' ? 'active' : ''}`}>
            <UserCheck size={17} />
            <span>Operadores</span>
          </div>

          <div onClick={() => setActiveTab('CONHECIMENTO')} className={`nav-item ${activeTab === 'CONHECIMENTO' ? 'active' : ''}`}>
            <Database size={17} />
            <span>Bases de conhecimento</span>
          </div>

          <div onClick={() => setActiveTab('ARTEFATOS')} className={`nav-item ${activeTab === 'ARTEFATOS' ? 'active' : ''}`} style={{ position: 'relative' }}>
            <FileText size={17} />
            <span>Artefatos</span>
            <span className="badge" style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, hsl(var(--primary)), #8a2be2)', color: '#fff', fontSize: '8px', padding: '2px 5px' }}>NEW</span>
          </div>

          <div onClick={() => { setActiveTab('DISPAROS'); fetchConversations(); }} className={`nav-item ${activeTab === 'DISPAROS' ? 'active' : ''}`}>
            <Megaphone size={17} />
            <span>Disparos</span>
          </div>

          <div onClick={() => setActiveTab('NOVIAPI')} className={`nav-item ${activeTab === 'NOVIAPI' ? 'active' : ''}`}>
            <FileCode size={17} />
            <span>NoviAPI</span>
            <span className="badge" style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #006aff, hsl(var(--secondary)))', color: '#fff', fontSize: '8px', padding: '2px 5px' }}>BETA</span>
          </div>

          <div onClick={() => setActiveTab('METRICAS')} className={`nav-item ${activeTab === 'METRICAS' ? 'active' : ''}`}>
            <BarChart3 size={17} />
            <span>Métricas</span>
          </div>

          <div onClick={() => setActiveTab('HUB')} className={`nav-item ${activeTab === 'HUB' ? 'active' : ''}`}>
            <Globe size={17} />
            <span>Hub</span>
            <span className="badge" style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, hsl(var(--primary)), #8a2be2)', color: '#fff', fontSize: '8px', padding: '2px 5px' }}>NEW</span>
          </div>

          <div onClick={() => setActiveTab('CONFIGURACOES')} className={`nav-item ${activeTab === 'CONFIGURACOES' ? 'active' : ''}`}>
            <Settings size={17} />
            <span>Configurações</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid hsl(var(--border))', paddingTop: '14px' }}>
          <div style={{ padding: '0 8px' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#fff' }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {organization?.name || "Noviapp"}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'rgb(239, 68, 68)',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <LogOut size={13} />
            <span>Sair da Conta</span>
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
            <a href="https://noviapp.ai/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <img src="/logo1.png" alt="NoviApp Logo" style={{ height: '29px', width: 'auto', opacity: 0.7, transition: 'opacity 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.target.style.opacity = 1} onMouseOut={(e) => e.target.style.opacity = 0.7} />
            </a>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', opacity: 0.6 }}>© 2026 NoviApp AI Systems</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="main-content">
        
        {/* TOP NAV BAR */}
        <div className="main-header" style={{ height: '65px', padding: '0 25px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500' }}>
            <span style={{ color: 'hsl(var(--text-muted))' }}>Início</span>
            <ChevronRight size={12} style={{ color: 'hsl(var(--border))' }} />
            <span style={{ color: '#fff', fontWeight: '600' }}>
              {activeTab === 'CONVERSAS' && "Conversas"}
              {activeTab === 'CRM' && "Fluxo CRM"}
              {activeTab === 'CONTATOS' && "Contatos"}
              {activeTab === 'AGENTES' && "Agentes AI"}
              {activeTab === 'OPERADORES' && "Operadores"}
              {activeTab === 'CONHECIMENTO' && "Bases de conhecimento"}
              {activeTab === 'ARTEFATOS' && "Artefatos"}
              {activeTab === 'DISPAROS' && "Disparos"}
              {activeTab === 'NOVIAPI' && "NoviAPI"}
              {activeTab === 'METRICAS' && "Métricas"}
              {activeTab === 'HUB' && "Hub"}
              {activeTab === 'CONFIGURACOES' && "Configurações"}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            
            {organization && (
              <div className="org-badge" style={{ fontSize: '11px', background: 'rgba(255,255,255,0.03)', border: '1px solid hsl(var(--border))', padding: '4px 10px', height: '28px' }}>
                <Database size={12} style={{ color: 'hsl(var(--secondary))' }} />
                <span>Créditos: <strong>{organization.apiUsageThisMonth}</strong> / {organization.maxMessagesPerMonth} msgs</span>
              </div>
            )}

            <div style={{ position: 'relative', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>
              <Bell size={18} />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(var(--primary))' }}></div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '4px 8px', borderRadius: '4px', border: '1px solid hsl(var(--border))' }}>
              <span>🇧🇷</span>
              <span style={{ color: 'hsl(var(--text-muted))' }}>PT-BR</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(var(--border) / 0.4)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid hsl(var(--border))' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#25d366' }}></span>
              <span>{organization?.name || "Noviapp"}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{user.firstName}</span>
                <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{user.email}</span>
              </div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#000', fontWeight: '700', fontSize: '12px', boxShadow: '0 0 10px hsl(var(--primary-glow))' }}>
                <span style={{ margin: 'auto' }}>{user.firstName[0].toUpperCase()}</span>
              </div>
            </div>

          </div>

        </div>

        {/* VIEWPORTS */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          
          {/* TAB 1: CONVERSAS */}
          {activeTab === 'CONVERSAS' && (
            <OmnichannelInbox token={token} user={user} />
          )}

          {/* TAB 2: FLUXO CRM */}
          {activeTab === 'CRM' && (
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Painel CRM Funnel</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '2px' }}>
                  Suas conversas do Omnichannel Inbox distribuídas dinamicamente de acordo com rótulos e transações registradas.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px', flex: 1, overflowX: 'auto', alignItems: 'start', paddingBottom: '20px' }}>
                {[
                  { name: 'Novo Lead', color: 'hsl(var(--primary))', label: '' },
                  { name: 'Qualificado', color: '#006aff', label: 'Lead' },
                  { name: 'Negociação', color: '#f9d423', label: 'Support' },
                  { name: 'Aguardando Pgto', color: 'hsl(var(--warning))', label: 'Billing' },
                  { name: 'Finalizado (Won)', color: 'hsl(var(--success))', label: 'Closed' }
                ].map(col => {
                  const colThreads = conversations.filter(c => {
                    if (col.name === 'Novo Lead') {
                      return !c.label && c.status !== 'CLOSED';
                    }
                    if (col.name === 'Finalizado (Won)') {
                      return c.status === 'CLOSED';
                    }
                    return c.label === col.label;
                  });

                  return (
                    <div className="glass" key={col.name} style={{ flex: '0 0 240px', background: 'rgba(255,255,255,0.01)', border: '1px solid hsl(var(--border) / 0.6)', padding: '14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: col.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: col.color }}></span>
                          {col.name}
                        </span>
                        <span className="org-badge" style={{ padding: '2px 6px', fontSize: '10px' }}>{colThreads.length}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '420px', minHeight: '120px' }}>
                        {colThreads.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px 5px', color: 'hsl(var(--text-muted))', fontSize: '11px', border: '1px dashed hsl(var(--border) / 0.5)', borderRadius: '6px' }}>
                            Sem leads nesta etapa.
                          </div>
                        ) : (
                          colThreads.map(thread => (
                            <div key={thread.id} className="glowing-card" style={{ padding: '12px', background: 'hsl(var(--bg-card))', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('CONVERSAS')}>
                              <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{thread.contact?.name || 'Visitante'}</div>
                              <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>ID: <code>{thread.contact?.platformId.slice(0, 14)}...</code></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {thread.channel.type}
                                </span>
                                <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))' }}>
                                  {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CONTATOS DIRECTORY */}
          {activeTab === 'CONTATOS' && (
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Diretório de Contatos</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '2px' }}>
                  Lista completa de leads integrados pelas APIs oficiais da Meta (WhatsApp, Instagram e Facebook Messenger) e Web Widget.
                </p>
              </div>

              <div className="glass" style={{ padding: '20px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--border))', color: 'hsl(var(--text-muted))' }}>
                      <th style={{ padding: '12px 10px' }}>Nome do Lead</th>
                      <th style={{ padding: '12px 10px' }}>ID de Plataforma</th>
                      <th style={{ padding: '12px 10px' }}>Canal de Origem</th>
                      <th style={{ padding: '12px 10px' }}>Data de Cadastro</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversations.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                          Nenhum contato sincronizado na base ainda.
                        </td>
                      </tr>
                    ) : (
                      conversations.map(conv => (
                        <tr key={conv.id} style={{ borderBottom: '1px solid hsl(var(--border) / 0.4)' }}>
                          <td style={{ padding: '14px 10px', fontWeight: '600' }}>{conv.contact?.name}</td>
                          <td style={{ padding: '14px 10px' }}><code>{conv.contact?.platformId}</code></td>
                          <td style={{ padding: '14px 10px' }}>
                            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '12px' }}>
                              {conv.contact?.platformType || 'WHATSAPP'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            {new Date(conv.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                            <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setActiveTab('CONVERSAS')}>
                              Abrir Chat
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AGENTES AI BUILDER (EXACT MATCH TO SCREENSHOT VIEWER) */}
          {activeTab === 'AGENTES' && (
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Agentes AI</h3>
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '2px' }}>
                    Configure as chaves, prompts, modelos e webhooks do seu agente autônomo Zimmy.
                  </p>
                </div>

                {/* Add new agent bot inline */}
                <form onSubmit={handleCreateBot} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Nome do novo Agente AI"
                    value={newBotName}
                    onChange={(e) => setNewBotName(e.target.value)}
                    style={{ background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Novo Agente
                  </button>
                </form>
              </div>

              {/* List selection */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {bots.map(bot => (
                  <button
                    key={bot.id}
                    onClick={() => handleSelectBot(bot)}
                    style={{
                      background: selectedBot?.id === bot.id ? 'hsl(var(--primary-glow))' : 'rgba(255,255,255,0.02)',
                      color: selectedBot?.id === bot.id ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                      border: '1px solid',
                      borderColor: selectedBot?.id === bot.id ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))',
                      borderRadius: '16px',
                      padding: '6px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    🤖 {bot.name}
                  </button>
                ))}
              </div>

              {selectedBot ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '25px', alignItems: 'start', marginTop: '10px' }}>
                  
                  {/* Left inner tab selector matching "Geral & Fluxo", "Modelo", "Ferramentas", "Webhooks" */}
                  <div className="glass" style={{ padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.01)' }}>
                    <div onClick={() => setBotSettingsTab('GERAL')} className={`nav-item ${botSettingsTab === 'GERAL' ? 'active' : ''}`} style={{ fontSize: '13px', padding: '8px 12px' }}>
                      <User size={15} />
                      <span>Geral & Fluxo</span>
                    </div>
                    <div onClick={() => setBotSettingsTab('MODELO')} className={`nav-item ${botSettingsTab === 'MODELO' ? 'active' : ''}`} style={{ fontSize: '13px', padding: '8px 12px' }}>
                      <Sliders size={15} />
                      <span>Modelo</span>
                    </div>
                    <div onClick={() => setBotSettingsTab('FERRAMENTAS')} className={`nav-item ${botSettingsTab === 'FERRAMENTAS' ? 'active' : ''}`} style={{ fontSize: '13px', padding: '8px 12px' }}>
                      <Cpu size={15} />
                      <span>Ferramentas</span>
                    </div>
                    <div onClick={() => setBotSettingsTab('WEBHOOKS')} className={`nav-item ${botSettingsTab === 'WEBHOOKS' ? 'active' : ''}`} style={{ fontSize: '13px', padding: '8px 12px' }}>
                      <Globe size={15} />
                      <span>Webhooks</span>
                    </div>
                  </div>

                  {/* Right Tab Content Viewports */}
                  <div className="glass" style={{ padding: '24px' }}>
                    
                    {/* SUBTAB 1: GERAL & FLUXO */}
                    {botSettingsTab === 'GERAL' && (
                      <form onSubmit={handleUpdateBotSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px', marginBottom: '10px' }}>Identificação do Agente</div>
                        
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', display: 'flex', fontSize: '24px', color: '#000', fontWeight: '800' }}>
                            <span style={{ margin: 'auto' }}>🤖</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>Substituir</button>
                            <button type="button" onClick={handleDeleteBot} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)', border: 'none' }}>Excluir</button>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Nome</label>
                          <input 
                            type="text" 
                            required
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '13px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Descrição</label>
                          <input 
                            type="text" 
                            value={agentDescription}
                            onChange={(e) => setAgentDescription(e.target.value)}
                            style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '13px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Mensagem de Saudação</label>
                          <textarea 
                            rows={3}
                            value={agentGreeting}
                            onChange={(e) => setAgentGreeting(e.target.value)}
                            placeholder="Ex: Olá! Como posso te ajudar hoje?"
                            style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                          />
                        </div>

                        <div style={{ marginTop: '10px' }}>
                          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>ID do Agente</span>
                          <code style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '4px', border: '1px solid hsl(var(--border))', fontSize: '11px', display: 'inline-block' }}>{selectedBot.id}</code>
                        </div>

                        <button type="submit" disabled={isBotSaving} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '13px', fontWeight: '700', marginTop: '10px' }}>
                          {isBotSaving ? "Salvando..." : "Salvar Agente"}
                        </button>
                      </form>
                    )}

                    {/* SUBTAB 2: MODELO */}
                    {botSettingsTab === 'MODELO' && (
                      <form onSubmit={handleUpdateBotSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px', marginBottom: '10px' }}>Prompt & Personalidade</div>
                        
                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                            Prompt - Personalize o Prompt, o modelo de linguagem e opções de comportamento do seu agente.
                          </label>
                          <textarea 
                            rows={8}
                            required
                            value={agentPrompt}
                            onChange={(e) => setAgentPrompt(e.target.value)}
                            style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '12px', borderRadius: '6px', fontSize: '13px', lineHeight: '1.4', resize: 'vertical' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Modelo de Linguagem AI</label>
                          <select 
                            value={agentModel}
                            onChange={(e) => setAgentModel(e.target.value)}
                            style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '13px' }}
                          >
                            <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Recomendado)</option>
                            <option value="gemini-2.5-pro">Google Gemini 2.5 Pro</option>
                            <option value="chatgpt-4o-mini">ChatGPT-4o Mini (Simulado)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Temperatura: {agentTemperature}</label>
                          <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1"
                            value={agentTemperature}
                            onChange={(e) => setAgentTemperature(parseFloat(e.target.value))}
                            style={{ width: '100%', accentColor: 'hsl(var(--primary))' }}
                          />
                        </div>

                        <button type="submit" disabled={isBotSaving} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '13px', fontWeight: '700', marginTop: '10px' }}>
                          {isBotSaving ? "Salvando..." : "Salvar Prompt"}
                        </button>
                      </form>
                    )}

                    {/* SUBTAB 3: FERRAMENTAS */}
                    {botSettingsTab === 'FERRAMENTAS' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px', marginBottom: '10px' }}>Ferramentas do Agente</div>
                        <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', margin: 0 }}>Ative ou desative as ferramentas disponíveis para tornar seu agente Zimmy mais inteligente.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                          
                          <div className="glass" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '13px' }}>Conectar Base de Conhecimento</div>
                              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Permite que o agente consulte vetores e chunks indexados na Base.</div>
                            </div>
                            <button onClick={() => setToolKnowledgeBase(!toolKnowledgeBase)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: toolKnowledgeBase ? 'hsl(var(--secondary))' : 'hsl(var(--text-muted))' }}>
                              {toolKnowledgeBase ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                          </div>

                          <div className="glass" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '13px' }}>Solicitar Transbordo Humano</div>
                              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>O agente muta a si mesmo automaticamente quando transbordo é exigido.</div>
                            </div>
                            <button onClick={() => setToolHumanHandover(!toolHumanHandover)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: toolHumanHandover ? 'hsl(var(--secondary))' : 'hsl(var(--text-muted))' }}>
                              {toolHumanHandover ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                          </div>

                          <div className="glass" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '13px' }}>Integrar HTTP ERP (Mock Connector)</div>
                              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>O agente realiza buscas automáticas e reservas em seu estoque ERP.</div>
                            </div>
                            <button onClick={() => setToolMockErp(!toolMockErp)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: toolMockErp ? 'hsl(var(--secondary))' : 'hsl(var(--text-muted))' }}>
                              {toolMockErp ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* SUBTAB 4: WEBHOOKS */}
                    {botSettingsTab === 'WEBHOOKS' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '800', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px', marginBottom: '10px' }}>Webhooks de Saída (Outbound)</div>
                        
                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Sua URL Externa</label>
                          <input 
                            type="text" 
                            placeholder="https://meu-endpoint.com/callback"
                            value={outboundWebhook}
                            onChange={(e) => setOutboundWebhook(e.target.value)}
                            style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '13px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Header de Autorização (Opcional)</label>
                          <input 
                            type="text" 
                            placeholder="Bearer meu-segredo-customizado"
                            value={outboundHeader}
                            onChange={(e) => setOutboundHeader(e.target.value)}
                            style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '13px' }}
                          />
                        </div>

                        <button type="button" onClick={() => alert("Webhook configurado com sucesso!")} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '13px', fontWeight: '700', marginTop: '10px' }}>
                          Salvar Webhook
                        </button>
                      </div>
                    )}

                  </div>

                </div>
              ) : (
                <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                  Crie ou selecione um Agente AI para começar a configurar.
                </div>
              )}
            </div>
          )}

          {/* TAB 4.5: OPERADORES (HUMAN TEAM ROSTER SEATS) */}
          {activeTab === 'OPERADORES' && (
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Equipe & Operadores</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '2px' }}>
                  Controle as permissões de acesso da sua equipe e distribua os chats de suporte e vendas.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', alignItems: 'start' }}>
                
                {/* List of Operators */}
                <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px' }}>Contas de Operadores Ativas</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {agents.map(ag => (
                      <div key={ag.id} className="glowing-card" style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', display: 'flex', color: '#000', fontWeight: '800', fontSize: '12px' }}>
                          <span style={{ margin: 'auto' }}>{ag.firstName[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13px' }}>{ag.firstName} {ag.lastName}</div>
                          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>{ag.email}</div>
                          <div style={{ fontSize: '9px', background: ag.role === 'OWNER' ? 'hsl(var(--primary-glow))' : 'rgba(255,255,255,0.05)', color: ag.role === 'OWNER' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))', fontWeight: '700', display: 'inline-block', padding: '1px 5px', borderRadius: '4px', marginTop: '4px' }}>{ag.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Create Operator form */}
                <div className="glass" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '14px' }}>Adicionar Operador</h4>
                  <form onSubmit={handleCreateAgent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Nome</label>
                      <input 
                        type="text" 
                        required
                        value={newAgentFirstName}
                        onChange={(e) => setNewAgentFirstName(e.target.value)}
                        placeholder="Diego"
                        style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Sobrenome</label>
                      <input 
                        type="text" 
                        required
                        value={newAgentLastName}
                        onChange={(e) => setNewAgentLastName(e.target.value)}
                        placeholder="Maradona"
                        style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>E-mail</label>
                      <input 
                        type="email" 
                        required
                        value={newAgentEmail}
                        onChange={(e) => setNewAgentEmail(e.target.value)}
                        placeholder="diego@volt.com"
                        style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Senha</label>
                      <input 
                        type="password" 
                        required
                        value={newAgentPassword}
                        onChange={(e) => setNewAgentPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Função</label>
                      <select 
                        value={newAgentRole} 
                        onChange={(e) => setNewAgentRole(e.target.value)}
                        style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}
                      >
                        <option value="AGENT">Agent (Vendas/Suporte)</option>
                        <option value="ADMIN">Admin (Seat Administrativo)</option>
                      </select>
                    </div>
                    <button type="submit" disabled={agentLoading} className="btn-primary" style={{ width: '100%', padding: '8px', fontSize: '12px', fontWeight: '700' }}>
                      {agentLoading ? "Registrando..." : "Registrar Operador"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BASES DE CONHECIMENTO */}
          {activeTab === 'CONHECIMENTO' && (
            <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Bases de Conhecimento RAG</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '2px' }}>
                  Alimente o robô de inteligência artificial com catálogos, regras e FAQs. O sistema converterá as informações em vetores de alta dimensão.
                </p>
              </div>

              <div className="glass" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px' }}>
                  <Database size={18} style={{ color: 'hsl(var(--secondary))' }} /> Indexação de Documento
                </h3>
                
                <form onSubmit={handleUploadKnowledge} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                      Nome do Documento / FAQ
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Tabela de Preços e Prazos"
                      value={knowledgeSource}
                      onChange={(e) => setKnowledgeSource(e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px 12px', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                      Conteúdo de Texto Sincronizável
                    </label>
                    <textarea 
                      required
                      rows={6}
                      placeholder="Escreva ou cole as especificações de produtos, políticas de trocas ou respostas prontas aqui."
                      value={knowledgeText}
                      onChange={(e) => setKnowledgeText(e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '12px', borderRadius: '6px', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                    />
                  </div>

                  <button type="submit" disabled={uploadingKnowledge || !knowledgeText || !knowledgeSource} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '13px' }}>
                    {uploadingKnowledge ? "Processando Vetores..." : "Indexar Documento na Base"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: ARTEFATOS */}
          {activeTab === 'ARTEFATOS' && (
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Artefatos & Atalhos</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '2px' }}>
                  Crie atalhos e modelos de respostas rápidas para acelerar os atendimentos humanos nas conversas.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', alignItems: 'start' }}>
                <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px' }}>Respostas Rápidas Ativas</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {quickReplies.map(reply => (
                      <div key={reply.id} className="glowing-card" style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{reply.title}</strong>
                          <button onClick={() => deleteQuickReply(reply.id)} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--danger))', cursor: 'pointer', fontSize: '11px' }}>Excluir</button>
                        </div>
                        <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.4' }}>"{reply.content}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '14px' }}>Novo Artefato</h4>
                  <form onSubmit={addQuickReply} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Título do Atalho</label>
                      <input 
                        type="text" 
                        required
                        value={newReplyTitle}
                        onChange={(e) => setNewReplyTitle(e.target.value)}
                        placeholder="Ex: Pix instruções"
                        style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Texto da Resposta</label>
                      <textarea 
                        required
                        rows={4}
                        value={newReplyContent}
                        onChange={(e) => setNewReplyContent(e.target.value)}
                        placeholder="Escreva a resposta completa..."
                        style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', resize: 'none' }}
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '8px', fontSize: '12px' }}>
                      Adicionar Atalho
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DISPAROS */}
          {activeTab === 'DISPAROS' && (
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px', margin: '0 auto' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Disparos em Massa</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '2px' }}>
                  Configure e dispare mensagens em lote para seus clientes baseados em rótulos específicos do CRM.
                </p>
              </div>

              <div className="glass" style={{ padding: '24px' }}>
                <form onSubmit={triggerBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Rótulo Alvo (CRM Labels)</label>
                    <select 
                      value={broadcastLabel} 
                      onChange={(e) => setBroadcastLabel(e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
                    >
                      <option value="Lead">Todos os Leads Sincronizados ({conversations.filter(c => c.label === 'Lead' || !c.label).length} contatos)</option>
                      <option value="Billing">Faturamento / Billing ({conversations.filter(c => c.label === 'Billing').length} contatos)</option>
                      <option value="Support">Suporte Técnico ({conversations.filter(c => c.label === 'Support').length} contatos)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Conteúdo do Disparo</label>
                    <textarea 
                      required
                      rows={5}
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                      placeholder="Olá! Temos novidades imperdíveis da nossa loja..."
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '12px', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                    />
                  </div>

                  {sendingBroadcast && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span>Disparando mensagens no banco de dados e socket.io...</span>
                        <span>{broadcastProgress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'hsl(var(--border))', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${broadcastProgress}%`, height: '100%', background: 'hsl(var(--primary))', transition: 'width 0.3s' }}></div>
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={sendingBroadcast || !broadcastText.trim()} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '13px' }}>
                    {sendingBroadcast ? "Enviando Disparos..." : "Iniciar Campanha de Disparos"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 8: NOVIAPI */}
          {activeTab === 'NOVIAPI' && (
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px', margin: '0 auto' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>NoviAPI Connectors</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '2px' }}>
                  Integre o ChatFlow com seus ERPs (Bling, Tiny, Odoo) e envie mensagens programáticas através do protocolo HTTP REST.
                </p>
              </div>

              <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCode size={18} style={{ color: 'hsl(var(--primary))' }} /> Envio de Mensagem por API
                </h4>
                
                <div style={{ fontSize: '12px' }}>
                  <div style={{ marginBottom: '10px' }}><strong>Método:</strong> <span style={{ padding: '2px 6px', background: 'hsl(var(--success) / 0.15)', color: 'hsl(var(--success))', borderRadius: '4px', fontWeight: '700' }}>POST</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                    <strong>Bearer Token de Autorização:</strong>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <code style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '4px', border: '1px solid hsl(var(--border))', overflowX: 'auto', maxWidth: '380px' }}>
                        {token.substring(0, 40)}...
                      </code>
                      <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => { navigator.clipboard.writeText(token); alert("Token JWT copiado com sucesso!"); }}>Copiar</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                    <strong>Endpoint URL:</strong>
                    <code style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '4px', border: '1px solid hsl(var(--border))' }}>
                      http://localhost:5000/inbox/conversations/&#123;id&#125;/reply
                    </code>
                  </div>
                  
                  <strong>Payload JSON Exemplo:</strong>
                  <pre style={{ background: '#0a0a0f', border: '1px solid hsl(var(--border))', padding: '12px', borderRadius: '6px', color: 'hsl(var(--secondary))', marginTop: '6px' }}>
{`{
  "content": "Sua nota fiscal já foi faturada e o rastreamento é BR123456789BR."
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: METRICAS */}
          {activeTab === 'METRICAS' && (
            <EcommerceDashboard token={token} />
          )}

          {/* TAB 10: HUB */}
          {activeTab === 'HUB' && (
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Central de Canais Hub</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '2px' }}>
                  Gerencie as credenciais e integre os webhook callbacks oficiais das contas empresariais da Meta.
                </p>
              </div>

              <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={18} style={{ color: 'hsl(var(--primary))' }} /> Meta Webhooks Configurações
                </h4>

                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', alignItems: 'center' }}>
                    <strong>Webhook Callback URL:</strong>
                    <code style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', border: '1px solid hsl(var(--border))' }}>
                      http://localhost:5000/webhooks/meta
                    </code>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', alignItems: 'center' }}>
                    <strong>Verify Token (Token de Verificação):</strong>
                    <code style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', border: '1px solid hsl(var(--border))' }}>
                      {verifyToken}
                    </code>
                  </div>
                </div>

                <div className="glass" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px dashed hsl(var(--border))', marginTop: '10px' }}>
                  <h5 style={{ fontWeight: '700', marginBottom: '8px', fontSize: '12px' }}>Passo a Passo de Integração WhatsApp:</h5>
                  <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', color: 'hsl(var(--text-muted))' }}>
                    <li>Acesse o portal **Meta for Developers** e crie um App Business.</li>
                    <li>Ative o produto **WhatsApp** e clique em Webhooks.</li>
                    <li>Insira a URL de Callback e o Verify Token fornecidos acima.</li>
                    <li>Siga as instruções para assinar o campo de evento **messages**!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: CONFIGURACOES */}
          {activeTab === 'CONFIGURACOES' && (
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
              
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Configurações da Organização</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '2px' }}>
                  Ajuste os metadados do seu tenant, credenciais criptografadas de inteligência artificial e resumo de negócios.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px', fontSize: '13px', fontWeight: '600' }}>
                <span style={{ color: 'hsl(var(--primary))', borderBottom: '2px solid hsl(var(--primary))', paddingBottom: '10px', cursor: 'pointer' }}>Organização</span>
                <span style={{ color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>Assinatura</span>
                <span style={{ color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>Minhas Chaves</span>
                <span style={{ color: 'hsl(var(--text-muted))', cursor: 'pointer' }}>Chaves API</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start', marginTop: '10px' }}>
                
                {/* Left logo card */}
                <div className="glass" style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <div style={{ width: '110px', height: '110px', borderRadius: '50%', border: '2px dashed hsl(var(--border))', display: 'flex', alignItems: 'center', justifyCenter: 'center', background: 'rgba(255,255,255,0.01)', position: 'relative' }}>
                    <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-muted))' }}>
                      <Database size={24} />
                      <span style={{ fontSize: '10px' }}>Logo</span>
                    </div>
                    <button style={{ position: 'absolute', bottom: '0', right: '0', background: 'hsl(var(--primary))', color: '#fff', border: 'none', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', cursor: 'pointer' }}>
                      <Settings size={14} style={{ margin: 'auto' }} />
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
                    UUID: <code style={{ color: 'hsl(var(--secondary))' }}>{organization?.id || "default"}</code>
                  </div>
                </div>

                {/* Form fields */}
                <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div>
                    <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Nome da Organização</label>
                    <input 
                      type="text" 
                      value={orgName} 
                      onChange={(e) => setOrgName(e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Website da Empresa</label>
                    <input 
                      type="text" 
                      value={companyWebsite} 
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>URL do Dashboard Customizado</label>
                    <input 
                      type="text" 
                      value={customDashboardUrl} 
                      onChange={(e) => setCustomDashboardUrl(e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                      Resumo da Empresa - Usado como contexto pelos agentes (RAG Prompts)
                    </label>
                    <textarea 
                      rows={5}
                      value={companySummary} 
                      onChange={(e) => setCompanySummary(e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', resize: 'none', lineHeight: '1.4' }}
                    />
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border))', margin: '10px 0' }} />

                  <div>
                    <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                      Google Gemini Key (Criptografada e Sólida por Tenant)
                    </label>
                    <input 
                      type="password" 
                      placeholder="Nova Chave API (deixe em branco para manter a atual)" 
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button onClick={handleSaveSettings} className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px', fontWeight: '700' }}>
                      Salvar Configurações
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

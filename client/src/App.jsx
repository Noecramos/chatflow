import React, { useState, useEffect } from 'react';
import { 
  Menu, MessageSquare, ShoppingCart, Settings, LogOut, 
  Sparkles, Database, LayoutDashboard, Cpu, 
  Layers, User, UserCheck, FileText, Megaphone, 
  FileCode, Globe, Bell, CheckCircle2, ChevronRight, 
  Plus, Search, HelpCircle, ShieldAlert, Shield, Clock, ArrowRight,
  TrendingUp, BarChart3, AlertCircle, Copy, ToggleLeft, ToggleRight, Trash2, Edit, Sliders,
  Phone, Upload, Instagram, Facebook, Play, Save, FlaskConical, Terminal, Heart, Zap
} from 'lucide-react';
import OmnichannelInbox from './components/OmnichannelInbox';
import EcommerceDashboard from './components/EcommerceDashboard';
import CrmDashboard from './components/CrmDashboard';
import Documentation from './components/Documentation';
import AiAgentsView from './components/views/AiAgentsView';
import OperatorsView from './components/views/OperatorsView';
import KnowledgeBaseView from './components/views/KnowledgeBaseView';
import DisparosView from './components/views/DisparosView';
import NoviApiView from './components/views/NoviApiView';
import SettingsView from './components/views/SettingsView';
import MasterAdminView from './components/views/MasterAdminView';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [activeTab, setActiveTab] = useState('CONVERSAS');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth form states
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
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
  const [crmPipeline, setCrmPipeline] = useState([]);
  const [activeCrmStage, setActiveCrmStage] = useState('NOVO');
  const [isCrmRefreshing, setIsCrmRefreshing] = useState(false);
  const [newAgentEmail, setNewAgentEmail] = useState('');

  // Master Admin States
  const [subscribers, setSubscribers] = useState([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [isEditLimitsOpen, setIsEditLimitsOpen] = useState(false);
  const [newPlan, setNewPlan] = useState('FREE');
  const [newMaxBots, setNewMaxBots] = useState(2);
  const [newMaxMessages, setNewMaxMessages] = useState(1000);
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

  // Mass Broadcast Campaign & Contact List States
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastLabel, setBroadcastLabel] = useState('Lead');
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [activeBroadcastTab, setActiveBroadcastTab] = useState('ativos'); // ativos, agendados, concluidos, listas
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isManageListsOpen, setIsManageListsOpen] = useState(false);
  const [selectedCampaignLogs, setSelectedCampaignLogs] = useState([]);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [activeLogCampaignId, setActiveLogCampaignId] = useState(null);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignTargetType, setNewCampaignTargetType] = useState('LABEL'); // LABEL or LIST
  const [newCampaignListId, setNewCampaignListId] = useState('');
  const [newCampaignLabel, setNewCampaignLabel] = useState('Lead');
  const [newCampaignContent, setNewCampaignContent] = useState('');
  const [newCampaignScheduleEnabled, setNewCampaignScheduleEnabled] = useState(false);
  const [newCampaignScheduledFor, setNewCampaignScheduledFor] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newListContactIds, setNewListContactIds] = useState([]);
  const [campaignLogsLoading, setCampaignLogsLoading] = useState(false);
  const [listCreationLoading, setListCreationLoading] = useState(false);
  const [campaignCreationLoading, setCampaignCreationLoading] = useState(false);

  // Logo upload state
  const [orgLogo, setOrgLogo] = useState(() => localStorage.getItem('chatflow_org_logo') || null);

  // META WABA Integration states
  const [wabaAccessToken, setWabaAccessToken] = useState('');
  const [wabaPhoneNumberId, setWabaPhoneNumberId] = useState('');
  const [wabaBusinessId, setWabaBusinessId] = useState('');
  const [savingWaba, setSavingWaba] = useState(false);

  // Instagram Integration states
  const [igAccessToken, setIgAccessToken] = useState('');
  const [igPageId, setIgPageId] = useState('');
  const [savingIg, setSavingIg] = useState(false);

  // Facebook Messenger Integration states
  const [fbAccessToken, setFbAccessToken] = useState('');
  const [fbPageId, setFbPageId] = useState('');
  const [savingFb, setSavingFb] = useState(false);

  // ChatFlow Hub (Community Portal Feed) states
  const [activeHubCategory, setActiveHubCategory] = useState('inicio');
  const [hubSearchQuery, setHubSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Geral');
  const [hubPosts, setHubPosts] = useState([
    {
      id: 1,
      author: "Gabriel Oliveira",
      authorRole: "Founder",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      time: "3 dias atrás",
      badge: "Geral",
      title: "Notas de Atualização - v4.5.0",
      content: "Times e Permissões! Agora é possível criar sub-equipes dentro da sua organização de varejo e definir níveis de permissões de acesso específicos para cada atendente. Além disso, chegou o NPS integrado aos disparos do WhatsApp. Configure pesquisas de satisfação e receba relatórios automáticos de pós-venda direto no dashboard!",
      likes: 12,
      liked: false,
      comments: 2,
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: 2,
      author: "Ana Laura Fachini",
      authorRole: "Marketing Specialist",
      authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      time: "5 dias atrás",
      badge: "Comunicados",
      title: "Como Otimizar Disparos no Varejo 🚀",
      content: "Separamos 5 templates oficiais de WhatsApp validados para recuperação de carrinho abandonado em e-commerce. Lembre-se: mensagens curtas que oferecem frete grátis ou cupom de 10% têm taxas de conversão de carrinho abandonado acima de 28% no varejo. Configure-os agora mesmo!",
      likes: 24,
      liked: false,
      comments: 5,
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: 3,
      author: "Suporte Técnico",
      authorRole: "Dev Relations",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      time: "1 semana atrás",
      badge: "Compartilhar Prompts",
      title: "Melhorias no NoviAPI Sandbox 🧪",
      content: "Nosso ambiente de sandbox JavaScript (Node VM) agora conta com autossalvamento automático antes da execução. Você pode rodar consultas dinâmicas de frete diretamente nos Correios ou integrar com o Bling ERP de forma totalmente isolada e performática.",
      likes: 8,
      liked: false,
      comments: 1,
      imageUrl: null
    }
  ]);

  // NoviAPI (VoltAPI Style) states
  const [customScripts, setCustomScripts] = useState([]);
  const [selectedScript, setSelectedScript] = useState(null);
  const [scriptName, setScriptName] = useState('');
  const [scriptCode, setScriptCode] = useState('');
  const [scriptIsActive, setScriptIsActive] = useState(true);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptSaving, setScriptSaving] = useState(false);
  const [scriptExecuting, setScriptExecuting] = useState(false);
  const [testInput, setTestInput] = useState('{\n  "value": "Hello ChatFlow!"\n}');
  const [testOutput, setTestOutput] = useState(null);
  const [testLogs, setTestLogs] = useState([]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

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
        if (isRegister) {
          setAuthSuccess("Organização criada com sucesso! Faça login com a sua senha para entrar no painel.");
          setIsRegister(false);
          setFirstName('');
          setLastName('');
          setOrgName('');
          setPassword('');
        } else {
          localStorage.setItem('token', data.token);
          setToken(data.token);
          setUser(data.user);
          setOrganization(data.organization);
        }
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

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch('/inbox/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setAuthSuccess(data.message || "Sua solicitação de redefinição foi registrada com sucesso! Por favor, chame o Administrador Master para obter sua nova senha provisória.");
        setEmail('');
      } else {
        setAuthError(data.error || "Ocorreu um erro ao processar a solicitação.");
      }
    } catch (err) {
      console.error("Forgot password submit error:", err);
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

  const fetchCampaigns = async () => {
    if (!token) return;
    try {
      const res = await fetch('/inbox/broadcasts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (e) {
      console.error("Failed to load campaigns:", e);
    }
  };

  const fetchContactLists = async () => {
    if (!token) return;
    try {
      const res = await fetch('/inbox/contact-lists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setContactLists(data.contactLists);
      }
    } catch (e) {
      console.error("Failed to load contact lists:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'DISPAROS' && token) {
      fetchCampaigns();
      fetchContactLists();

      // Start dynamic progress bar polling every 4 seconds for processing campaigns
      const pollInterval = setInterval(() => {
        fetchCampaigns();
      }, 4000);

      return () => clearInterval(pollInterval);
    }
  }, [activeTab, token]);

  const fetchCustomScripts = async () => {
    if (!token) return;
    setScriptLoading(true);
    try {
      const res = await fetch('/channels/scripts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomScripts(data.scripts);
        if (data.scripts.length > 0) {
          const firstScript = data.scripts[0];
          setSelectedScript(firstScript);
          setScriptName(firstScript.name);
          setScriptCode(firstScript.code);
          setScriptIsActive(firstScript.isActive);
        } else {
          setSelectedScript(null);
          setScriptName('');
          setScriptCode('');
          setScriptIsActive(true);
        }
      }
    } catch (e) {
      console.error("Failed to load custom scripts:", e);
    } finally {
      setScriptLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'NOVIAPI' && token) {
      fetchCustomScripts();
    }
  }, [activeTab, token]);

  const handleSelectScript = (script) => {
    setSelectedScript(script);
    setScriptName(script.name);
    setScriptCode(script.code);
    setScriptIsActive(script.isActive);
    setTestOutput(null);
    setTestLogs([]);
  };

  const handleCreateScript = async () => {
    if (!token) return;
    setScriptSaving(true);
    try {
      const res = await fetch('/channels/scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        const newScript = data.script;
        setCustomScripts([newScript, ...customScripts]);
        handleSelectScript(newScript);
      }
    } catch (e) {
      console.error("Failed to create script:", e);
      alert("Erro de conexão ao criar código.");
    } finally {
      setScriptSaving(false);
    }
  };

  const handleSaveScript = async () => {
    if (!selectedScript || !token) return;
    setScriptSaving(true);
    try {
      const res = await fetch(`/channels/scripts/${selectedScript.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: scriptName,
          code: scriptCode,
          isActive: scriptIsActive
        })
      });
      const data = await res.json();
      if (data.success) {
        const updated = data.script;
        setCustomScripts(customScripts.map(s => s.id === updated.id ? updated : s));
        setSelectedScript(updated);
        alert("Código salvo com sucesso!");
      } else {
        alert(data.error || "Erro ao salvar código.");
      }
    } catch (e) {
      console.error("Failed to save script:", e);
      alert("Erro de conexão ao salvar código.");
    } finally {
      setScriptSaving(false);
    }
  };

  const handleDeleteScript = async () => {
    if (!selectedScript || !token) return;
    if (!confirm("Deseja realmente excluir este código? Esta ação não pode ser desfeita.")) return;
    setScriptSaving(true);
    try {
      const res = await fetch(`/channels/scripts/${selectedScript.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const remaining = customScripts.filter(s => s.id !== selectedScript.id);
        setCustomScripts(remaining);
        if (remaining.length > 0) {
          handleSelectScript(remaining[0]);
        } else {
          setSelectedScript(null);
          setScriptName('');
          setScriptCode('');
          setScriptIsActive(true);
          setTestOutput(null);
          setTestLogs([]);
        }
        alert("Código excluído com sucesso!");
      }
    } catch (e) {
      console.error("Failed to delete script:", e);
      alert("Erro de conexão ao excluir código.");
    } finally {
      setScriptSaving(false);
    }
  };

  const handleExecuteScript = async () => {
    if (!selectedScript || !token) return;
    setScriptExecuting(true);
    setTestOutput(null);
    setTestLogs(["[INFO] Iniciando sandbox de execução do Node VM...", "[INFO] Conectando ao sandbox servidor..."]);
    
    let parsedInput = {};
    try {
      parsedInput = JSON.parse(testInput);
    } catch (err) {
      setTestLogs(prev => [...prev, `[ERRO] Falha ao analisar Payload JSON de Entrada: ${err.message}`, "[ERRO] Abortando execução."]);
      setScriptExecuting(false);
      return;
    }

    try {
      // Automatically save the editor changes first so execution runs the latest code body
      const saveRes = await fetch(`/channels/scripts/${selectedScript.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: scriptName,
          code: scriptCode,
          isActive: scriptIsActive
        })
      });
      const saveData = await saveRes.json();
      if (!saveData.success) {
        setTestLogs(prev => [...prev, `[ERRO] Falha ao persistir código antes de executar: ${saveData.error}`]);
        setScriptExecuting(false);
        return;
      }
      
      const updatedScript = saveData.script;
      setCustomScripts(customScripts.map(s => s.id === updatedScript.id ? updatedScript : s));
      setSelectedScript(updatedScript);

      const res = await fetch(`/channels/scripts/${selectedScript.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ input: parsedInput })
      });
      const data = await res.json();
      if (data.success) {
        setTestOutput(data.result);
        setTestLogs(prev => [...prev, ...data.logs, `[SUCESSO] Código finalizado com sucesso.`]);
      } else {
        setTestOutput({ error: data.error });
        setTestLogs(prev => [...prev, ...data.logs, `[FALHA] Execução falhou: ${data.error}`]);
      }
    } catch (e) {
      console.error("Failed to execute script:", e);
      setTestLogs(prev => [...prev, `[ERRO] Falha de rede/conexão na execução sandbox: ${e.message}`]);
    } finally {
      setScriptExecuting(false);
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

  const fetchSubscribersList = async () => {
    if (!token) return;
    setSubscribersLoading(true);
    try {
      const res = await fetch('/inbox/admin/subscribers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.subscribers);
      } else {
        console.error("Failed to load subscribers:", data.error);
      }
    } catch (e) {
      console.error("Failed to load subscribers list:", e);
    } finally {
      setSubscribersLoading(false);
    }
  };

  const handleUpdateSubscriberLimits = async (e) => {
    e.preventDefault();
    if (!editingSubscriber) return;

    try {
      const res = await fetch(`/inbox/admin/subscribers/${editingSubscriber.id}/limits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: newPlan,
          maxBots: parseInt(newMaxBots),
          maxMessagesPerMonth: parseInt(newMaxMessages)
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Limites do assinante atualizados com sucesso!");
        setIsEditLimitsOpen(false);
        setEditingSubscriber(null);
        fetchSubscribersList();
      } else {
        alert(data.error || "Erro ao atualizar limites.");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão ao salvar novos limites.");
    }
  };

  const handleDeleteSubscriber = async (subscriberId, subscriberName) => {
    if (!confirm(`Tem certeza absoluta que deseja excluir o assinante "${subscriberName}"? Esta ação é irreversível e excluirá todos os bots, operadores, contatos e conversas associados.`)) return;

    try {
      const res = await fetch(`/inbox/admin/subscribers/${subscriberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        alert("Assinante excluído com sucesso!");
        fetchSubscribersList();
      } else {
        alert(data.error || "Erro ao excluir assinante.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao tentar excluir assinante.");
    }
  };

  const handleImpersonate = async (targetOrgId) => {
    try {
      const res = await fetch('/inbox/auth/switch-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetOrganizationId: targetOrgId })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        // Reset active view to Conversas to load impersonated context cleanly
        setActiveTab('CONVERSAS');
        // Fetch new profile immediately to update user state
        fetchProfile(data.token);
        alert("Sessão alterada com sucesso! Você agora está operando como " + data.organization.name);
      } else {
        alert("Falha ao impersonar organização: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao tentar acessar a dashboard do cliente.");
    }
  };

  const handleReturnToMaster = async () => {
    if (!user?.originalOrganizationId) {
      alert("Nenhuma sessão original de Super Admin encontrada.");
      return;
    }
    try {
      const res = await fetch('/inbox/auth/switch-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetOrganizationId: user.originalOrganizationId })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setActiveTab('MASTER');
        fetchProfile(data.token);
        fetchSubscribersList();
        alert("Você retornou ao Painel Master Admin.");
      } else {
        alert("Erro ao retornar ao painel master: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao retornar ao painel master.");
    }
  };

  const handleSystemReset = async () => {
    if (!confirm("🚨 ATENÇÃO: Esta ação irá apagar TODOS os usuários e organizações cadastrados no sistema (exceto a sua sessão ativa no momento da limpeza)! Você e os demais clientes precisarão se cadastrar do zero. Deseja continuar?")) return;
    if (!confirm("🚨 SEGUNDA CONFIRMAÇÃO: Você tem certeza ABSOLUTA disso? Essa operação é destrutiva e apagará todo o banco de dados do ChatFlow.")) return;

    try {
      const res = await fetch('/inbox/admin/system-reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        alert("🎉 Limpeza concluída! Todos os usuários e dados do sistema foram excluídos com sucesso. Você será deslogado agora.");
        handleLogout();
      } else {
        alert(data.error || "Erro ao tentar realizar a limpeza do sistema.");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão ao redefinir banco de dados.");
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

  useEffect(() => {
    if (activeTab === 'HUB' && selectedBot && token) {
      fetchChannelIntegrations(selectedBot.id);
    }
  }, [activeTab, selectedBot, token]);

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
    fetchChannelIntegrations(bot.id);
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

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaignName.trim() || !newCampaignContent.trim()) {
      alert("Nome e mensagem são obrigatórios.");
      return;
    }

    setCampaignCreationLoading(true);
    try {
      const scheduledFor = newCampaignScheduleEnabled && newCampaignScheduledFor 
        ? new Date(newCampaignScheduledFor).toISOString() 
        : null;

      const res = await fetch('/inbox/broadcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCampaignName,
          label: newCampaignTargetType === 'LABEL' ? newCampaignLabel : null,
          contactListId: newCampaignTargetType === 'LIST' ? newCampaignListId : null,
          content: newCampaignContent,
          scheduledFor
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Disparo criado com sucesso!");
        setNewCampaignName('');
        setNewCampaignContent('');
        setNewCampaignScheduleEnabled(false);
        setNewCampaignScheduledFor('');
        setIsCreateCampaignOpen(false);
        fetchCampaigns();
      } else {
        alert("Falha: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao criar campanha de disparos.");
    } finally {
      setCampaignCreationLoading(false);
    }
  };

  const handleStopCampaign = async (campaignId) => {
    if (!confirm("Deseja realmente parar este disparo?")) return;
    try {
      const res = await fetch(`/inbox/broadcasts/${campaignId}/stop`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchCampaigns();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetryFailedCampaign = async (campaignId) => {
    if (!confirm("Deseja reenviar os disparos que falharam nesta campanha?")) return;
    try {
      const res = await fetch(`/inbox/broadcasts/${campaignId}/retry`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert(`Disparos reenviados para ${data.retriedCount} contatos!`);
        fetchCampaigns();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewCampaignLogs = async (campaignId) => {
    setCampaignLogsLoading(true);
    try {
      const res = await fetch(`/inbox/broadcasts/${campaignId}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCampaignLogs(data.logs);
        setActiveLogCampaignId(campaignId);
        setIsLogsModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCampaignLogsLoading(false);
    }
  };

  const handleCreateContactList = async (e) => {
    e.preventDefault();
    if (!newListName.trim() || newListContactIds.length === 0) {
      alert("Nome e seleção de contatos são obrigatórios.");
      return;
    }

    setListCreationLoading(true);
    try {
      const res = await fetch('/inbox/contact-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newListName,
          contactIds: newListContactIds
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Lista de contatos criada com sucesso!");
        setNewListName('');
        setNewListContactIds([]);
        setIsManageListsOpen(false);
        fetchContactLists();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setListCreationLoading(false);
    }
  };

  const handleDeleteContactList = async (listId) => {
    if (!confirm("Deseja realmente excluir esta lista de contatos?")) return;
    try {
      const res = await fetch(`/inbox/contact-lists/${listId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchContactLists();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        localStorage.setItem('chatflow_org_logo', dataUrl);
        setOrgLogo(dataUrl);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleLikePost = (postId) => {
    setHubPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
          liked: !post.liked
        };
      }
      return post;
    }));
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert("Preencha o título e o conteúdo da publicação!");
      return;
    }
    const newPost = {
      id: Date.now(),
      author: `${user?.firstName || 'Operador'} ${user?.lastName || 'ChatFlow'}`,
      authorRole: "Merchant Admin",
      authorAvatar: orgLogo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      time: "Agora mesmo",
      badge: newPostCategory,
      title: newPostTitle,
      content: newPostContent,
      likes: 0,
      liked: false,
      comments: 0,
      imageUrl: null
    };
    setHubPosts([newPost, ...hubPosts]);
    setNewPostTitle('');
    setNewPostContent('');
    alert("Publicação enviada com sucesso!");
  };

  const fetchChannelIntegrations = async (botId) => {
    if (!botId || !token) return;
    try {
      const res = await fetch(`/channels/bots/${botId}/integrations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.integrations) {
        const waba = data.integrations.find(c => c.type === 'WHATSAPP');
        if (waba && waba.credentials) {
          setWabaAccessToken(waba.credentials.accessToken || '');
          setWabaPhoneNumberId(waba.credentials.phoneNumberId || '');
          setWabaBusinessId(waba.credentials.businessAccountId || '');
        } else {
          setWabaAccessToken('');
          setWabaPhoneNumberId('');
          setWabaBusinessId('');
        }

        const ig = data.integrations.find(c => c.type === 'INSTAGRAM');
        if (ig && ig.credentials) {
          setIgAccessToken(ig.credentials.accessToken || '');
          setIgPageId(ig.credentials.pageId || '');
        } else {
          setIgAccessToken('');
          setIgPageId('');
        }

        const fb = data.integrations.find(c => c.type === 'MESSENGER');
        if (fb && fb.credentials) {
          setFbAccessToken(fb.credentials.accessToken || '');
          setFbPageId(fb.credentials.pageId || '');
        } else {
          setFbAccessToken('');
          setFbPageId('');
        }
      }
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
    }
  };

  const handleSaveWabaCredentials = async () => {
    if (!wabaAccessToken.trim() || !wabaPhoneNumberId.trim()) {
      alert('Preencha o Access Token e o Phone Number ID.');
      return;
    }
    if (!selectedBot && bots.length === 0) {
      alert('Crie um Agente AI antes de configurar a integração WhatsApp.');
      return;
    }
    const botId = selectedBot?.id || bots[0]?.id;
    setSavingWaba(true);
    try {
      const res = await fetch(`/channels/bots/${botId}/integrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'WHATSAPP',
          credentials: {
            accessToken: wabaAccessToken,
            phoneNumberId: wabaPhoneNumberId,
            businessAccountId: wabaBusinessId
          },
          isActive: true
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Credenciais do WhatsApp Business salvas com sucesso!');
        fetchChannelIntegrations(botId);
      } else {
        alert(data.error || 'Erro ao salvar credenciais.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha de conexão ao salvar credenciais.');
    } finally {
      setSavingWaba(false);
    }
  };

  const handleSaveIgCredentials = async () => {
    if (!igAccessToken.trim() || !igPageId.trim()) {
      alert('Preencha o Access Token e o Page ID do Instagram.');
      return;
    }
    if (!selectedBot && bots.length === 0) {
      alert('Crie um Agente AI antes de configurar a integração Instagram.');
      return;
    }
    const botId = selectedBot?.id || bots[0]?.id;
    setSavingIg(true);
    try {
      const res = await fetch(`/channels/bots/${botId}/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          type: 'INSTAGRAM',
          credentials: { accessToken: igAccessToken, pageId: igPageId },
          isActive: true
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Credenciais do Instagram salvas com sucesso!');
        fetchChannelIntegrations(botId);
      } else { alert(data.error || 'Erro ao salvar credenciais.'); }
    } catch (err) { console.error(err); alert('Falha de conexão.'); }
    finally { setSavingIg(false); }
  };

  const handleSaveFbCredentials = async () => {
    if (!fbAccessToken.trim() || !fbPageId.trim()) {
      alert('Preencha o Access Token e o Page ID do Facebook.');
      return;
    }
    if (!selectedBot && bots.length === 0) {
      alert('Crie um Agente AI antes de configurar a integração Facebook.');
      return;
    }
    const botId = selectedBot?.id || bots[0]?.id;
    setSavingFb(true);
    try {
      const res = await fetch(`/channels/bots/${botId}/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          type: 'MESSENGER',
          credentials: { accessToken: fbAccessToken, pageId: fbPageId },
          isActive: true
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Credenciais do Facebook Messenger salvas com sucesso!');
        fetchChannelIntegrations(botId);
      } else { alert(data.error || 'Erro ao salvar credenciais.'); }
    } catch (err) { console.error(err); alert('Falha de conexão.'); }
    finally { setSavingFb(false); }
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
              {isForgotPassword
                ? "Recupere o seu acesso ao painel ChatFlow."
                : isRegister 
                  ? "Registre uma nova organização para construir robôs omnichannel de IA."
                  : "Entre com suas credenciais para gerenciar conversas, CRM e checkout."}
            </p>
          </div>

          {authError && (
            <div className="glass" style={{ background: 'hsl(var(--danger) / 0.15)', borderColor: 'hsl(var(--danger) / 0.3)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: 'hsl(var(--danger))' }}>
              {authError}
            </div>
          )}

          {authSuccess && (
            <div className="glass" style={{ background: 'hsl(var(--success) / 0.15)', borderColor: 'hsl(var(--success) / 0.3)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: 'hsl(var(--success))' }}>
              {authSuccess}
            </div>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

              <button type="submit" disabled={authLoading} className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '6px', fontSize: '14px', fontWeight: '700' }}>
                {authLoading ? "Solicitando..." : "Solicitar Nova Senha"}
              </button>

              <button type="button" onClick={() => { setIsForgotPassword(false); setAuthError(''); setAuthSuccess(''); }} className="btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '600' }}>
                Voltar para o Login
              </button>
            </form>
          ) : (
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: '600', margin: 0 }}>Senha</label>
                  {!isRegister && (
                    <button 
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setAuthError(''); setAuthSuccess(''); }}
                      style={{ background: 'transparent', border: 'none', color: 'hsl(var(--secondary))', fontSize: '11px', cursor: 'pointer', padding: 0, fontWeight: '600' }}
                    >
                      Esqueceu sua senha?
                    </button>
                  )}
                </div>
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
          )}

          <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border))', margin: '10px 0 0 0' }} />

          <div style={{ textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
            {isForgotPassword ? (
              <span>Lembrou de sua senha? <button onClick={() => { setIsForgotPassword(false); setAuthError(''); setAuthSuccess(''); }} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--secondary))', cursor: 'pointer', padding: 0, fontWeight: '600' }}>Faça login aqui</button></span>
            ) : isRegister ? (
              <span>Já possui uma conta? <button onClick={() => { setIsRegister(false); setAuthError(''); setAuthSuccess(''); }} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--secondary))', cursor: 'pointer', padding: 0, fontWeight: '600' }}>Faça login aqui</button></span>
            ) : (
              <span>Novo no ChatFlow? <button onClick={() => { setIsRegister(true); setAuthError(''); setAuthSuccess(''); }} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--secondary))', cursor: 'pointer', padding: 0, fontWeight: '600' }}>Registrar organização</button></span>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      
      {/* SIDEBAR NAVIGATION: PORTUGUESE */}
      {isMobile && (
        <div 
          className={`sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`} 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ width: '250px' }}>
        
        <div className="sidebar-logo" style={{ paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/icon.png" alt="ChatFlow Logo" style={{ height: '24px', width: 'auto', borderRadius: '4px' }} />
          <span style={{ fontSize: '22px', letterSpacing: '-0.04em', fontWeight: 800, textTransform: 'lowercase', color: '#fff' }}>chatflow</span>
        </div>

        <div className="sidebar-nav" style={{ marginTop: '10px', gap: '4px' }}>
          <div onClick={() => { setActiveTab('CONVERSAS'); fetchConversations(); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'CONVERSAS' ? 'active' : ''}`}>
            <MessageSquare size={17} />
            <span>Conversas</span>
            {conversations.filter(c => c.status === 'OPEN').length > 0 && (
              <span className="badge badge-whatsapp" style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', borderRadius: '8px' }}>
                {conversations.filter(c => c.status === 'OPEN').length}
              </span>
            )}
          </div>

          <div onClick={() => { setActiveTab('CRM'); fetch('/inbox/crm/pipeline', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => { const ct = r.headers.get('content-type'); if (ct && ct.includes('application/json')) return r.json(); console.error('[CRM Nav] Non-JSON:', r.status); return { success: false }; }).then(d => { if (d.success) setCrmPipeline(d.pipeline); }).catch(e => console.error('[CRM Nav]', e)); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'CRM' ? 'active' : ''}`}>
            <Layers size={17} />
            <span>Fluxo CRM</span>
          </div>

          <div onClick={() => { setActiveTab('CONTATOS'); fetchConversations(); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'CONTATOS' ? 'active' : ''}`}>
            <User size={17} />
            <span>Contatos</span>
          </div>

          <div onClick={() => { setActiveTab('AGENTES'); fetchBotsList(); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'AGENTES' ? 'active' : ''}`}>
            <Cpu size={17} />
            <span>Agentes AI</span>
          </div>

          <div onClick={() => { setActiveTab('OPERADORES'); fetchAgentsList(); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'OPERADORES' ? 'active' : ''}`}>
            <UserCheck size={17} />
            <span>Operadores</span>
          </div>

          <div onClick={() => { setActiveTab('CONHECIMENTO'); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'CONHECIMENTO' ? 'active' : ''}`}>
            <Database size={17} />
            <span>Bases de conhecimento</span>
          </div>

          <div onClick={() => { setActiveTab('ARTEFATOS'); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'ARTEFATOS' ? 'active' : ''}`}>
            <FileText size={17} />
            <span>Artefatos</span>
          </div>

          <div onClick={() => { setActiveTab('DISPAROS'); fetchConversations(); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'DISPAROS' ? 'active' : ''}`}>
            <Megaphone size={17} />
            <span>Disparos</span>
          </div>

          <div onClick={() => { setActiveTab('NOVIAPI'); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'NOVIAPI' ? 'active' : ''}`}>
            <FileCode size={17} />
            <span>NoviAPI</span>
            <span className="badge" style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #006aff, hsl(var(--secondary)))', color: '#fff', fontSize: '8px', padding: '2px 5px' }}>BETA</span>
          </div>

          <div onClick={() => { setActiveTab('METRICAS'); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'METRICAS' ? 'active' : ''}`}>
            <BarChart3 size={17} />
            <span>Métricas</span>
          </div>

          <div onClick={() => { setActiveTab('HUB'); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'HUB' ? 'active' : ''}`}>
            <Globe size={17} />
            <span>Hub</span>
          </div>

          <div onClick={() => { setActiveTab('CONFIGURACOES'); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'CONFIGURACOES' ? 'active' : ''}`}>
            <Settings size={17} />
            <span>Configurações</span>
          </div>

          <div onClick={() => { setActiveTab('DOCS'); if (isMobile) setIsSidebarOpen(false); }} className={`nav-item ${activeTab === 'DOCS' ? 'active' : ''}`}>
            <HelpCircle size={17} />
            <span>Documentação</span>
          </div>

          {(user?.role === 'SUPERADMIN' || user?.role === 'SUPER_ADMIN') && !user?.isImpersonated && (
            <div 
              onClick={() => { setActiveTab('MASTER'); fetchSubscribersList(); if (isMobile) setIsSidebarOpen(false); }} 
              className={`nav-item ${activeTab === 'MASTER' ? 'active' : ''}`} 
              style={{ 
                borderLeft: '3px solid hsl(var(--primary))', 
                background: activeTab === 'MASTER' ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--primary) / 0.03)', 
                color: '#fff', 
                marginTop: '10px',
                fontWeight: '700'
              }}
            >
              <ShieldAlert size={17} style={{ color: 'hsl(var(--primary))' }} />
              <span>Painel Master</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid hsl(var(--border))', paddingTop: '14px' }}>
          {organization?.name && organization.name !== `${user.firstName} ${user.lastName}` && (
            <div style={{ padding: '0 8px' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#fff' }}>{organization.name}</div>
            </div>
          )}
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
        
        {/* Impersonation Global Warning Header */}
        {user?.isImpersonated && (
          <div style={{
            background: 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)',
            color: '#fff',
            padding: '10px 24px',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
            borderBottom: '1px solid #b91c1c',
            zIndex: 9999,
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} />
              <span>
                <strong>🕵️ Modo Impressão:</strong> Você está visualizando a conta de <strong>{organization?.name || 'Cliente'}</strong>
              </span>
            </div>
            <button 
              onClick={handleReturnToMaster}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Voltar ao Painel Master
            </button>
          </div>
        )}

        {/* TOP NAV BAR */}
        <div className="main-header" style={{ height: '65px', padding: isMobile ? '0 12px' : '0 25px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500' }}>
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '4px',
                  marginRight: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Menu size={20} />
              </button>
            )}
            {activeTab === 'HUB' ? (
              <>
                <span 
                  onClick={() => setActiveHubCategory('inicio')}
                  style={{ color: 'hsl(var(--text-muted))', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.target.style.color = '#fff'}
                  onMouseLeave={(e) => e.target.style.color = 'hsl(var(--text-muted))'}
                >
                  Hub
                </span>
                <ChevronRight size={12} style={{ color: 'hsl(var(--border))' }} />
                <span style={{ color: '#fff', fontWeight: '600' }}>
                  {activeHubCategory === 'inicio' && "Início"}
                  {activeHubCategory === 'geral' && "Geral"}
                  {activeHubCategory === 'comunicados' && "Comunicados"}
                  {activeHubCategory === 'meta' && "Integração Meta"}
                  {activeHubCategory === 'prompts' && "Compartilhar Prompts"}
                  {activeHubCategory === 'faq' && "Suporte & FAQ"}
                </span>
              </>
            ) : (
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
                {activeTab === 'DOCS' && "Documentação"}
                {activeTab === 'CONFIGURACOES' && "Configurações"}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '18px' }}>
            
            {organization && (
              <div className="org-badge" style={{ fontSize: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid hsl(var(--border))', padding: '4px 8px', height: '28px' }}>
                <Database size={12} style={{ color: 'hsl(var(--secondary))' }} />
                <span>{isMobile ? `Créditos: ${organization.apiUsageThisMonth}` : `Créditos: ${organization.apiUsageThisMonth} / ${organization.maxMessagesPerMonth}`}</span>
              </div>
            )}

            {!isMobile && (
              <div style={{ position: 'relative', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>
                <Bell size={18} />
                <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(var(--primary))' }}></div>
              </div>
            )}

            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '4px 8px', borderRadius: '4px', border: '1px solid hsl(var(--border))' }}>
                <span>🇧🇷</span>
                <span style={{ color: 'hsl(var(--text-muted))' }}>PT-BR</span>
              </div>
            )}

            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(var(--border) / 0.4)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid hsl(var(--border))' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#25d366' }}></span>
                <span>Online</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px' }}>
              {!isMobile && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{user.firstName}</span>
                  <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{user.email}</span>
                </div>
              )}
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '700', fontSize: '12px', boxShadow: '0 0 10px hsl(var(--primary-glow))' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Pipeline de Vendas</h3>
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '2px' }}>
                    Gerencie seus leads através do funil de vendas. Altere etapas, valores e acompanhe o progresso.
                  </p>
                </div>
                <button onClick={async () => {
                  try {
                    setIsCrmRefreshing(true);
                    const res = await fetch('/inbox/crm/pipeline', { headers: { 'Authorization': `Bearer ${token}` } });
                    const contentType = res.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                      const text = await res.text();
                      console.error('[CRM] Non-JSON response:', res.status, text.substring(0, 200));
                      alert(`Erro: O servidor retornou HTML em vez de JSON (status ${res.status}). Verifique os logs do Railway.`);
                      return;
                    }
                    const data = await res.json();
                    if (data.success) {
                      setCrmPipeline(data.pipeline);
                      // Also sync conversations to update contact records on other screens
                      const convRes = await fetch('/inbox/conversations', { headers: { 'Authorization': `Bearer ${token}` } });
                      const convData = await convRes.json();
                      if (convData.success) {
                        setConversations(convData.conversations);
                      }
                    } else {
                      alert(`Erro CRM: ${data.error}`);
                    }
                  } catch (e) { 
                    console.error('[CRM Error]', e); 
                    alert('Erro de rede ao atualizar pipeline.'); 
                  } finally {
                    setIsCrmRefreshing(false);
                  }
                }} className="btn-primary" style={{ padding: '8px', minWidth: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                  <span className={isCrmRefreshing ? 'spin' : ''} style={{ display: 'inline-block' }}>↻</span>
                </button>
              </div>

              {/* Mobile Stage Selector Tabs */}
              {isMobile && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                  {(crmPipeline.length > 0 ? crmPipeline : [
                    { key: 'NOVO', name: 'Novo Lead', color: '#8a2be2', count: 0 },
                    { key: 'QUALIFICADO', name: 'Qualificado', color: '#006aff', count: 0 },
                    { key: 'NEGOCIACAO', name: 'Negociação', color: '#f9d423', count: 0 },
                    { key: 'PROPOSTA', name: 'Proposta', color: '#ff6b35', count: 0 },
                    { key: 'FECHADO_WON', name: 'Fechado (Won)', color: '#00c853', count: 0 },
                    { key: 'FECHADO_LOST', name: 'Perdido (Lost)', color: '#ff1744', count: 0 }
                  ]).map(col => {
                    const isActive = activeCrmStage === col.key;
                    return (
                      <button
                        key={col.key}
                        onClick={() => setActiveCrmStage(col.key)}
                        style={{
                          background: isActive ? col.color : 'hsl(var(--border) / 0.3)',
                          border: `1px solid ${isActive ? col.color : 'hsl(var(--border))'}`,
                          color: isActive ? '#000' : '#fff',
                          borderRadius: '20px',
                          padding: '6px 14px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#000' : col.color }} />
                        {col.name} ({col.count || 0})
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', gap: '14px', flex: 1, overflowX: isMobile ? 'hidden' : 'auto', alignItems: 'start', paddingBottom: '20px', flexDirection: isMobile ? 'column' : 'row' }}>
                {(crmPipeline.length > 0 ? crmPipeline : [
                  { key: 'NOVO', name: 'Novo Lead', color: '#8a2be2', contacts: [], count: 0, totalValue: 0 },
                  { key: 'QUALIFICADO', name: 'Qualificado', color: '#006aff', contacts: [], count: 0, totalValue: 0 },
                  { key: 'NEGOCIACAO', name: 'Negociação', color: '#f9d423', contacts: [], count: 0, totalValue: 0 },
                  { key: 'PROPOSTA', name: 'Proposta', color: '#ff6b35', contacts: [], count: 0, totalValue: 0 },
                  { key: 'FECHADO_WON', name: 'Fechado (Won)', color: '#00c853', contacts: [], count: 0, totalValue: 0 },
                  { key: 'FECHADO_LOST', name: 'Perdido (Lost)', color: '#ff1744', contacts: [], count: 0, totalValue: 0 }
                ])
                .filter(col => !isMobile || col.key === activeCrmStage)
                .map(col => (
                  <div className="glass" key={col.key} style={{
                    flex: isMobile ? '1 1 100%' : '0 0 250px',
                    width: isMobile ? '100%' : '250px',
                    background: 'rgba(255,255,255,0.01)',
                    border: `1px solid ${col.color}30`,
                    padding: '14px',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxHeight: '100%'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: col.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                        {col.name}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className="org-badge" style={{ padding: '2px 6px', fontSize: '10px' }}>{col.count}</span>
                      </div>
                    </div>
                    {col.totalValue > 0 && (
                      <div style={{ fontSize: '11px', color: col.color, fontWeight: '700', marginTop: '-6px' }}>
                        R$ {col.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px', minHeight: '80px' }}>
                      {col.contacts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '16px 5px', color: 'hsl(var(--text-muted))', fontSize: '11px', border: '1px dashed hsl(var(--border) / 0.5)', borderRadius: '6px' }}>
                          Sem leads nesta etapa.
                        </div>
                      ) : (
                        col.contacts.map(contact => {
                          const isOverdue = contact.nextFollowUp && new Date(contact.nextFollowUp) < new Date();
                          const channelColors = { WHATSAPP: '#25d366', INSTAGRAM: '#E1306C', MESSENGER: '#1877F2', WIDGET: '#8a2be2' };
                          return (
                            <div key={contact.id} className="glowing-card" style={{
                              padding: '12px',
                              background: 'hsl(var(--bg-card))',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              borderLeft: `3px solid ${col.color}`
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{contact.name}</span>
                                <span style={{
                                  fontSize: '9px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: `${channelColors[contact.platformType] || '#999'}20`,
                                  color: channelColors[contact.platformType] || '#999',
                                  fontWeight: '600'
                                }}>{contact.platformType}</span>
                              </div>

                              {contact.leadValue > 0 && (
                                <div style={{ fontSize: '13px', fontWeight: '700', color: 'hsl(var(--secondary))' }}>
                                  R$ {contact.leadValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              )}

                              {contact.tags && contact.tags.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {contact.tags.map((tag, i) => (
                                    <span key={i} style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '10px', background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontWeight: '600' }}>{tag}</span>
                                  ))}
                                </div>
                              )}

                              {contact.nextFollowUp && (
                                <div style={{ fontSize: '10px', color: isOverdue ? '#ff1744' : '#f9d423', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  ⏰ {isOverdue ? 'Atrasado: ' : 'Follow-up: '}
                                  {new Date(contact.nextFollowUp).toLocaleDateString('pt-BR')}
                                </div>
                              )}

                              {/* Stage Change Dropdown */}
                              <select
                                value={col.key}
                                onChange={async (e) => {
                                  const newStage = e.target.value;
                                  try {
                                    await fetch(`/inbox/crm/contacts/${contact.id}/stage`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                      body: JSON.stringify({ stage: newStage })
                                    });
                                    // Refresh pipeline
                                    const res = await fetch('/inbox/crm/pipeline', { headers: { 'Authorization': `Bearer ${token}` } });
                                    const ct = res.headers.get('content-type');
                                    if (ct && ct.includes('application/json')) {
                                      const data = await res.json();
                                      if (data.success) setCrmPipeline(data.pipeline);
                                    }
                                  } catch (err) { console.error('[CRM Stage]', err); }
                                }}
                                style={{
                                  fontSize: '10px',
                                  padding: '3px 6px',
                                  background: 'hsl(var(--border) / 0.3)',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="NOVO">→ Novo Lead</option>
                                <option value="QUALIFICADO">→ Qualificado</option>
                                <option value="NEGOCIACAO">→ Negociação</option>
                                <option value="PROPOSTA">→ Proposta</option>
                                <option value="FECHADO_WON">→ Fechado (Won)</option>
                                <option value="FECHADO_LOST">→ Perdido (Lost)</option>
                              </select>

                              <div style={{ fontSize: '9px', color: 'hsl(var(--text-muted))' }}>
                                {new Date(contact.updatedAt).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
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
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
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
            </div>
          )}

          {/* TAB 4: AGENTES AI BUILDER */}
          {activeTab === 'AGENTES' && (
            <AiAgentsView
              bots={bots}
              selectedBot={selectedBot}
              handleSelectBot={handleSelectBot}
              handleCreateBot={handleCreateBot}
              newBotName={newBotName}
              setNewBotName={setNewBotName}
              botSettingsTab={botSettingsTab}
              setBotSettingsTab={setBotSettingsTab}
              handleUpdateBotSettings={handleUpdateBotSettings}
              handleDeleteBot={handleDeleteBot}
              agentName={agentName}
              setAgentName={setAgentName}
              agentDescription={agentDescription}
              setAgentDescription={setAgentDescription}
              agentGreeting={agentGreeting}
              setAgentGreeting={setAgentGreeting}
              agentPrompt={agentPrompt}
              setAgentPrompt={setAgentPrompt}
              agentModel={agentModel}
              setAgentModel={setAgentModel}
              agentTemperature={agentTemperature}
              setAgentTemperature={setAgentTemperature}
              isBotSaving={isBotSaving}
              toolKnowledgeBase={toolKnowledgeBase}
              setToolKnowledgeBase={setToolKnowledgeBase}
              toolHumanHandover={toolHumanHandover}
              setToolHumanHandover={setToolHumanHandover}
              toolMockErp={toolMockErp}
              setToolMockErp={setToolMockErp}
              outboundWebhook={outboundWebhook}
              setOutboundWebhook={setOutboundWebhook}
              outboundHeader={outboundHeader}
              setOutboundHeader={setOutboundHeader}
            />
          )}

          {/* TAB 4.5: OPERADORES */}
          {activeTab === 'OPERADORES' && (
            <OperatorsView
              isMobile={isMobile}
              agents={agents}
              handleCreateAgent={handleCreateAgent}
              newAgentFirstName={newAgentFirstName}
              setNewAgentFirstName={setNewAgentFirstName}
              newAgentLastName={newAgentLastName}
              setNewAgentLastName={setNewAgentLastName}
              newAgentEmail={newAgentEmail}
              setNewAgentEmail={setNewAgentEmail}
              newAgentPassword={newAgentPassword}
              setNewAgentPassword={setNewAgentPassword}
              newAgentRole={newAgentRole}
              setNewAgentRole={setNewAgentRole}
              agentLoading={agentLoading}
            />
          )}

          {/* TAB 5: BASES DE CONHECIMENTO */}
          {activeTab === 'CONHECIMENTO' && (
            <KnowledgeBaseView
              knowledgeSource={knowledgeSource}
              setKnowledgeSource={setKnowledgeSource}
              knowledgeText={knowledgeText}
              setKnowledgeText={setKnowledgeText}
              uploadingKnowledge={uploadingKnowledge}
              handleUploadKnowledge={handleUploadKnowledge}
            />
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

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: isMobile ? '16px' : '25px', alignItems: 'start' }}>
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
            <DisparosView
              campaigns={campaigns}
              contactLists={contactLists}
              activeBroadcastTab={activeBroadcastTab}
              setActiveBroadcastTab={setActiveBroadcastTab}
              handleStopCampaign={handleStopCampaign}
              handleRetryFailedCampaign={handleRetryFailedCampaign}
              handleViewCampaignLogs={handleViewCampaignLogs}
              handleDeleteContactList={handleDeleteContactList}
              isCreateCampaignOpen={isCreateCampaignOpen}
              setIsCreateCampaignOpen={setIsCreateCampaignOpen}
              isManageListsOpen={isManageListsOpen}
              setIsManageListsOpen={setIsManageListsOpen}
              isLogsModalOpen={isLogsModalOpen}
              setIsLogsModalOpen={setIsLogsModalOpen}
              selectedCampaignLogs={selectedCampaignLogs}
              newCampaignName={newCampaignName}
              setNewCampaignName={setNewCampaignName}
              newCampaignTargetType={newCampaignTargetType}
              setNewCampaignTargetType={setNewCampaignTargetType}
              newCampaignLabel={newCampaignLabel}
              setNewCampaignLabel={setNewCampaignLabel}
              newCampaignListId={newCampaignListId}
              setNewCampaignListId={setNewCampaignListId}
              newCampaignContent={newCampaignContent}
              setNewCampaignContent={setNewCampaignContent}
              newCampaignScheduleEnabled={newCampaignScheduleEnabled}
              setNewCampaignScheduleEnabled={setNewCampaignScheduleEnabled}
              newCampaignScheduledFor={newCampaignScheduledFor}
              setNewCampaignScheduledFor={setNewCampaignScheduledFor}
              campaignCreationLoading={campaignCreationLoading}
              handleCreateCampaign={handleCreateCampaign}
              newListName={newListName}
              setNewListName={setNewListName}
              newListContactIds={newListContactIds}
              setNewListContactIds={setNewListContactIds}
              listCreationLoading={listCreationLoading}
              handleCreateContactList={handleCreateContactList}
              conversations={conversations}
            />
          )}

          {/* TAB 8: NOVIAPI */}
          {activeTab === 'NOVIAPI' && (
            <NoviApiView
              isMobile={isMobile}
              customScripts={customScripts}
              selectedScript={selectedScript}
              handleSelectScript={handleSelectScript}
              handleCreateScript={handleCreateScript}
              scriptName={scriptName}
              setScriptName={setScriptName}
              scriptCode={scriptCode}
              setScriptCode={setScriptCode}
              scriptIsActive={scriptIsActive}
              setScriptIsActive={setScriptIsActive}
              scriptLoading={scriptLoading}
              scriptSaving={scriptSaving}
              scriptExecuting={scriptExecuting}
              handleSaveScript={handleSaveScript}
              handleDeleteScript={handleDeleteScript}
              handleExecuteScript={handleExecuteScript}
              testInput={testInput}
              setTestInput={setTestInput}
              testOutput={testOutput}
              testLogs={testLogs}
            />
          )}

          {/* TAB 9: METRICAS */}
          {activeTab === 'METRICAS' && (
            <div>
              <CrmDashboard token={token} />
              <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border))', margin: '10px 30px' }} />
              <EcommerceDashboard token={token} />
            </div>
          )}

          {/* TAB 10: HUB */}
          {activeTab === 'HUB' && (
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 'calc(100vh - 70px)', background: 'hsl(var(--bg-main))' }}>
              {/* Left sidebar */}
              <div className="glass" style={{ width: isMobile ? '100%' : '260px', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', borderRight: isMobile ? 'none' : '1px solid hsl(var(--border))', borderBottom: isMobile ? '1px solid hsl(var(--border))' : 'none', borderRadius: '0', background: 'hsl(var(--bg-card) / 0.4)' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={22} style={{ color: 'hsl(var(--primary))' }} /> ChatFlow Hub
                  </h3>
                  <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>Comunidade & Conexões</p>
                </div>

                {/* Categories */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Category Group 1 */}
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', fontWeight: '700', letterSpacing: '0.1em', paddingLeft: '12px' }}>Canais</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                      <div 
                        onClick={() => setActiveHubCategory('inicio')}
                        className={`nav-item ${activeHubCategory === 'inicio' ? 'active' : ''}`}
                      >
                        <Zap size={16} />
                        <span>Início</span>
                      </div>
                    </div>
                  </div>

                  {/* Category Group 2 */}
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', fontWeight: '700', letterSpacing: '0.1em', paddingLeft: '12px' }}>Público</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                      <div 
                        onClick={() => setActiveHubCategory('geral')}
                        className={`nav-item ${activeHubCategory === 'geral' ? 'active' : ''}`}
                      >
                        <MessageSquare size={16} />
                        <span>Geral</span>
                      </div>
                      <div 
                        onClick={() => setActiveHubCategory('comunicados')}
                        className={`nav-item ${activeHubCategory === 'comunicados' ? 'active' : ''}`}
                      >
                        <Megaphone size={16} />
                        <span>Comunicados</span>
                      </div>
                      <div 
                        onClick={() => setActiveHubCategory('meta')}
                        className={`nav-item ${activeHubCategory === 'meta' ? 'active' : ''}`}
                      >
                        <Phone size={16} />
                        <span>Integração Meta</span>
                      </div>
                      <div 
                        onClick={() => setActiveHubCategory('prompts')}
                        className={`nav-item ${activeHubCategory === 'prompts' ? 'active' : ''}`}
                      >
                        <Sparkles size={16} />
                        <span>Compartilhar Prompts</span>
                      </div>
                    </div>
                  </div>

                  {/* Category Group 3 */}
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', fontWeight: '700', letterSpacing: '0.1em', paddingLeft: '12px' }}>Ajuda</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                      <div 
                        onClick={() => setActiveHubCategory('faq')}
                        className={`nav-item ${activeHubCategory === 'faq' ? 'active' : ''}`}
                      >
                        <HelpCircle size={16} />
                        <span>Suporte & FAQ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right content area */}
              <div style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Right Header Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                  <div style={{ position: 'relative', width: '360px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
                    <input 
                      type="text" 
                      placeholder="Buscar na comunidade..."
                      value={hubSearchQuery}
                      onChange={(e) => setHubSearchQuery(e.target.value)}
                      style={{ width: '100%', background: 'hsl(var(--border) / 0.4)', border: '1px solid hsl(var(--border))', padding: '12px 14px 12px 42px', borderRadius: '24px', fontSize: '14px', color: '#fff', outline: 'none', transition: 'all 0.2s' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="badge" style={{ background: 'hsl(var(--primary-glow))', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.3)', padding: '6px 12px', fontSize: '12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={12} /> Operador Dev
                    </span>
                  </div>
                </div>

                {/* Sub-Views */}
                {activeHubCategory === 'meta' ? (
                  /* Meta Integration Setup and Forms */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px' }}>
                    <div>
                      <h2 style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#fff' }}>Central de Integração Meta</h2>
                      <p style={{ color: 'hsl(var(--text-muted))', fontSize: '14px', marginTop: '6px' }}>
                        Configure os webhooks oficiais e vincule suas contas do WhatsApp Business, Instagram e Facebook Messenger para um atendimento omnichannel.
                      </p>
                    </div>

                    <div className="glass glowing-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={20} style={{ color: 'hsl(var(--primary))' }} /> Meta Webhooks Configurações
                      </h4>

                      <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '12px', alignItems: 'center' }}>
                          <strong>Webhook Callback URL:</strong>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <code style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', border: '1px solid hsl(var(--border))', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                              https://chatflow-production-262f.up.railway.app/webhooks/meta
                            </code>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText("https://chatflow-production-262f.up.railway.app/webhooks/meta");
                                alert("Webhook URL copiada com sucesso!");
                              }}
                              className="btn-secondary" 
                              style={{ padding: '10px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Copy size={14} /> Copiar
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '12px', alignItems: 'center' }}>
                          <strong>Verify Token (Token de Verificação):</strong>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <code style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', border: '1px solid hsl(var(--border))', fontFamily: 'monospace' }}>
                              {verifyToken}
                            </code>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(verifyToken);
                                alert("Verify Token copiado!");
                              }}
                              className="btn-secondary" 
                              style={{ padding: '10px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Copy size={14} /> Copiar
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="glass" style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px dashed hsl(var(--border))', borderRadius: '8px' }}>
                        <h5 style={{ fontWeight: '700', marginBottom: '10px', fontSize: '13px', color: 'hsl(var(--primary))' }}>Passo a Passo de Integração WhatsApp:</h5>
                        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'hsl(var(--text-muted))', lineHeight: '1.5' }}>
                          <li>Acesse o portal <strong>Meta for Developers</strong> e crie um App Business.</li>
                          <li>Ative o produto <strong>WhatsApp</strong> e clique em Webhooks.</li>
                          <li>Insira a URL de Callback e o Verify Token fornecidos acima.</li>
                          <li>Siga as instruções para assinar o campo de evento <strong>messages</strong>!</li>
                          <li>Copie o <strong>Access Token permanente</strong> e o <strong>Phone Number ID</strong> e insira nos formulários abaixo.</li>
                        </ol>
                      </div>
                    </div>

                    {/* WABA Credentials Form */}
                    <div className="glass glowing-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={20} style={{ color: '#25d366' }} /> Credenciais WhatsApp Business API (WABA)
                      </h4>
                      <p style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', margin: 0 }}>
                        Insira as credenciais da API oficial do WhatsApp Business para ativar a integração de mensagens.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                            Access Token (Permanente)
                          </label>
                          <input
                            type="password"
                            placeholder="EAAxxxxxxx..."
                            value={wabaAccessToken}
                            onChange={(e) => setWabaAccessToken(e.target.value)}
                            style={{ width: '100%', background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '12px 14px', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', color: '#fff' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                              Phone Number ID
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: 109876543210987"
                              value={wabaPhoneNumberId}
                              onChange={(e) => setWabaPhoneNumberId(e.target.value)}
                              style={{ width: '100%', background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '12px 14px', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', color: '#fff' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                              Business Account ID (opcional)
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: 102345678901234"
                              value={wabaBusinessId}
                              onChange={(e) => setWabaBusinessId(e.target.value)}
                              style={{ width: '100%', background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '12px 14px', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', color: '#fff' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                          <button
                            onClick={handleSaveWabaCredentials}
                            disabled={savingWaba || !wabaAccessToken.trim() || !wabaPhoneNumberId.trim()}
                            className="btn-primary"
                            style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '800', borderRadius: '8px' }}
                          >
                            {savingWaba ? 'Salvando...' : 'Salvar Credenciais WhatsApp'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Instagram Credentials Form */}
                    <div className="glass glowing-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Instagram size={20} style={{ color: '#E1306C' }} /> Credenciais Instagram Business
                      </h4>
                      <p style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', margin: 0 }}>
                        Insira o Page Access Token da página Facebook vinculada à conta Instagram Business.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                            Page Access Token
                          </label>
                          <input 
                            type="password" 
                            placeholder="EAAxxxxxxx..." 
                            value={igAccessToken}
                            onChange={(e) => setIgAccessToken(e.target.value)}
                            style={{ width: '100%', background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '12px 14px', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', color: '#fff' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                            Instagram Page ID
                          </label>
                          <input 
                            type="text" 
                            placeholder="Ex: 17841400000000000" 
                            value={igPageId}
                            onChange={(e) => setIgPageId(e.target.value)}
                            style={{ width: '100%', background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '12px 14px', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', color: '#fff' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                          <button 
                            onClick={handleSaveIgCredentials}
                            disabled={savingIg || !igAccessToken.trim() || !igPageId.trim()}
                            className="btn-primary" 
                            style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '800', borderRadius: '8px' }}
                          >
                            {savingIg ? 'Salvando...' : 'Salvar Credenciais Instagram'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Facebook Messenger Credentials Form */}
                    <div className="glass glowing-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Facebook size={20} style={{ color: '#1877F2' }} /> Credenciais Facebook Messenger
                      </h4>
                      <p style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', margin: 0 }}>
                        Insira o Page Access Token da página do Facebook para receber e responder mensagens do Messenger.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                            Page Access Token
                          </label>
                          <input 
                            type="password" 
                            placeholder="EAAxxxxxxx..." 
                            value={fbAccessToken}
                            onChange={(e) => setFbAccessToken(e.target.value)}
                            style={{ width: '100%', background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '12px 14px', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', color: '#fff' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                            Facebook Page ID
                          </label>
                          <input 
                            type="text" 
                            placeholder="Ex: 102345678901234" 
                            value={fbPageId}
                            onChange={(e) => setFbPageId(e.target.value)}
                            style={{ width: '100%', background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '12px 14px', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', color: '#fff' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                          <button 
                            onClick={handleSaveFbCredentials}
                            disabled={savingFb || !fbAccessToken.trim() || !fbPageId.trim()}
                            className="btn-primary" 
                            style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '800', borderRadius: '8px' }}
                          >
                            {savingFb ? 'Salvando...' : 'Salvar Credenciais Facebook'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeHubCategory === 'faq' ? (
                  /* Styled Accordions Panel for Support & FAQ */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px' }}>
                    <div>
                      <h2 style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#fff' }}>Suporte & Perguntas Frequentes (FAQ)</h2>
                      <p style={{ color: 'hsl(var(--text-muted))', fontSize: '14px', marginTop: '6px' }}>
                        Dúvidas sobre o funcionamento do ChatFlow SaaS para varejo, canais de integração e automação.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {[
                        {
                          q: "Como configurar o disparo para carrinhos abandonados?",
                          a: "No menu \"Disparos\", crie uma campanha segmentando pelo Rótulo CRM \"Carrinho Abandonado / Pagamento Pendente\". Certifique-se de que sua API de e-commerce (como Shopify ou WooCommerce) está enviando os eventos de checkout para o ChatFlow."
                        },
                        {
                          q: "Posso usar o mesmo número de WhatsApp oficial em múltiplos atendentes?",
                          a: "Sim! Com a integração oficial da API do WhatsApp Business (WABA), múltiplos operadores/atendentes da sua loja de varejo podem responder de forma colaborativa no menu \"Conversas\", dividindo a carga de suporte e faturamento de forma inteligente."
                        },
                        {
                          q: "Qual a diferença entre a API Oficial e conexões baseadas em QR Code?",
                          a: "A API Oficial da Meta (WABA) garante estabilidade de 100%, sem quedas de conexão ou riscos de banimento, permitindo disparos ativos em lote para toda a sua base de clientes, além de habilitar o selo de verificação verde oficial para a sua marca de varejo."
                        },
                        {
                          q: "Como criar fluxos de resposta automática para dúvidas de frete e rastreamento?",
                          a: "Vá em \"Bases de Conhecimento\", insira o resumo da sua política de frete e utilize o NoviAPI (se necessário) para buscar o rastreamento em tempo real nos Correios ou na Jadlog através de requisições HTTPS e códigos JavaScript isolados."
                        }
                      ].map((item, index) => {
                        const isOpen = activeFaq === index;
                        return (
                          <div 
                            key={index}
                            className="glass"
                            style={{ 
                              borderRadius: '8px', 
                              overflow: 'hidden', 
                              border: isOpen ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                              boxShadow: isOpen ? '0 0 15px hsl(var(--primary-glow))' : 'none',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <div 
                              onClick={() => setActiveFaq(isOpen ? null : index)}
                              style={{ 
                                padding: '18px 24px', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                cursor: 'pointer', 
                                background: isOpen ? 'hsl(var(--bg-card-hover) / 0.5)' : 'transparent',
                                transition: 'all 0.2s'
                              }}
                            >
                              <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{item.q}</span>
                              <ChevronRight size={18} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'hsl(var(--primary))' }} />
                            </div>
                            <div 
                              style={{ 
                                maxHeight: isOpen ? '200px' : '0', 
                                overflow: 'hidden', 
                                transition: 'all 0.3s cubic-bezier(0,1,0.5,1)',
                                padding: isOpen ? '18px 24px' : '0 24px',
                                borderTop: isOpen ? '1px solid hsl(var(--border))' : 'none',
                                background: 'hsl(var(--bg-card) / 0.2)'
                              }}
                            >
                              <p style={{ fontSize: '13.5px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', margin: 0 }}>
                                {item.a}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Hub Announcement and Community Feed */
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '20px', alignItems: 'start', maxWidth: '1200px' }}>
                    {/* Left Column: Feed */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Create Post Panel */}
                      <div className="glass glowing-card" style={{ padding: '24px', borderRadius: '12px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Plus size={18} style={{ color: 'hsl(var(--primary))' }} /> Criar Publicação
                        </h4>
                        <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '12px' }}>
                            <input 
                              type="text" 
                              placeholder="Título do anúncio ou prompt..." 
                              value={newPostTitle}
                              onChange={(e) => setNewPostTitle(e.target.value)}
                              style={{ background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', color: '#fff' }}
                            />
                            <select 
                              value={newPostCategory}
                              onChange={(e) => setNewPostCategory(e.target.value)}
                              style={{ background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', color: '#fff', outline: 'none' }}
                            >
                              <option value="Geral">💬 Geral</option>
                              <option value="Comunicados">📢 Comunicados</option>
                              <option value="Compartilhar Prompts">💡 Compartilhar Prompts</option>
                            </select>
                          </div>
                          <textarea 
                            rows={3} 
                            placeholder="Descreva as novidades, dicas ou compartilhe aquele prompt matador de vendas para retail..." 
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            style={{ background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', color: '#fff', resize: 'none', lineHeight: '1.4' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary" style={{ padding: '8px 20px', fontSize: '12px', borderRadius: '6px' }}>
                              Publicar no Hub
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Post cards list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {hubPosts
                          .filter(post => {
                            // Category filter
                            if (activeHubCategory !== 'inicio') {
                              const activeTagMap = {
                                'geral': 'Geral',
                                'comunicados': 'Comunicados',
                                'prompts': 'Compartilhar Prompts'
                              };
                              if (post.badge !== activeTagMap[activeHubCategory]) {
                                return false;
                              }
                            }
                            // Search filter
                            if (hubSearchQuery.trim()) {
                              const q = hubSearchQuery.toLowerCase();
                              return post.title.toLowerCase().includes(q) || post.content.toLowerCase().includes(q);
                            }
                            return true;
                          })
                          .map(post => (
                            <div key={post.id} className="glass glowing-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              
                              {/* Optional Cover Image */}
                              {post.imageUrl && (
                                <div style={{ width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                                  <img src={post.imageUrl} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <img src={post.authorAvatar} alt={post.author} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid hsl(var(--border))' }} />
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{post.author}</span>
                                      <span style={{ fontSize: '10px', background: 'hsl(var(--border))', color: 'hsl(var(--text-muted))', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                        {post.authorRole}
                                      </span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px', display: 'block' }}>{post.time}</span>
                                  </div>
                                </div>
                                <span className={`badge ${post.badge === 'Geral' ? 'badge-widget' : post.badge === 'Comunicados' ? 'badge-instagram' : 'badge-whatsapp'}`} style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '20px' }}>
                                  {post.badge}
                                </span>
                              </div>

                              <div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-display)', lineHeight: '1.3' }}>{post.title}</h3>
                                <p style={{ fontSize: '13.5px', color: 'hsl(var(--text-muted))', marginTop: '10px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                  {post.content}
                                </p>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid hsl(var(--border))', paddingTop: '14px', marginTop: '4px' }}>
                                <button 
                                  onClick={() => handleLikePost(post.id)}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '6px', color: post.liked ? '#ff1744' : 'hsl(var(--text-muted))', transition: 'all 0.2s' }}
                                >
                                  <Heart size={16} fill={post.liked ? '#ff1744' : 'transparent'} style={{ transition: 'all 0.2s' }} />
                                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{post.likes}</span>
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-muted))', fontSize: '13px', padding: '4px 8px' }}>
                                  <MessageSquare size={16} />
                                  <span style={{ fontWeight: '600' }}>{post.comments}</span>
                                </div>
                              </div>
                            </div>
                          ))}

                        {hubPosts.filter(post => {
                          if (activeHubCategory !== 'inicio') {
                            const activeTagMap = {
                              'geral': 'Geral',
                              'comunicados': 'Comunicados',
                              'prompts': 'Compartilhar Prompts'
                            };
                            if (post.badge !== activeTagMap[activeHubCategory]) return false;
                          }
                          if (hubSearchQuery.trim()) {
                            const q = hubSearchQuery.toLowerCase();
                            return post.title.toLowerCase().includes(q) || post.content.toLowerCase().includes(q);
                          }
                          return true;
                        }).length === 0 && (
                          <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', color: 'hsl(var(--text-muted))', borderRadius: '12px' }}>
                            <p style={{ fontSize: '14px' }}>Nenhuma publicação encontrada para esta categoria ou busca.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Community Widget Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className="glass" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>🎯 Dicas de Engajamento</h4>
                        <p style={{ fontSize: '12.5px', color: 'hsl(var(--text-muted))', lineHeight: '1.5', margin: 0 }}>
                          Compartilhe prompts que aumentam o engajamento da sua loja ou compartilhe feedbacks das suas campanhas de disparos em lote com outros merchants!
                        </p>
                        <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border))', margin: '4px 0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e5ff' }} />
                          <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Suporte oficial das 9h às 18h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 12: DOCUMENTACAO */}
          {activeTab === 'DOCS' && (
            <Documentation />
          )}

          {/* TAB 11: CONFIGURACOES */}
          {activeTab === 'CONFIGURACOES' && (
            <SettingsView
              isMobile={isMobile}
              organization={organization}
              orgLogo={orgLogo}
              setOrgLogo={setOrgLogo}
              handleLogoUpload={handleLogoUpload}
              orgName={orgName}
              setOrgName={setOrgName}
              companyWebsite={companyWebsite}
              setCompanyWebsite={setCompanyWebsite}
              customDashboardUrl={customDashboardUrl}
              setCustomDashboardUrl={setCustomDashboardUrl}
              companySummary={companySummary}
              setCompanySummary={setCompanySummary}
              geminiKey={geminiKey}
              setGeminiKey={setGeminiKey}
              handleSaveSettings={handleSaveSettings}
            />
          )}

          {/* TAB: MASTER (SUPER ADMIN CONTROL PANEL) */}
          {activeTab === 'MASTER' && (
            <MasterAdminView
              isMobile={isMobile}
              subscribers={subscribers}
              subscribersLoading={subscribersLoading}
              fetchSubscribersList={fetchSubscribersList}
              editingSubscriber={editingSubscriber}
              setEditingSubscriber={setEditingSubscriber}
              isEditLimitsOpen={isEditLimitsOpen}
              setIsEditLimitsOpen={setIsEditLimitsOpen}
              newPlan={newPlan}
              setNewPlan={setNewPlan}
              newMaxBots={newMaxBots}
              setNewMaxBots={setNewMaxBots}
              newMaxMessages={newMaxMessages}
              setNewMaxMessages={setNewMaxMessages}
              handleUpdateSubscriberLimits={handleUpdateSubscriberLimits}
              handleImpersonate={handleImpersonate}
              handleDeleteSubscriber={handleDeleteSubscriber}
              handleSystemReset={handleSystemReset}
            />
          )}

        </div>

      </div>

    </div>
  );
}

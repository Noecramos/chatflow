import React, { useState } from 'react';
import { 
  BookOpen, Cpu, Database, Layers, FileText, 
  Megaphone, Terminal, Globe, HelpCircle, Phone, 
  Instagram, MessageSquare, ArrowRight, ChevronRight, 
  CheckCircle2, AlertCircle, Sparkles, Code, Copy, 
  FileCode, Play, ExternalLink, LifeBuoy, ShieldAlert
} from 'lucide-react';

export default function Documentation() {
  const [activeDoc, setActiveDoc] = useState('intro');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Código copiado para a área de transferência!');
  };

  // Navigates directly from overview cards
  const navigateToDoc = (id) => {
    setActiveDoc(id);
    const element = document.getElementById('doc-scroll-container');
    if (element) {
      element.scrollTop = 0;
    }
  };

  // Documentation sections structure
  const docsMenu = [
    {
      title: 'Visão Geral',
      items: [
        { id: 'intro', label: 'Introdução', icon: BookOpen },
        { id: 'arquitetura', label: 'Arquitetura do Fluxo', icon: Layers },
      ]
    },
    {
      title: 'Recursos Principais',
      items: [
        { id: 'agentes', label: 'Agentes AI', icon: Cpu },
        { id: 'rag', label: 'Base de Conhecimento (RAG)', icon: Database },
        { id: 'crm', label: 'Fluxo CRM', icon: Layers },
        { id: 'artefatos', label: 'Artefatos & Respostas', icon: FileText },
        { id: 'disparos', label: 'Disparos em Massa', icon: Megaphone },
        { id: 'noviapi', label: 'NoviAPI Sandbox', icon: Terminal },
      ]
    },
    {
      title: 'Canais de Integração',
      items: [
        { id: 'whatsapp', label: 'Meta WhatsApp API', icon: Phone },
        { id: 'instagram', label: 'Instagram & Messenger', icon: Instagram },
        { id: 'widget', label: 'Widget de Chat', icon: Globe },
      ]
    },
    {
      title: 'Suporte',
      items: [
        { id: 'faq', label: 'FAQ & Dúvidas', icon: HelpCircle },
      ]
    }
  ];

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: '#0a0a0f', display: 'flex' }}>
      
      {/* 1. Left local documentation sidebar */}
      <div 
        className="glass" 
        style={{ 
          width: '280px', 
          borderRight: '1px solid hsl(var(--border))', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '24px 16px',
          background: 'rgba(9, 9, 14, 0.85)',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingLeft: '8px' }}>
          <div 
            style={{ 
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', 
              padding: '6px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <BookOpen size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', color: '#fff', fontWeight: 700 }}>ChatFlow Docs</h3>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Documentação Oficial v4.5</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {docsMenu.map((section, idx) => (
            <div key={idx}>
              <h4 
                style={{ 
                  fontSize: '11px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  color: 'hsl(var(--primary))', 
                  fontWeight: 700, 
                  marginBottom: '8px',
                  paddingLeft: '8px'
                }}
              >
                {section.title}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeDoc === item.id;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => navigateToDoc(item.id)}
                      className={`nav-item ${isSelected ? 'active' : ''}`}
                      style={{ 
                        padding: '8px 12px', 
                        fontSize: '13.5px',
                        borderRadius: '8px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: isSelected ? '#fff' : 'hsl(var(--text-muted))',
                        background: isSelected ? 'rgba(138, 43, 226, 0.15)' : 'transparent',
                        borderLeft: isSelected ? '3px solid hsl(var(--primary))' : 'none'
                      }}
                    >
                      <Icon size={16} style={{ color: isSelected ? 'hsl(var(--primary))' : 'inherit' }} />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Scrollable Document Content */}
      <div 
        id="doc-scroll-container"
        style={{ 
          flex: 1, 
          height: '100%', 
          overflowY: 'auto', 
          padding: '40px 60px',
          scrollBehavior: 'smooth'
        }}
      >
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          
          {/* Path Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'hsl(var(--text-muted))', marginBottom: '16px' }}>
            <span>Documentação</span>
            <ChevronRight size={12} />
            <span style={{ textTransform: 'capitalize', color: 'hsl(var(--primary))', fontWeight: 500 }}>
              {activeDoc === 'intro' ? 'Introdução' : activeDoc}
            </span>
          </div>

          {/* PAGE CONTENT RENDERING ENGINE */}
          
          {/* ======================================================== */}
          {/* INTRO PAGE */}
          {/* ======================================================== */}
          {activeDoc === 'intro' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h1 style={{ fontSize: '38px', color: '#fff', marginBottom: '12px' }}>Introdução</h1>
              <p style={{ fontSize: '17px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '30px' }}>
                Bem-vindo à documentação oficial do <strong>ChatFlow</strong>. 
                Aqui você aprenderá a configurar agentes inteligentes, centralizar conversas omnichannel, gerenciar contatos, programar fluxos dinâmicos e escalar seu atendimento empresarial.
              </p>

              {/* Callout Info Banner */}
              <div 
                className="glass" 
                style={{ 
                  padding: '16px 20px', 
                  borderRadius: '12px', 
                  background: 'rgba(138, 43, 226, 0.06)', 
                  borderLeft: '4px solid hsl(var(--primary))',
                  display: 'flex',
                  gap: '14px',
                  marginBottom: '40px'
                }}
              >
                <Sparkles style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} size={22} />
                <div>
                  <h4 style={{ color: '#fff', fontSize: '14.5px', marginBottom: '4px' }}>Dica de Início Rápido</h4>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.5' }}>
                    Para ativar as inteligências artificiais com processamento semântico, certifique-se de configurar a sua chave privada <strong>GEMINI_API_KEY</strong> dentro da aba de <strong style={{ color: '#fff', cursor: 'pointer' }} onClick={() => navigateToDoc('agentes')}>Configurações de Organização</strong>.
                  </p>
                </div>
              </div>

              <h2 style={{ fontSize: '22px', color: '#fff', marginBottom: '20px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px' }}>
                Explore as Funcionalidades
              </h2>

              {/* Interactive Doc Cards Grid (ChatVolt style mockup) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '40px' }}>
                
                <div onClick={() => navigateToDoc('agentes')} className="glowing-card glass" style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(138, 43, 226, 0.1)', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyOrigin: 'center', justifyContent: 'center' }}>
                    <Cpu size={22} color="hsl(var(--primary))" />
                  </div>
                  <h3 style={{ fontSize: '16px', color: '#fff' }}>Agentes AI</h3>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', lineHeight: '1.5', margin: 0 }}>
                    Configure robôs autônomos com as APIs avançadas do Google Gemini 2.5 Flash, ajustando temperaturas, prompts de comportamento e restrições.
                  </p>
                </div>

                <div onClick={() => navigateToDoc('rag')} className="glowing-card glass" style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(138, 43, 226, 0.1)', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyOrigin: 'center', justifyContent: 'center' }}>
                    <Database size={22} color="hsl(var(--primary))" />
                  </div>
                  <h3 style={{ fontSize: '16px', color: '#fff' }}>Base de Conhecimento (RAG)</h3>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', lineHeight: '1.5', margin: 0 }}>
                    Faça upload de textos institucionais ou catálogos. Nosso algoritmo gera embeddings automáticos e injeta no contexto das respostas.
                  </p>
                </div>

                <div onClick={() => navigateToDoc('crm')} className="glowing-card glass" style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(138, 43, 226, 0.1)', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyOrigin: 'center', justifyContent: 'center' }}>
                    <Layers size={22} color="hsl(var(--primary))" />
                  </div>
                  <h3 style={{ fontSize: '16px', color: '#fff' }}>Fluxo CRM</h3>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', lineHeight: '1.5', margin: 0 }}>
                    Integre as interações dos canais diretamente ao pipeline de vendas Kanban. Classifique leads, defina orçamentos e agende retornos.
                  </p>
                </div>

                <div onClick={() => navigateToDoc('noviapi')} className="glowing-card glass" style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(138, 43, 226, 0.1)', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyOrigin: 'center', justifyContent: 'center' }}>
                    <Terminal size={22} color="hsl(var(--primary))" />
                  </div>
                  <h3 style={{ fontSize: '16px', color: '#fff' }}>NoviAPI Developer Sandbox</h3>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', lineHeight: '1.5', margin: 0 }}>
                    Desenvolva integrações backend em JavaScript sob uma máquina virtual sandbox segura para validar estoque em ERPs de e-commerce.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ARQUITETURA PAGE */}
          {/* ======================================================== */}
          {activeDoc === 'arquitetura' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h1 style={{ fontSize: '38px', color: '#fff', marginBottom: '12px' }}>Arquitetura do Fluxo</h1>
              <p style={{ fontSize: '16px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '30px' }}>
                O ChatFlow opera como um hub de processamento omnichannel assíncrono. Entenda a jornada de um evento de mensagem desde o webhook de origem até a decisão do bot ou transição para um operador humano.
              </p>

              <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Fluxo de Processamento de Mensagens</h2>
              
              <div 
                className="glass" 
                style={{ 
                  padding: '24px', 
                  borderRadius: '12px', 
                  background: 'hsl(var(--bg-card))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '30px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ background: 'hsl(var(--primary))', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>1</span>
                  <span style={{ fontSize: '14.5px', color: '#fff', fontWeight: 600 }}>Recebimento do Webhook</span>
                </div>
                <p style={{ fontSize: '13.5px', color: 'hsl(var(--text-muted))', margin: 0, paddingLeft: '36px', lineHeight: '1.5' }}>
                  Um evento de nova mensagem do WhatsApp, Instagram ou Web Chat chega no servidor de API. O sistema valida e responde de forma assíncrona para o servidor da Meta para liberar a conexão.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                  <span style={{ background: 'hsl(var(--primary))', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>2</span>
                  <span style={{ fontSize: '14.5px', color: '#fff', fontWeight: 600 }}>Deduplicação de Mensagens</span>
                </div>
                <p style={{ fontSize: '13.5px', color: 'hsl(var(--text-muted))', margin: 0, paddingLeft: '36px', lineHeight: '1.5' }}>
                  A mensagem passa por uma rotina dupla de deduplicação que confronta o ID único da mensagem (`message.id` ou `message.mid`) em cache na memória e no banco de dados, protegendo o sistema contra loops gerados por retentativas da Meta.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                  <span style={{ background: 'hsl(var(--primary))', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>3</span>
                  <span style={{ fontSize: '14.5px', color: '#fff', fontWeight: 600 }}>RAG (Pesquisa Semântica)</span>
                </div>
                <p style={{ fontSize: '13.5px', color: 'hsl(var(--text-muted))', margin: 0, paddingLeft: '36px', lineHeight: '1.5' }}>
                  O texto é vetorizado em tempo real e o banco local é escaneado em busca dos chunks de conhecimento com maior similaridade de cosseno. O contexto encontrado é injetado dinamicamente nas diretivas do sistema da IA.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                  <span style={{ background: 'hsl(var(--primary))', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>4</span>
                  <span style={{ fontSize: '14.5px', color: '#fff', fontWeight: 600 }}>Execução do LLM & Ferramentas</span>
                </div>
                <p style={{ fontSize: '13.5px', color: 'hsl(var(--text-muted))', margin: 0, paddingLeft: '36px', lineHeight: '1.5' }}>
                  O Gemini avalia o histórico, o prompt e o contexto para gerar a resposta. Caso seja necessário (ex: pesquisar produto), a IA chama nativamente as funções do e-commerce mapeadas antes de sintetizar o texto final de envio.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* AGENTES PAGE */}
          {/* ======================================================== */}
          {activeDoc === 'agentes' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h1 style={{ fontSize: '38px', color: '#fff', marginBottom: '12px' }}>Agentes AI</h1>
              <p style={{ fontSize: '16px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '30px' }}>
                Os agentes baseados em Inteligência Artificial constituem o motor ativo do ChatFlow. Eles atuam de forma automática respondendo dúvidas, buscando produtos, salvando dados cadastrais e encaminhando atendimentos complexos.
              </p>

              <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Parâmetros do Agente</h2>
              
              <ul style={{ color: 'hsl(var(--text-muted))', fontSize: '14.5px', lineHeight: '1.7', paddingLeft: '20px', marginBottom: '30px' }}>
                <li><strong style={{ color: '#fff' }}>Prompt do Sistema:</strong> É o coração comportamental do bot. Ele deve conter a personalidade, escopo de atuação (ex: "Você é o atendente da Loja XPTO, seja atencioso...") e as regras de etiqueta.</li>
                <li><strong style={{ color: '#fff' }}>Modelo de IA:</strong> Selecione os LLMs integrados (por padrão, Gemini 2.5 Flash, que entrega tempos de latência incrivelmente baixos mantendo uma alta precisão).</li>
                <li><strong style={{ color: '#fff' }}>Temperatura:</strong> Varia de 0 a 1. Modelos de e-commerce e suporte rígido operam melhor em torno de 0.2 a 0.4 (mais focados e consistentes). Bots de conversação aberta brilham em 0.7+.</li>
                <li><strong style={{ color: '#fff' }}>Greeting (Mensagem de Boas-Vindas):</strong> O texto disparado imediatamente assim que um cliente abre o canal pela primeira vez.</li>
              </ul>

              <div 
                className="glass" 
                style={{ 
                  padding: '16px 20px', 
                  borderRadius: '12px', 
                  background: 'rgba(234, 179, 8, 0.05)', 
                  borderLeft: '4px solid hsl(var(--warning))',
                  display: 'flex',
                  gap: '14px',
                  marginBottom: '40px'
                }}
              >
                <AlertCircle style={{ color: 'hsl(var(--warning))', flexShrink: 0 }} size={22} />
                <div>
                  <h4 style={{ color: '#fff', fontSize: '14.5px', marginBottom: '4px' }}>Guardrails Importantes</h4>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.5' }}>
                    Nunca coloque senhas, chaves privadas ou tokens no Prompt do Sistema. Instrua sempre o bot a não tentar simular chamadas fictícias de dados confidenciais de clientes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* RAG PAGE */}
          {/* ======================================================== */}
          {activeDoc === 'rag' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h1 style={{ fontSize: '38px', color: '#fff', marginBottom: '12px' }}>RAG (Geração Aumentada de Recuperação)</h1>
              <p style={{ fontSize: '16px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '30px' }}>
                Alimente seus robôs com conhecimentos institucionais, manuais técnicos ou listas de perguntas frequentes sem precisar de re-treinamento de modelos.
              </p>

              <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Como funciona o RAG no ChatFlow?</h2>
              <p style={{ fontSize: '14.5px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '20px' }}>
                Quando você cadastra um documento textual na base de conhecimento, o servidor realiza as seguintes etapas automatizadas de ponta a ponta:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                <div className="glass" style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)' }}>
                  <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="hsl(var(--secondary))" /> Chunking Inteligente
                  </h4>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.5' }}>
                    O texto de origem é segmentado de forma inteligente em pedaços (chunks) menores contendo uma sobreposição lógica, preservando a semântica de frases contínuas.
                  </p>
                </div>

                <div className="glass" style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)' }}>
                  <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="hsl(var(--secondary))" /> Vetorização e Embeddings
                  </h4>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.5' }}>
                    Os chunks são traduzidos em vetores matemáticos de 768 dimensões utilizando o modelo avançado <strong>text-embedding-004</strong> da Google API.
                  </p>
                </div>

                <div className="glass" style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)' }}>
                  <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="hsl(var(--secondary))" /> Injeção de Contexto Dinâmico
                  </h4>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.5' }}>
                    A cada nova mensagem do cliente, ela é vetorizada instantaneamente. O banco local busca as 3 partes de conhecimento mais similares via cálculo de cosseno e as insere silenciosamente na instrução recebida pelo bot.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* CRM PAGE */}
          {/* ======================================================== */}
          {activeDoc === 'crm' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h1 style={{ fontSize: '38px', color: '#fff', marginBottom: '12px' }}>Fluxo CRM</h1>
              <p style={{ fontSize: '16px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '30px' }}>
                O ChatFlow CRM ajuda equipes de varejo e suporte a organizar leads de conversas em um quadro visual no estilo Kanban, auxiliando no fechamento de negócios.
              </p>

              <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Estágios do Pipeline</h2>
              <p style={{ fontSize: '14.5px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '20px' }}>
                As conversas que entram nos canais integrados são qualificadas e podem transicionar pelos seguintes estágios do pipeline comercial:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
                <div className="glass" style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'hsl(var(--secondary))' }}>1. NOVO / QUALIFICADO</span>
                  <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '6px', margin: 0 }}>O bot qualifica o interesse inicial e abre o card.</p>
                </div>
                <div className="glass" style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'hsl(var(--warning))' }}>2. PROPOSTA / NEGÓCIO</span>
                  <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '6px', margin: 0 }}>O time humano assume a conversa e despacha propostas.</p>
                </div>
                <div className="glass" style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'hsl(var(--success))' }}>3. FECHADO WON / LOST</span>
                  <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '6px', margin: 0 }}>Validação de pagamento em Pix ou cancelamento.</p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ARTEFATOS PAGE */}
          {/* ======================================================== */}
          {activeDoc === 'artefatos' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h1 style={{ fontSize: '38px', color: '#fff', marginBottom: '12px' }}>Artefatos e Respostas Rápidas</h1>
              <p style={{ fontSize: '16px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '30px' }}>
                Ganhe produtividade padronizando o tom da sua empresa. Os operadores de atendimento humano podem resgatar modelos de mensagens previamente cadastrados (canned templates) com apenas um clique.
              </p>

              <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Aplicações Práticas</h2>
              <ul style={{ color: 'hsl(var(--text-muted))', fontSize: '14.5px', lineHeight: '1.7', paddingLeft: '20px' }}>
                <li><strong style={{ color: '#fff' }}>Templates de Pagamento:</strong> Instruções detalhadas de chaves Pix Copia-e-Cola.</li>
                <li><strong style={{ color: '#fff' }}>Políticas de Envio:</strong> Regras de prazos e transportadoras para e-commerce.</li>
                <li><strong style={{ color: '#fff' }}>Mensagens de Retorno:</strong> Respostas formais fora do horário de expediente comercial.</li>
              </ul>
            </div>
          )}

          {/* ======================================================== */}
          {/* DISPAROS PAGE */}
          {/* ======================================================== */}
          {activeDoc === 'disparos' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h1 style={{ fontSize: '38px', color: '#fff', marginBottom: '12px' }}>Disparos em Massa</h1>
              <p style={{ fontSize: '16px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '30px' }}>
                Realize disparos automáticos e programados de WhatsApp para grandes volumes de contatos. Alavanque suas campanhas e retenha clientes inativos.
              </p>

              <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Tipos de Direcionamento</h2>
              <p style={{ fontSize: '14.5px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '20px' }}>
                O módulo permite enviar campanhas baseadas em duas abordagens distintas:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div className="glass" style={{ padding: '20px' }}>
                  <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '6px' }}>Direcionamento por Etiquetas</h4>
                  <p style={{ fontSize: '12.5px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.5' }}>
                    Dispara a campanha ativamente para todas as conversas que possuem uma etiqueta do CRM específica (como 'Lead', 'Boleto Pendente').
                  </p>
                </div>
                <div className="glass" style={{ padding: '20px' }}>
                  <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '6px' }}>Direcionamento por Listas de Contatos</h4>
                  <p style={{ fontSize: '12.5px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.5' }}>
                    Permite criar listas fixas segmentadas (ex: clientes VIP, base importada) e disparar em lote para a lista selecionada.
                  </p>
                </div>
              </div>

              {/* Callout Warning Banner */}
              <div 
                className="glass" 
                style={{ 
                  padding: '16px 20px', 
                  borderRadius: '12px', 
                  background: 'rgba(239, 68, 68, 0.05)', 
                  borderLeft: '4px solid hsl(var(--danger))',
                  display: 'flex',
                  gap: '14px',
                  marginBottom: '30px'
                }}
              >
                <ShieldAlert style={{ color: 'hsl(var(--danger))', flexShrink: 0 }} size={22} />
                <div>
                  <h4 style={{ color: '#fff', fontSize: '14.5px', marginBottom: '4px' }}>Regra de Janela de 24 horas da Meta</h4>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.5' }}>
                    O WhatsApp proíbe disparar mensagens livres (free-form text) fora de uma janela ativa de 24 horas aberta pelo cliente. Disparos frios devem utilizar obrigatoriamente <strong>Templates Oficiais Homologados pela Meta</strong> (como o padrão <em>hello_world</em>).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* NOVIAPI PAGE */}
          {/* ======================================================== */}
          {activeDoc === 'noviapi' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h1 style={{ fontSize: '38px', color: '#fff', marginBottom: '12px' }}>NoviAPI Developer Sandbox</h1>
              <p style={{ fontSize: '16px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '30px' }}>
                Espaço dedicado para desenvolvedores. Escreva códigos JavaScript customizados para integrar seu bot com APIs de ERPs externos, validar estoques ou realizar cálculos dinâmicos de frete.
              </p>

              <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Especificações da Sandbox (Node VM)</h2>
              <p style={{ fontSize: '14.5px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '20px' }}>
                Os scripts rodam sob uma máquina virtual sandbox isolada e totalmente segura no servidor. 
                Cada script é exposto como uma função que recebe um argumento `input` contendo o payload e deve retornar um objeto contendo os resultados da execução.
              </p>

              {/* Code block example */}
              <div 
                style={{ 
                  background: '#13131a', 
                  borderRadius: '10px', 
                  border: '1px solid hsl(var(--border))', 
                  overflow: 'hidden',
                  marginBottom: '30px'
                }}
              >
                <div 
                  style={{ 
                    background: '#1b1b22', 
                    padding: '8px 16px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: '1px solid hsl(var(--border))'
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCode size={14} color="hsl(var(--primary))" /> integracao_erp.js
                  </span>
                  <button 
                    onClick={() => copyToClipboard(`async (input) => {
  const productId = input.productId;
  
  // Realiza chamada de API para o ERP externo de frete/estoque
  const url = "https://api.erp-mock.com/products/" + productId;
  const res = await fetch(url);
  const data = await res.json();
  
  return {
    success: true,
    availableStock: data.stock,
    price: data.price
  };
}`)}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      fontSize: '11px',
                      color: 'hsl(var(--text-muted))'
                    }}
                  >
                    <Copy size={12} /> Copiar
                  </button>
                </div>
                <pre style={{ margin: 0, padding: '20px', overflowX: 'auto', fontSize: '13px', color: '#a5b4fc', fontFamily: 'Courier New, monospace' }}>
{`async (input) => {
  const productId = input.productId;
  
  // Realiza chamada de API para o ERP externo de frete/estoque
  const url = "https://api.erp-mock.com/products/" + productId;
  const res = await fetch(url);
  const data = await res.json();
  
  return {
    success: true,
    availableStock: data.stock,
    price: data.price
  };
}`}
                </pre>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* WHATSAPP PAGE */}
          {/* ======================================================== */}
          {activeDoc === 'whatsapp' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h1 style={{ fontSize: '38px', color: '#fff', marginBottom: '12px' }}>Meta WhatsApp Cloud API</h1>
              <p style={{ fontSize: '16px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '30px' }}>
                O ChatFlow utiliza a API oficial Cloud do WhatsApp (Meta Graph API v21.0) garantindo estabilidade corporativa e custos oficiais.
              </p>

              <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>O Paradoxo do 9º Dígito no Brasil</h2>
              
              <div 
                className="glass" 
                style={{ 
                  padding: '16px 20px', 
                  borderRadius: '12px', 
                  background: 'rgba(59, 130, 246, 0.05)', 
                  borderLeft: '4px solid #3b82f6',
                  display: 'flex',
                  gap: '14px',
                  marginBottom: '30px'
                }}
              >
                <InfoIcon style={{ color: '#3b82f6', flexShrink: 0 }} size={22} />
                <div>
                  <h4 style={{ color: '#fff', fontSize: '14.5px', marginBottom: '4px' }}>Trava do "Ghost Success" (Sucesso Fantasma)</h4>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.5' }}>
                    Os números brasileiros frequentemente alternam de 13 dígitos (+55 81 9XXXX-XXXX) para 12 dígitos (+55 81 XXXX-XXXX) na normalização interna do WhatsApp. 
                    Muitas vezes, a API retorna sucesso de envio para o número de 13 dígitos, mas a mensagem nunca chega porque o ID oficial Meta associado ao número omitiu o 9º dígito.
                  </p>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '12px' }}>Resolução Definitiva</h3>
              <p style={{ fontSize: '14.5px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '20px' }}>
                Para evitar a falha, o desenvolvedor deve registrar e autorizar <strong>ambos os formatos (12 e 13 dígitos)</strong> na Lista de Contatos de Teste do Sandbox Meta e verificar no painel de desenvolvedores a qual Phone ID a sessão está submetida.
              </p>
            </div>
          )}

          {/* ======================================================== */}
          {/* INSTAGRAM PAGE */}
          {/* ======================================================== */}
          {activeDoc === 'instagram' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h1 style={{ fontSize: '38px', color: '#fff', marginBottom: '12px' }}>Instagram Direct & Messenger</h1>
              <p style={{ fontSize: '16px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '30px' }}>
                Habilite o atendimento inteligente nas redes sociais mais famosas do ecossistema Meta. Centralize DMs do Instagram e do Facebook Messenger em uma única tela de chat.
              </p>

              <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Requisitos de Configuração</h2>
              <ul style={{ color: 'hsl(var(--text-muted))', fontSize: '14.5px', lineHeight: '1.7', paddingLeft: '20px' }}>
                <li>Possuir uma conta de criador ou comercial no Instagram vinculada à página institucional da empresa no Facebook.</li>
                <li>Gerar um Token de Acesso permanente no painel Meta Developers habilitando as permissões de mensagens diretas.</li>
                <li>Assinar a sua aplicação nos campos <strong style={{ color: '#fff' }}>messages</strong> e <strong style={{ color: '#fff' }}>messaging_postbacks</strong>.</li>
              </ul>
            </div>
          )}

          {/* ======================================================== */}
          {/* WIDGET PAGE */}
          {/* ======================================================== */}
          {activeDoc === 'widget' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h1 style={{ fontSize: '38px', color: '#fff', marginBottom: '12px' }}>Widget de Chat Web</h1>
              <p style={{ fontSize: '16px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '30px' }}>
                Deseja que seus robôs atendam clientes diretamente em seu site institucional? Nosso Widget flutuante de chat nativo é a resposta ideal.
              </p>

              <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Como Instalar em seu Site?</h2>
              <p style={{ fontSize: '14.5px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '20px' }}>
                Copie o script de inicialização abaixo e insira-o antes do fechamento da tag <strong>&lt;/body&gt;</strong> no código HTML das suas páginas institucionais:
              </p>

              {/* Install code snippet */}
              <div 
                style={{ 
                  background: '#13131a', 
                  borderRadius: '10px', 
                  border: '1px solid hsl(var(--border))', 
                  overflow: 'hidden',
                  marginBottom: '30px'
                }}
              >
                <div 
                  style={{ 
                    background: '#1b1b22', 
                    padding: '8px 16px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: '1px solid hsl(var(--border))'
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Code size={14} color="hsl(var(--primary))" /> index.html
                  </span>
                  <button 
                    onClick={() => copyToClipboard(`<script src="https://checkout.chatvolt.com/widget/chatflow.js" data-bot-id="SEU_BOT_ID" defer></script>`)}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      fontSize: '11px',
                      color: 'hsl(var(--text-muted))'
                    }}
                  >
                    <Copy size={12} /> Copiar
                  </button>
                </div>
                <pre style={{ margin: 0, padding: '20px', overflowX: 'auto', fontSize: '13px', color: '#a5b4fc', fontFamily: 'Courier New, monospace' }}>
{`<script 
  src="https://checkout.chatvolt.com/widget/chatflow.js" 
  data-bot-id="SEU_BOT_ID" 
  defer>
</script>`}
                </pre>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* FAQ PAGE */}
          {/* ======================================================== */}
          {activeDoc === 'faq' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h1 style={{ fontSize: '38px', color: '#fff', marginBottom: '12px' }}>FAQ e Dúvidas Frequentes</h1>
              <p style={{ fontSize: '16px', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '30px' }}>
                Encontre soluções e respostas imediatas para as principais dúvidas de uso e implantação do ecossistema ChatFlow.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                
                <div className="glass" style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Como transicionar do bot para um humano automaticamente?</h4>
                  <p style={{ fontSize: '13.5px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.6' }}>
                    O bot possui a ferramenta `toolHumanHandover` integrada. No prompt, basta instruir a IA que caso o cliente expresse insatisfação ou peça explicitamente para falar com um atendente humano, ela deve disparar o comando. Isso mudará o estado no banco de dados (`isHumanHandoverActive = true`), silenciando as respostas automáticas da IA na conversa.
                  </p>
                </div>

                <div className="glass" style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>A IA consegue reconhecer fotos ou áudios enviados pelos clientes?</h4>
                  <p style={{ fontSize: '13.5px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.6' }}>
                    Atualmente, o ChatFlow processa puramente mensagens textuais e opções de menus interativos. Áudios e mídias de imagem dispararão respostas automáticas pré-formatadas orientando o cliente a descrever em formato de texto o arquivo enviado para dar prosseguimento ao atendimento.
                  </p>
                </div>

                <div className="glass" style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Como testar o envio de webhooks localmente?</h4>
                  <p style={{ fontSize: '13.5px', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.6' }}>
                    Você pode rodar o simulador completo de testes locais executando `node src/test-flow.js` no terminal da pasta do servidor para disparar payloads mockados de mensagens e Pix.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* 3. Right outline sidebar */}
      <div 
        style={{ 
          width: '220px', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '40px 20px',
          borderLeft: '1px solid hsl(var(--border))',
          background: 'rgba(9, 9, 14, 0.5)'
        }}
      >
        <h4 
          style={{ 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em', 
            color: 'hsl(var(--text-muted))', 
            fontWeight: 700, 
            marginBottom: '16px'
          }}
        >
          Nesta página
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
          <div style={{ color: 'hsl(var(--primary))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'hsl(var(--primary))' }}></span>
            <span>{activeDoc === 'intro' ? 'Overview' : 'Documento'}</span>
          </div>
          <div style={{ color: 'hsl(var(--text-muted))', paddingLeft: '10px', cursor: 'pointer' }} onClick={() => navigateToDoc(activeDoc)}>
            {activeDoc === 'intro' ? 'chatflow' : 'Detalhes'}
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div 
            className="glass glowing-card" 
            style={{ 
              padding: '16px', 
              borderRadius: '10px', 
              textAlign: 'center', 
              background: 'rgba(138, 43, 226, 0.05)'
            }}
          >
            <LifeBuoy size={20} color="hsl(var(--primary))" style={{ margin: '0 auto 8px auto' }} />
            <h5 style={{ fontSize: '12px', color: '#fff', marginBottom: '4px' }}>Precisa de ajuda?</h5>
            <p style={{ fontSize: '10.5px', color: 'hsl(var(--text-muted))', margin: '0 0 10px 0', lineHeight: '1.4' }}>
              Fale diretamente com nosso suporte dedicado.
            </p>
            <a 
              href="mailto:support@chatflow.ai" 
              style={{ 
                fontSize: '11px', 
                color: 'hsl(var(--primary))', 
                fontWeight: 'bold', 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              Fale conosco <ExternalLink size={10} />
            </a>
          </div>
        </div>

      </div>

    </div>
  );
}

// Inline helper for Info Icon
function InfoIcon({ size = 20, color = 'currentColor', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

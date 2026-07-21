import React from 'react';
import { Plus, User, Sliders, Cpu, Globe, ToggleRight, ToggleLeft } from 'lucide-react';

export default function AiAgentsView({
  bots,
  selectedBot,
  handleSelectBot,
  handleCreateBot,
  newBotName,
  setNewBotName,
  botSettingsTab,
  setBotSettingsTab,
  handleUpdateBotSettings,
  handleDeleteBot,
  agentName,
  setAgentName,
  agentDescription,
  setAgentDescription,
  agentGreeting,
  setAgentGreeting,
  agentPrompt,
  setAgentPrompt,
  agentModel,
  setAgentModel,
  agentTemperature,
  setAgentTemperature,
  isBotSaving,
  toolKnowledgeBase,
  setToolKnowledgeBase,
  toolHumanHandover,
  setToolHumanHandover,
  toolMockErp,
  setToolMockErp,
  outboundWebhook,
  setOutboundWebhook,
  outboundHeader,
  setOutboundHeader
}) {
  return (
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
          
          {/* Left inner tab selector */}
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
  );
}

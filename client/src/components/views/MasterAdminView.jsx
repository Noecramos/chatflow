import React from 'react';
import { ShieldAlert, Layers, Cpu, MessageSquare, Edit, Sliders, Trash2, AlertCircle } from 'lucide-react';

export default function MasterAdminView({
  isMobile,
  subscribers,
  subscribersLoading,
  fetchSubscribersList,
  editingSubscriber,
  setEditingSubscriber,
  isEditLimitsOpen,
  setIsEditLimitsOpen,
  newPlan,
  setNewPlan,
  newMaxBots,
  setNewMaxBots,
  newMaxMessages,
  setNewMaxMessages,
  handleUpdateSubscriberLimits,
  handleImpersonate,
  handleDeleteSubscriber,
  handleSystemReset
}) {
  return (
    <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert style={{ color: 'hsl(var(--primary))' }} /> Painel de Controle Master Admin
          </h3>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', marginTop: '4px' }}>
            Gerenciamento global de inquilinos (SaaS tenants), alteração de limites operacionais e impersonificação de contas de clientes.
          </p>
        </div>
        <button 
          onClick={fetchSubscribersList} 
          className="btn-primary" 
          style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ↻ Atualizar Dados
        </button>
      </div>

      {/* System Health Metrics Card Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="glass glowing-card" style={{ padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', padding: '12px', borderRadius: '8px' }}>
            <Layers size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>EMPRESAS REGISTRADAS</span>
            <h4 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>{subscribers.length}</h4>
          </div>
        </div>

        <div className="glass glowing-card" style={{ padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'hsl(var(--secondary) / 0.15)', color: 'hsl(var(--secondary))', padding: '12px', borderRadius: '8px' }}>
            <Cpu size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>AGENTES AI ATIVOS</span>
            <h4 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
              {subscribers.reduce((acc, sub) => acc + (sub.botCount || 0), 0)}
            </h4>
          </div>
        </div>

        <div className="glass glowing-card" style={{ padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '12px', borderRadius: '8px' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>TRÁFEGO GLOBAL MENSAL</span>
            <h4 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
              {subscribers.reduce((acc, sub) => acc + (sub.apiUsageThisMonth || 0), 0)} <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>mensagens</span>
            </h4>
          </div>
        </div>
      </div>

      {/* Company Control Deck Table */}
      <div className="glass" style={{ padding: '20px', borderRadius: '8px', overflowX: 'auto' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Deck de Inquilinos Ativos</h4>
        
        {subscribersLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            Carregando dados dos assinantes...
          </div>
        ) : subscribers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            Nenhuma empresa registrada no sistema.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>
                  <th style={{ padding: '12px 8px' }}>Empresa</th>
                  <th style={{ padding: '12px 8px' }}>Plano</th>
                  <th style={{ padding: '12px 8px' }}>Consumo de Mensagens</th>
                  <th style={{ padding: '12px 8px' }}>Bots Cadastrados</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => {
                  const usagePercent = Math.min(100, Math.round(((subscriber.apiUsageThisMonth || 0) / (subscriber.maxMessagesPerMonth || 1)) * 100));
                  return (
                    <tr key={subscriber.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff' }} className="table-row-hover">
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ fontWeight: '700', color: '#fff' }}>{subscriber.name}</div>
                        <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>UUID: {subscriber.id}</div>
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: subscriber.plan === 'ENTERPRISE' ? 'rgba(138, 43, 226, 0.15)' : subscriber.plan === 'PRO' ? 'rgba(0, 106, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                          color: subscriber.plan === 'ENTERPRISE' ? 'hsl(var(--secondary))' : subscriber.plan === 'PRO' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                          border: '1px solid ' + (subscriber.plan === 'ENTERPRISE' ? 'hsl(var(--secondary) / 0.3)' : subscriber.plan === 'PRO' ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))')
                        }}>
                          {subscriber.plan}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', width: '220px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'hsl(var(--text-muted))', marginBottom: '4px' }}>
                          <span>{subscriber.apiUsageThisMonth || 0} / {subscriber.maxMessagesPerMonth}</span>
                          <span>{usagePercent}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${usagePercent}%`, 
                            height: '100%', 
                            background: usagePercent > 90 ? 'hsl(var(--danger))' : usagePercent > 70 ? 'hsl(var(--warning))' : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))' 
                          }} />
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ fontWeight: '600' }}>{subscriber.botCount || 0} / {subscriber.maxBots} bots</div>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => {
                              setEditingSubscriber(subscriber);
                              setNewPlan(subscriber.plan || 'FREE');
                              setNewMaxBots(subscriber.maxBots || 2);
                              setNewMaxMessages(subscriber.maxMessagesPerMonth || 1000);
                              setIsEditLimitsOpen(true);
                            }}
                            className="btn-primary" 
                            style={{ padding: '6px 10px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid hsl(var(--border))', color: '#fff' }}
                            title="Editar Limites"
                          >
                            <Edit size={13} />
                          </button>
                          <button 
                            onClick={() => handleImpersonate(subscriber.id)}
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Acessar Dashboard"
                          >
                            <Sliders size={13} />
                            <span>Acessar</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteSubscriber(subscriber.id, subscriber.name)}
                            className="btn-primary" 
                            style={{ padding: '6px 10px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'rgb(239, 68, 68)' }}
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Maintenance Reset Deck */}
      <div className="glass" style={{ padding: '24px', borderRadius: '8px', border: '1px solid hsl(var(--danger) / 0.2)', background: 'hsl(var(--danger) / 0.02)' }}>
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'hsl(var(--danger))', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> Ações Críticas de Manutenção
        </h4>
        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12.5px', marginTop: '6px', lineHeight: '1.5' }}>
          Esta operação destrutiva limpará completamente o banco de dados do ChatFlow, apagando todos os registros de usuários, atendentes, conexões e bots do sistema, preservando apenas sua conta master atual. Utilize com extrema cautela.
        </p>
        <button 
          onClick={handleSystemReset} 
          className="btn-primary" 
          style={{ marginTop: '14px', background: 'hsl(var(--danger))', border: '1px solid hsl(var(--danger))', color: '#fff', fontWeight: '700', padding: '10px 18px', fontSize: '13px' }}
        >
          🚨 Limpar Banco de Dados (System Reset)
        </button>
      </div>

      {/* Edit Limits Modal */}
      {isEditLimitsOpen && editingSubscriber && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div className="glass glowing-card" style={{ width: '450px', padding: '30px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>Editar Limites Operacionais</h4>
              <button 
                onClick={() => { setIsEditLimitsOpen(false); setEditingSubscriber(null); }}
                style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-muted))', fontSize: '18px', cursor: 'pointer', fontWeight: '600' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
              Empresa: <strong style={{ color: '#fff' }}>{editingSubscriber.name}</strong>
            </div>

            <form onSubmit={handleUpdateSubscriberLimits} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Plano da Empresa</label>
                <select 
                  value={newPlan} 
                  onChange={(e) => setNewPlan(e.target.value)}
                  style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px', borderRadius: '6px', fontSize: '13px', color: '#fff', outline: 'none' }}
                >
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Máximo de Agentes AI</label>
                <input 
                  type="number" 
                  required 
                  value={newMaxBots} 
                  onChange={(e) => setNewMaxBots(e.target.value)}
                  style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Limite de Mensagens Mensais</label>
                <input 
                  type="number" 
                  required 
                  value={newMaxMessages} 
                  onChange={(e) => setNewMaxMessages(e.target.value)}
                  style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => { setIsEditLimitsOpen(false); setEditingSubscriber(null); }}
                  className="btn-primary" 
                  style={{ background: 'transparent', border: '1px solid hsl(var(--border))', color: 'hsl(var(--text-muted))', padding: '10px 18px', fontSize: '12px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ padding: '10px 18px', fontSize: '12px', fontWeight: '700' }}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

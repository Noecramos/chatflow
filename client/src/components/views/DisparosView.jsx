import React from 'react';

export default function DisparosView({
  campaigns,
  contactLists,
  activeBroadcastTab,
  setActiveBroadcastTab,
  handleStopCampaign,
  handleRetryFailedCampaign,
  handleViewCampaignLogs,
  handleDeleteContactList,
  isCreateCampaignOpen,
  setIsCreateCampaignOpen,
  isManageListsOpen,
  setIsManageListsOpen,
  isLogsModalOpen,
  setIsLogsModalOpen,
  selectedCampaignLogs,
  // Campaign creation form state
  newCampaignName,
  setNewCampaignName,
  newCampaignTargetType,
  setNewCampaignTargetType,
  newCampaignLabel,
  setNewCampaignLabel,
  newCampaignListId,
  setNewCampaignListId,
  newCampaignContent,
  setNewCampaignContent,
  newCampaignScheduleEnabled,
  setNewCampaignScheduleEnabled,
  newCampaignScheduledFor,
  setNewCampaignScheduledFor,
  campaignCreationLoading,
  handleCreateCampaign,
  // Contact list creation form state
  newListName,
  setNewListName,
  newListContactIds,
  setNewListContactIds,
  listCreationLoading,
  handleCreateContactList,
  conversations
}) {
  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="pulse-glowing" style={{
            width: '66px',
            height: '66px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.1))',
            border: '1px solid hsl(var(--primary) / 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px hsl(var(--primary) / 0.25)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--primary))' }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              <path d="M2 8c0-3.3 2.7-6 6-6"></path>
              <path d="M22 8c0-3.3-2.7-6-6-6"></path>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: '34px', fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: '#ffffff' }}>Disparos</h2>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '14px', marginTop: '4px', opacity: 0.9 }}>
              Gerencie seus disparos em massa e campanhas omnichannel de marketing.
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => alert('Para adquirir créditos de disparos adicionais para WhatsApp Oficial da Meta, entre em contato com comercial@noviapp.ai')} style={{
            background: 'transparent',
            border: '1px solid #25d366',
            color: '#25d366',
            padding: '12px 22px',
            fontSize: '14px',
            fontWeight: '700',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }} onMouseEnter={(e) => e.target.style.background = '#25d36615'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
            💬 Comprar disparos
          </button>
          <button onClick={() => setIsManageListsOpen(true)} className="btn-secondary" style={{ padding: '12px 22px', fontSize: '14px', fontWeight: '700', borderRadius: '8px' }}>
            📁 Criar Lista de Contatos
          </button>
          <button onClick={() => alert('A sincronização de Templates Oficiais do WhatsApp está disponível através do console da Meta Cloud.')} className="btn-secondary" style={{ padding: '12px 22px', fontSize: '14px', fontWeight: '700', borderRadius: '8px' }}>
            ⚙️ Gerenciar Templates
          </button>
          <button onClick={() => setIsCreateCampaignOpen(true)} className="btn-primary" style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '800', borderRadius: '8px', boxShadow: '0 0 16px hsl(var(--primary) / 0.45)' }}>
            📢 Novo Disparo
          </button>
        </div>
      </div>

      {/* Sub-tab selection bar */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid hsl(var(--border) / 0.4)', paddingBottom: '14px', marginTop: '14px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {[
          { key: 'ativos', label: '⚡ Ativos', count: campaigns.filter(c => c.status === 'PROCESSING' || c.status === 'PAUSED').length },
          { key: 'agendados', label: '📅 Agendados', count: campaigns.filter(c => c.status === 'PENDING').length },
          { key: 'concluidos', label: '✅ Concluídos', count: campaigns.filter(c => c.status === 'COMPLETED').length },
          { key: 'listas', label: '📁 Listas Salvas', count: contactLists.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveBroadcastTab(tab.key)}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '700',
              borderRadius: '8px',
              border: 'none',
              background: activeBroadcastTab === tab.key ? 'hsl(var(--primary) / 0.2)' : 'transparent',
              color: activeBroadcastTab === tab.key ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
              boxShadow: activeBroadcastTab === tab.key ? '0 0 12px hsl(var(--primary-glow))' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              fontSize: '11px',
              background: activeBroadcastTab === tab.key ? 'hsl(var(--primary) / 0.25)' : 'hsl(var(--border) / 0.5)',
              color: activeBroadcastTab === tab.key ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
              padding: '2px 8px',
              borderRadius: '10px',
              fontWeight: '700'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Active Campaigns */}
      {activeBroadcastTab === 'ativos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {campaigns.filter(c => c.status === 'PROCESSING' || c.status === 'PAUSED').map(c => {
            const pct = c.totalCount > 0 ? Math.round((c.sentCount + c.errorCount) / c.totalCount * 100) : 0;
            return (
              <div key={c.id} className="glass glowing-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>{c.name}</h4>
                    <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', marginTop: '6px', display: 'block' }}>
                      Segmentação: {c.contactList ? `Lista "${c.contactList.name}"` : `Rótulo "${c.label === 'Lead' ? 'Novos Leads / Vendas Varejo' : c.label === 'Billing' ? 'Carrinho Abandonado / Faturamento' : c.label === 'Support' ? 'Suporte Técnico / Pós-Venda' : 'Todos'}"`}
                    </span>
                  </div>
                  <span className="badge" style={{
                    background: c.status === 'PROCESSING' ? '#006aff20' : '#ff980020',
                    color: c.status === 'PROCESSING' ? '#006aff' : '#ff9800',
                    borderColor: c.status === 'PROCESSING' ? '#006aff' : '#ff9800',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    padding: '4px 10px',
                    fontSize: '11px'
                  }}>
                    {c.status === 'PROCESSING' ? 'Enviando...' : 'Pausado'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', fontStyle: 'italic', background: 'hsl(var(--border) / 0.15)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid hsl(var(--primary))' }}>
                  "{c.content}"
                </p>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'hsl(var(--text-muted))', marginBottom: '6px', fontWeight: '600' }}>
                    <span>Progresso: {c.sentCount + c.errorCount} de {c.totalCount} contatos</span>
                    <span>{pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'hsl(var(--border) / 0.4)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'hsl(var(--primary))', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <span style={{ color: '#00c853', fontWeight: '700' }}>✓ {c.sentCount} Entregues</span>
                    <span style={{ color: '#ff1744', fontWeight: '700' }}>✗ {c.errorCount} Falhas</span>
                  </div>
                  {c.status === 'PROCESSING' ? (
                    <button onClick={() => handleStopCampaign(c.id)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', borderColor: '#ff1744', color: '#ff1744', fontWeight: '700' }}>
                      ⏸ Pausar Disparos
                    </button>
                  ) : (
                    <button onClick={() => handleRetryFailedCampaign(c.id)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700' }}>
                      ▶ Retomar Disparos
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {campaigns.filter(c => c.status === 'PROCESSING' || c.status === 'PAUSED').length === 0 && campaigns.length === 0 ? (
            <div className="glass" style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', borderRadius: '16px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card) / 0.3)', width: '100%' }}>
              <div className="pulse-glowing" style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.05))',
                border: '2px solid hsl(var(--primary) / 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px hsl(var(--primary) / 0.3)'
              }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--primary))' }}>
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
                  <line x1="12" x2="12" y1="19" y2="22"></line>
                </svg>
              </div>
              <div style={{ textAlign: 'center', maxWidth: '640px' }}>
                <h3 style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: '#fff' }}>
                  Bem-vindo aos Disparos
                </h3>
                <h5 style={{ fontSize: '15px', fontWeight: '500', color: 'hsl(var(--text-muted))', marginTop: '8px', lineHeight: '1.4' }}>
                  Envie mensagens em massa do WhatsApp para suas listas de contatos.
                </h5>
                <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', marginTop: '12px', lineHeight: '1.6', opacity: 0.8 }}>
                  Disparos permitem que você envie mensagens em lote para suas listas de contatos usando templates do WhatsApp. Crie campanhas, agende mensagens e acompanhe o status de entrega tudo em um só lugar.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%', maxWidth: '640px', borderTop: '1px solid hsl(var(--border) / 0.3)', paddingTop: '28px', marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: 'hsl(var(--primary))', marginTop: '2px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 7"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Mensagens em Massa</h4>
                    <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px', lineHeight: '1.4' }}>
                      Envie mensagens para milhares de contatos simultaneamente com templates do WhatsApp.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: 'hsl(var(--primary))', marginTop: '2px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 7"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Acompanhamento de Campanhas</h4>
                    <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px', lineHeight: '1.4' }}>
                      Monitore o status de entrega e acompanhe o desempenho da campanha em tempo real.
                    </p>
                  </div>
                </div>
              </div>

              <button onClick={() => setIsCreateCampaignOpen(true)} className="btn-primary" style={{ padding: '12px 28px', fontSize: '13px', fontWeight: '800', borderRadius: '8px', marginTop: '10px' }}>
                Criar Primeira Campanha
              </button>
            </div>
          ) : (
            campaigns.filter(c => c.status === 'PROCESSING' || c.status === 'PAUSED').length === 0 && (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'hsl(var(--text-muted))' }}>
                <p style={{ fontSize: '14px' }}>Nenhum disparo em andamento ou pausado no momento.</p>
              </div>
            )
          )}
        </div>
      )}

      {/* Scheduled Campaigns */}
      {activeBroadcastTab === 'agendados' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {campaigns.filter(c => c.status === 'PENDING').map(c => (
            <div key={c.id} className="glass glowing-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>{c.name}</h4>
                  <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginTop: '4px', display: 'block' }}>
                    📅 Agendado para: <strong style={{ color: 'hsl(var(--primary))' }}>{new Date(c.scheduledFor).toLocaleString('pt-BR')}</strong>
                  </span>
                </div>
                <span className="badge" style={{ background: 'hsl(var(--border) / 0.5)', color: 'hsl(var(--text-muted))', padding: '4px 10px' }}>
                  Agendado
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', fontStyle: 'italic', background: 'hsl(var(--border) / 0.15)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid hsl(var(--primary))' }}>
                "{c.content}"
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                  Público Alvo: {c.contactList ? `Lista "${c.contactList.name}"` : `Rótulo "${c.label === 'Lead' ? 'Novos Leads / Vendas Varejo' : c.label === 'Billing' ? 'Carrinho Abandonado / Faturamento' : c.label === 'Support' ? 'Suporte Técnico / Pós-Venda' : 'Todos'}"`} ({c.totalCount} contatos)
                </span>
                <button onClick={() => handleStopCampaign(c.id)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', color: '#ff1744', borderColor: '#ff1744', fontWeight: '700' }}>
                  Excluir Agendamento
                </button>
              </div>
            </div>
          ))}
          {campaigns.filter(c => c.status === 'PENDING').length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'hsl(var(--text-muted))' }}>
              <p style={{ fontSize: '14px' }}>Nenhum disparo agendado.</p>
            </div>
          )}
        </div>
      )}

      {/* Completed Campaigns */}
      {activeBroadcastTab === 'concluidos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {campaigns.filter(c => c.status === 'COMPLETED').map(c => (
            <div key={c.id} className="glass glowing-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>{c.name}</h4>
                  <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginTop: '4px', display: 'block' }}>
                    Concluído em: <strong>{c.completedAt ? new Date(c.completedAt).toLocaleString('pt-BR') : 'Recente'}</strong>
                  </span>
                </div>
                <span className="badge" style={{ background: '#00c85320', color: '#00c853', borderColor: '#00c853', borderStyle: 'solid', borderWidth: '1px', padding: '4px 10px' }}>
                  Concluído
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', fontStyle: 'italic', background: 'hsl(var(--border) / 0.15)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid hsl(var(--primary))' }}>
                "{c.content}"
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                  <span style={{ color: '#00c853', fontWeight: '700' }}>✓ {c.sentCount} Enviados com Sucesso</span>
                  <span style={{ color: '#ff1744', fontWeight: '700' }}>✗ {c.errorCount} Falhas</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleViewCampaignLogs(c.id)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700' }}>
                    🔍 Ver Logs
                  </button>
                  {c.errorCount > 0 && (
                    <button onClick={() => handleRetryFailedCampaign(c.id)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px', background: '#e6683c', fontWeight: '700' }}>
                      🔄 Reenviar Falhas
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {campaigns.filter(c => c.status === 'COMPLETED').length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'hsl(var(--text-muted))' }}>
              <p style={{ fontSize: '14px' }}>Nenhum disparo concluído ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* Contact Lists */}
      {activeBroadcastTab === 'listas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {contactLists.map(list => (
            <div key={list.id} className="glass glowing-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>📁 {list.name}</h4>
                <button onClick={() => handleDeleteContactList(list.id)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px', color: '#ff1744', borderColor: '#ff1744', fontWeight: '700' }}>
                  Excluir
                </button>
              </div>
              <div style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                Membros sincronizados: <strong>{list.contacts.length} contatos</strong>
              </div>
              <div style={{ maxHeight: '110px', overflowY: 'auto', background: 'hsl(var(--border) / 0.15)', padding: '8px', borderRadius: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {list.contacts.slice(0, 12).map(contact => (
                  <span key={contact.id} style={{ fontSize: '10px', background: 'hsl(var(--border) / 0.3)', padding: '3px 6px', borderRadius: '4px', fontWeight: '600' }}>
                    {contact.name}
                  </span>
                ))}
                {list.contacts.length > 12 && (
                  <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', padding: '3px', fontWeight: '600' }}>+{list.contacts.length - 12} mais</span>
                )}
              </div>
            </div>
          ))}
          {contactLists.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'hsl(var(--text-muted))' }}>
              <p style={{ fontSize: '14px' }}>Nenhuma lista de contatos criada ainda.</p>
              <button onClick={() => setIsManageListsOpen(true)} className="btn-primary" style={{ marginTop: '14px', fontSize: '12px', padding: '8px 18px', fontWeight: '700' }}>
                Criar Primeira Lista
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Create Broadcast Campaign */}
      {isCreateCampaignOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '90%', maxWidth: '520px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '22px', borderRadius: '12px' }}>
            <div>
              <h4 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>📢 Nova Campanha de Disparo</h4>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '3px' }}>Envie mensagens ativas em lote.</p>
            </div>
            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>Nome da Campanha</label>
                <input
                  type="text"
                  required
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="Campanha Promoção Black Friday"
                  style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '12px 14px', borderRadius: '6px', fontSize: '14px', color: '#fff' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>Segmentar Por</label>
                  <select
                    value={newCampaignTargetType}
                    onChange={(e) => setNewCampaignTargetType(e.target.value)}
                    style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '12px 14px', borderRadius: '6px', fontSize: '14px', color: '#fff' }}
                  >
                    <option value="LABEL">Rótulo CRM</option>
                    <option value="LIST">Lista Personalizada</option>
                  </select>
                </div>
                <div>
                  {newCampaignTargetType === 'LABEL' ? (
                    <>
                      <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>Rótulo Alvo</label>
                      <select
                        value={newCampaignLabel}
                        onChange={(e) => setNewCampaignLabel(e.target.value)}
                        style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '12px 14px', borderRadius: '6px', fontSize: '14px', color: '#fff' }}
                      >
                        <option value="Lead">Novos Leads / Vendas Varejo</option>
                        <option value="Billing">Carrinho Abandonado / Faturamento</option>
                        <option value="Support">Suporte Técnico / Pós-Venda</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>Escolher Lista</label>
                      <select
                        required
                        value={newCampaignListId}
                        onChange={(e) => setNewCampaignListId(e.target.value)}
                        style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '12px 14px', borderRadius: '6px', fontSize: '14px', color: '#fff' }}
                      >
                        <option value="">Selecione uma lista...</option>
                        {contactLists.map(list => (
                          <option key={list.id} value={list.id}>{list.name} ({list.contacts.length} contatos)</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>Mensagem do Disparo</label>
                <textarea
                  required
                  rows={4}
                  value={newCampaignContent}
                  onChange={(e) => setNewCampaignContent(e.target.value)}
                  placeholder="Olá! Separamos uma promoção incrível para você..."
                  style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#fff', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newCampaignScheduleEnabled}
                    onChange={(e) => setNewCampaignScheduleEnabled(e.target.checked)}
                  />
                  <span>📅 Agendar envio para depois?</span>
                </label>
              </div>

              {newCampaignScheduleEnabled && (
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>Data & Hora de Disparo</label>
                  <input
                    type="datetime-local"
                    required
                    value={newCampaignScheduledFor}
                    onChange={(e) => setNewCampaignScheduledFor(e.target.value)}
                    style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', color: '#fff' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsCreateCampaignOpen(false)} className="btn-secondary" style={{ padding: '10px 20px', fontSize: '12px', fontWeight: '700' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={campaignCreationLoading} className="btn-primary" style={{ padding: '10px 20px', fontSize: '12px', fontWeight: '800' }}>
                  {campaignCreationLoading ? "Carregando..." : newCampaignScheduleEnabled ? "Agendar Disparo" : "Iniciar Disparos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create/Manage Contact Lists */}
      {isManageListsOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '90%', maxWidth: '570px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '22px', borderRadius: '12px' }}>
            <div>
              <h4 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>📁 Criar Lista de Contatos</h4>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '3px' }}>Segmentação de contatos para disparos.</p>
            </div>
            <form onSubmit={handleCreateContactList} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>Nome da Lista</label>
                <input
                  type="text"
                  required
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Lista Clientes VIPs"
                  style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>
                  Selecionar Contatos ({newListContactIds.length} selecionados)
                </label>
                <div style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: 'hsl(var(--border) / 0.25)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {Array.from(new Map(conversations.map(c => [c.contact?.id, c.contact])).values()).filter(Boolean).map(contact => {
                    const isChecked = newListContactIds.includes(contact.id);
                    return (
                      <label key={contact.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', background: isChecked ? 'hsl(var(--primary) / 0.15)' : 'transparent', transition: 'background 0.2s' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewListContactIds(prev => [...prev, contact.id]);
                            } else {
                              setNewListContactIds(prev => prev.filter(id => id !== contact.id));
                            }
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center' }}>
                          <strong style={{ color: '#fff' }}>{contact.name}</strong>
                          <span style={{ fontSize: '10px', opacity: 0.7, color: 'hsl(var(--text-muted))' }}>{contact.platformType} ({contact.platformId})</span>
                        </div>
                      </label>
                    );
                  })}
                  {Array.from(new Map(conversations.map(c => [c.contact?.id, c.contact])).values()).filter(Boolean).length === 0 && (
                    <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '20px' }}>
                      Nenhum contato encontrado no histórico recente.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsManageListsOpen(false)} className="btn-secondary" style={{ padding: '10px 20px', fontSize: '12px', fontWeight: '700' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={listCreationLoading} className="btn-primary" style={{ padding: '10px 20px', fontSize: '12px', fontWeight: '800' }}>
                  {listCreationLoading ? "Criando..." : "Criar Lista"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Detailed Campaign Delivery Logs */}
      {isLogsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '95%', maxWidth: '680px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '22px', maxHeight: '85vh', overflowY: 'auto', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>📋 Auditoria de Envios</h4>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '3px' }}>Lista detalhada de status de entrega da campanha.</p>
              </div>
              <button onClick={() => setIsLogsModalOpen(false)} className="btn-secondary" style={{ padding: '6px 16px', fontSize: '12px', fontWeight: '700' }}>
                Fechar
              </button>
            </div>

            <div style={{ overflowX: 'auto', background: 'hsl(var(--border) / 0.1)', borderRadius: '8px', border: '1px solid hsl(var(--border) / 0.3)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)', color: 'hsl(var(--text-muted))', background: 'hsl(var(--border) / 0.2)' }}>
                    <th style={{ padding: '12px 10px', textAlign: 'left' }}>Contato</th>
                    <th style={{ padding: '12px 10px', textAlign: 'left' }}>Identificador (Canal)</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px 10px', textAlign: 'left' }}>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCampaignLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '700', color: '#fff' }}>{log.contact?.name || 'N/D'}</td>
                      <td style={{ padding: '12px 10px' }}>{log.contact?.platformId || 'N/D'} ({log.contact?.platformType || 'N/D'})</td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <span className="badge" style={{
                          background: log.status === 'SUCCESS' ? '#00c85320' : '#ff174420',
                          color: log.status === 'SUCCESS' ? '#00c853' : '#ff1744',
                          borderColor: log.status === 'SUCCESS' ? '#00c853' : '#ff1744',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          padding: '3px 8px'
                        }}>
                          {log.status === 'SUCCESS' ? 'Sucesso' : 'Falha'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', color: 'hsl(var(--text-muted))', fontSize: '11px', fontStyle: log.status === 'FAILED' ? 'normal' : 'italic' }}>
                        {log.status === 'FAILED' ? log.errorMessage || 'Erro indeterminado' : 'Entregue com sucesso'}
                      </td>
                    </tr>
                  ))}
                  {selectedCampaignLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'hsl(var(--text-muted))' }}>
                        Nenhum log registrado para este disparo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

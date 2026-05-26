import React, { useState, useEffect } from 'react';
import {
  Users, DollarSign, TrendingUp, Clock, Target, Zap,
  BarChart3, MessageSquare, Phone, Instagram, Facebook, Globe,
  RefreshCw
} from 'lucide-react';

const CHANNEL_ICONS = {
  WHATSAPP: { icon: Phone, color: '#25d366' },
  INSTAGRAM: { icon: Instagram, color: '#E1306C' },
  MESSENGER: { icon: Facebook, color: '#1877F2' },
  WIDGET: { icon: Globe, color: '#8a2be2' },
  MANUAL: { icon: Users, color: '#999' }
};

export default function CrmDashboard({ token }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState('ALL');
  const [period, setPeriod] = useState('ALL');

  const fetchMetrics = async (selectedChannel = channel, selectedPeriod = period) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        channel: selectedChannel,
        period: selectedPeriod
      });
      const res = await fetch(`/inbox/crm/metrics?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMetrics(data.metrics);
    } catch (e) {
      console.error('CRM Metrics fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMetrics(channel, period);
    }
  }, [token, channel, period]);

  if (!metrics) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
        <RefreshCw size={32} className="spin" style={{ marginBottom: '12px', opacity: 0.5 }} />
        <p>Carregando métricas CRM...</p>
      </div>
    );
  }

  const maxFunnelCount = Math.max(...metrics.funnel.map(f => f.count), 1);
  const totalChannelLeads = Object.values(metrics.channelCounts).reduce((s, v) => s + v, 0) || 1;

  // Daily leads chart data — last 14 days
  const dailyEntries = Object.entries(metrics.dailyLeads).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  const maxDaily = Math.max(...dailyEntries.map(([, v]) => v), 1);

  return (
    <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800 }}>
            📊 Painel CRM & Métricas
          </h2>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', marginTop: '4px' }}>
            Visão geral do funil de vendas, taxa de conversão e desempenho omnichannel.
          </p>
        </div>
        <button onClick={() => fetchMetrics(channel, period)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderRadius: '10px', gap: '15px', flexWrap: 'wrap', border: '1px solid hsl(var(--border) / 0.4)', background: 'rgba(9, 9, 14, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'hsl(var(--text-muted))' }}>Canal:</span>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}
              style={{ background: 'hsl(var(--border) / 0.4)', border: '1px solid hsl(var(--border))', padding: '6px 12px', borderRadius: '6px', fontSize: '12.5px', color: '#fff', cursor: 'pointer', outline: 'none' }}>
              <option value="ALL">Todos os Canais</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="MESSENGER">Messenger</option>
              <option value="WIDGET">Web Widget</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'hsl(var(--text-muted))' }}>Período:</span>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              style={{ background: 'hsl(var(--border) / 0.4)', border: '1px solid hsl(var(--border))', padding: '6px 12px', borderRadius: '6px', fontSize: '12.5px', color: '#fff', cursor: 'pointer', outline: 'none' }}>
              <option value="ALL">Todos os Tempos</option>
              <option value="7D">Últimos 7 dias</option>
              <option value="30D">Últimos 30 dias</option>
            </select>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: '500' }}>
          {loading ? "Sincronizando..." : "Dados atualizados"}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>

        <KpiCard icon={Users} label="Total de Leads" value={metrics.totalLeads} color="#8a2be2" />
        <KpiCard icon={DollarSign} label="Valor do Pipeline" value={`R$ ${metrics.pipelineValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="#00c853" />
        <KpiCard icon={TrendingUp} label="Taxa de Conversão" value={`${metrics.conversionRate}%`} color="#006aff" />
        <KpiCard icon={Clock} label="Tempo Médio (dias)" value={metrics.avgDaysToClose || '—'} color="#f9d423" />
        <KpiCard icon={Target} label="Negócios Ativos" value={metrics.activeDeals} color="#ff6b35" />
        <KpiCard icon={Zap} label="Ganhos (Won)" value={`${metrics.wonCount} — R$ ${metrics.wonValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="#00c853" subtitle />

      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Funnel Visualization */}
        <div className="glass" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} style={{ color: 'hsl(var(--primary))' }} /> Funil de Vendas
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metrics.funnel.map((stage, i) => (
              <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', width: '110px', flexShrink: 0, color: stage.color, textAlign: 'right' }}>
                  {stage.name}
                </span>
                <div style={{ flex: 1, position: 'relative', height: '28px', background: 'hsl(var(--border) / 0.3)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.max((stage.count / maxFunnelCount) * 100, 4)}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)`,
                    borderRadius: '6px',
                    transition: 'width 0.6s ease',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '8px'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {stage.count}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', width: '80px', textAlign: 'right' }}>
                  R$ {stage.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Leads por Canal */}
        <div className="glass" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} style={{ color: 'hsl(var(--primary))' }} /> Leads por Canal
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(metrics.channelCounts).sort((a, b) => b[1] - a[1]).map(([channel, count]) => {
              const chInfo = CHANNEL_ICONS[channel] || CHANNEL_ICONS.MANUAL;
              const IconComp = chInfo.icon;
              const pct = ((count / totalChannelLeads) * 100).toFixed(1);
              return (
                <div key={channel} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${chInfo.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComp size={16} style={{ color: chInfo.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{channel}</span>
                      <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'hsl(var(--border) / 0.3)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: chInfo.color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {Object.keys(metrics.channelCounts).length === 0 && (
            <p style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '12px', padding: '20px' }}>
              Nenhum lead registrado ainda.
            </p>
          )}
        </div>
      </div>

      {/* Omnichannel Inbox & AI Metrics Section */}
      <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: '700', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <MessageSquare size={18} style={{ color: 'hsl(var(--secondary))' }} /> Desempenho de Atendimento & IA
        </h4>
        
        {metrics.conversationStats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>
            
            {/* Total conversations card */}
            <div style={{ background: 'hsl(var(--bg-card) / 0.2)', border: '1px solid hsl(var(--border) / 0.4)', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: '600' }}>Volume de Conversas</span>
                <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: '#fff' }}>{metrics.conversationStats.totalConversations}</h3>
                <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Sessões únicas unificadas</span>
              </div>
              <div style={{ background: 'hsl(var(--secondary) / 0.15)', color: 'hsl(var(--secondary))', padding: '12px', borderRadius: '50%' }}>
                <MessageSquare size={24} />
              </div>
            </div>

            {/* Handover AI vs Human breakdown */}
            <div style={{ background: 'hsl(var(--bg-card) / 0.2)', border: '1px solid hsl(var(--border) / 0.4)', borderRadius: '10px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: '600' }}>Controle de Conversas</span>
                <span style={{ fontSize: '10px', color: 'hsl(var(--secondary))', fontWeight: '700', background: 'hsl(var(--secondary) / 0.15)', padding: '2px 8px', borderRadius: '10px' }}>IA vs Humano</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span>🤖 IA Ativa: <strong>{metrics.conversationStats.aiHandled}</strong> ({metrics.conversationStats.totalConversations > 0 ? ((metrics.conversationStats.aiHandled / metrics.conversationStats.totalConversations) * 100).toFixed(0) : 0}%)</span>
                <span>👤 Humano: <strong>{metrics.conversationStats.humanHandled}</strong> ({metrics.conversationStats.totalConversations > 0 ? ((metrics.conversationStats.humanHandled / metrics.conversationStats.totalConversations) * 100).toFixed(0) : 0}%)</span>
              </div>
              {/* Progress Bar */}
              <div style={{ width: '100%', height: '10px', background: 'hsl(var(--border) / 0.3)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ 
                  width: `${metrics.conversationStats.totalConversations > 0 ? (metrics.conversationStats.aiHandled / metrics.conversationStats.totalConversations) * 100 : 50}%`, 
                  background: 'hsl(var(--primary))', 
                  height: '100%', 
                  transition: 'width 0.6s ease' 
                }} title="IA" />
                <div style={{ 
                  width: `${metrics.conversationStats.totalConversations > 0 ? (metrics.conversationStats.humanHandled / metrics.conversationStats.totalConversations) * 100 : 50}%`, 
                  background: 'hsl(var(--secondary))', 
                  height: '100%', 
                  transition: 'width 0.6s ease' 
                }} title="Humano" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
                <span>Roxo = IA Automatizada</span>
                <span>Ciano = Humano Solicitado</span>
              </div>
            </div>

            {/* Resolution Rate breakdown */}
            <div style={{ background: 'hsl(var(--bg-card) / 0.2)', border: '1px solid hsl(var(--border) / 0.4)', borderRadius: '10px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: '600' }}>Status de Resolução</span>
                <span style={{ fontSize: '10px', color: '#00c853', fontWeight: '700', background: 'rgba(0, 200, 83, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>Taxa de Fim</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span>✅ Resolvidas: <strong>{metrics.conversationStats.resolved}</strong> ({metrics.conversationStats.totalConversations > 0 ? ((metrics.conversationStats.resolved / metrics.conversationStats.totalConversations) * 100).toFixed(0) : 0}%)</span>
                <span>⏳ Pendentes: <strong>{metrics.conversationStats.unresolved}</strong> ({metrics.conversationStats.totalConversations > 0 ? ((metrics.conversationStats.unresolved / metrics.conversationStats.totalConversations) * 100).toFixed(0) : 0}%)</span>
              </div>
              {/* Progress Bar */}
              <div style={{ width: '100%', height: '10px', background: 'hsl(var(--border) / 0.3)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ 
                  width: `${metrics.conversationStats.totalConversations > 0 ? (metrics.conversationStats.resolved / metrics.conversationStats.totalConversations) * 100 : 50}%`, 
                  background: '#00c853', 
                  height: '100%', 
                  transition: 'width 0.6s ease' 
                }} title="Resolvidas" />
                <div style={{ 
                  width: `${metrics.conversationStats.totalConversations > 0 ? (metrics.conversationStats.unresolved / metrics.conversationStats.totalConversations) * 100 : 50}%`, 
                  background: '#ff9800', 
                  height: '100%', 
                  transition: 'width 0.6s ease' 
                }} title="Pendentes" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
                <span>Verde = Resolvidas</span>
                <span>Laranja = Não Resolvidas</span>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', textAlign: 'center', padding: '10px' }}>
            Nenhum dado de conversação disponível para este filtro.
          </div>
        )}
      </div>

      {/* Daily Leads Timeline */}
      <div className="glass" style={{ padding: '24px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={16} style={{ color: 'hsl(var(--primary))' }} /> Novos Leads — Últimos 14 Dias
        </h4>
        {dailyEntries.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '12px', padding: '20px' }}>
            Nenhum dado disponível ainda.
          </p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', paddingTop: '10px' }}>
            {dailyEntries.map(([day, count]) => {
              const h = Math.max((count / maxDaily) * 100, 8);
              const label = day.slice(5); // MM-DD
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#fff' }}>{count}</span>
                  <div style={{
                    width: '100%',
                    maxWidth: '40px',
                    height: `${h}%`,
                    background: 'linear-gradient(180deg, hsl(var(--primary)), hsl(var(--primary) / 0.5))',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.4s ease'
                  }} />
                  <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stage Breakdown Table */}
      <div className="glass" style={{ padding: '24px', overflow: 'hidden' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={16} style={{ color: 'hsl(var(--primary))' }} /> Resumo por Etapa
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(var(--border))', color: 'hsl(var(--text-muted))' }}>
              <th style={{ padding: '10px 8px', textAlign: 'left' }}>Etapa</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>Leads</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>Valor Total</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>% do Pipeline</th>
            </tr>
          </thead>
          <tbody>
            {metrics.funnel.map(stage => (
              <tr key={stage.key} style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
                <td style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color }} />
                  <span style={{ fontWeight: '600' }}>{stage.name}</span>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '700' }}>{stage.count}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', color: 'hsl(var(--secondary))' }}>
                  R$ {stage.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right', color: 'hsl(var(--text-muted))' }}>
                  {metrics.totalLeads > 0 ? ((stage.count / metrics.totalLeads) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="glowing-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ background: `${color}20`, padding: '10px', borderRadius: '10px', color }}>
        <Icon size={22} />
      </div>
      <div>
        <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block' }}>{label}</span>
        <h3 style={{ fontSize: subtitle ? '14px' : '20px', fontWeight: 800, marginTop: '2px', color: subtitle ? color : '#fff' }}>
          {value}
        </h3>
      </div>
    </div>
  );
}

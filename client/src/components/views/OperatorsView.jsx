import React from 'react';

export default function OperatorsView({
  isMobile,
  agents,
  handleCreateAgent,
  newAgentFirstName,
  setNewAgentFirstName,
  newAgentLastName,
  setNewAgentLastName,
  newAgentEmail,
  setNewAgentEmail,
  newAgentPassword,
  setNewAgentPassword,
  newAgentRole,
  setNewAgentRole,
  agentLoading
}) {
  return (
    <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div>
        <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Equipe & Operadores</h3>
        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '12px', marginTop: '2px' }}>
          Controle as permissões de acesso da sua equipe e distribua os chats de suporte e vendas.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: isMobile ? '16px' : '25px', alignItems: 'start' }}>
        
        {/* List of Operators */}
        <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px' }}>Contas de Operadores Ativas</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {agents.map(ag => (
              <div key={ag.id} className="glowing-card" style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', display: 'flex', color: '#000', fontWeight: '800', fontSize: '12px' }}>
                  <span style={{ margin: 'auto' }}>{ag.firstName ? ag.firstName[0].toUpperCase() : 'U'}</span>
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
  );
}

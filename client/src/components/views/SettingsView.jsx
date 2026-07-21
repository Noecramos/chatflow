import React from 'react';
import { Upload, Edit } from 'lucide-react';

export default function SettingsView({
  isMobile,
  organization,
  orgLogo,
  setOrgLogo,
  handleLogoUpload,
  orgName,
  setOrgName,
  companyWebsite,
  setCompanyWebsite,
  customDashboardUrl,
  setCustomDashboardUrl,
  companySummary,
  setCompanySummary,
  geminiKey,
  setGeminiKey,
  handleSaveSettings
}) {
  return (
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

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: '20px', alignItems: 'start', marginTop: '10px' }}>
        
        {/* Left logo card */}
        <div className="glass" style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            <div onClick={handleLogoUpload} style={{ width: '120px', height: '120px', borderRadius: '50%', border: '2px dashed hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)', overflow: 'hidden', cursor: 'pointer' }}>
              {orgLogo ? (
                <img src={orgLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-muted))' }}>
                  <Upload size={24} />
                  <span style={{ fontSize: '10px' }}>Logo</span>
                </div>
              )}
            </div>
            <button onClick={handleLogoUpload} style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#8a2be2', color: '#fff', border: '3px solid #0e0e12', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 3px 12px rgba(138, 43, 226, 0.5)' }}>
              <Edit size={15} />
            </button>
          </div>
          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
            UUID: <code style={{ color: 'hsl(var(--secondary))' }}>{organization?.id || "default"}</code>
          </div>
          {orgLogo && (
            <button onClick={() => { localStorage.removeItem('chatflow_org_logo'); setOrgLogo(null); }} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--destructive))', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}>
              Remover Logo
            </button>
          )}
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
  );
}

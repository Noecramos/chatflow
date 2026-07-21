import React from 'react';
import { FlaskConical, Plus, ToggleRight, ToggleLeft, Copy, Trash2, Play, Save, Terminal } from 'lucide-react';

export default function NoviApiView({
  isMobile,
  customScripts,
  selectedScript,
  handleSelectScript,
  handleCreateScript,
  scriptName,
  setScriptName,
  scriptCode,
  setScriptCode,
  scriptIsActive,
  setScriptIsActive,
  scriptLoading,
  scriptSaving,
  scriptExecuting,
  handleSaveScript,
  handleDeleteScript,
  handleExecuteScript,
  testInput,
  setTestInput,
  testOutput,
  testLogs
}) {
  return (
    <div style={{ padding: '35px', display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Premium Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="pulse-glowing" style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.1))',
            border: '1px solid hsl(var(--primary) / 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px hsl(var(--primary) / 0.2)'
          }}>
            <FlaskConical size={24} style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '30px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: '#fff' }}>NoviAPI</h2>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', marginTop: '3px' }}>
              Crie middlewares dinâmicos e funções Javascript customizadas que rodam em sandbox Node VM.
            </p>
          </div>
        </div>
        
        <div style={{
          background: 'hsl(var(--warning) / 0.15)',
          border: '1px solid hsl(var(--warning) / 0.4)',
          color: 'hsl(var(--warning))',
          padding: '6px 14px',
          fontSize: '11px',
          fontWeight: '700',
          borderRadius: '20px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          🧪 Funcionalidades Experimentais
        </div>
      </div>

      {/* Main split dashboard panel */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '290px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Panel: Seus Códigos */}
        <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>Seus Códigos</h4>
            <button 
              onClick={handleCreateScript} 
              disabled={scriptSaving}
              className="btn-primary" 
              style={{ 
                padding: '6px 12px', 
                fontSize: '11px', 
                borderRadius: '6px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}
            >
              <Plus size={12} /> Novo
            </button>
          </div>

          <div style={{ 
            maxHeight: '520px', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            paddingRight: '2px' 
          }}>
            {customScripts.map(script => {
              const isSelected = selectedScript?.id === script.id;
              return (
                <div 
                  key={script.id}
                  onClick={() => handleSelectScript(script)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: isSelected ? 'hsl(var(--primary) / 0.18)' : 'hsl(var(--border) / 0.2)',
                    border: '1px solid',
                    borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border) / 0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'hsl(var(--border) / 0.5)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                      {script.name}
                    </span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: script.isActive ? '#00c853' : 'hsl(var(--border) / 0.9)',
                      boxShadow: script.isActive ? '0 0 8px #00c853' : 'none'
                    }} title={script.isActive ? 'Ativo' : 'Inativo'} />
                  </div>
                  <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))', fontFamily: 'monospace' }}>
                    {script.id ? script.id.substring(0, 18) : ''}...
                  </span>
                </div>
              );
            })}

            {customScripts.length === 0 && !scriptLoading && (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'hsl(var(--text-muted))', fontSize: '12px' }}>
                Nenhum código criado. Clique em "Novo" para iniciar.
              </div>
            )}

            {scriptLoading && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-muted))', fontSize: '12px' }}>
                Carregando códigos...
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Code Workspace & Terminal Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {selectedScript ? (
            <>
              {/* Workspace glass panel */}
              <div className="glass" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '12px' }}>
                
                {/* Upper Editor Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input 
                      type="text" 
                      value={scriptName} 
                      onChange={(e) => setScriptName(e.target.value)} 
                      placeholder="nome-do-codigo"
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        borderBottom: '1px dashed hsl(var(--border))', 
                        fontSize: '18px', 
                        fontWeight: '800', 
                        color: '#fff', 
                        width: '280px', 
                        padding: '4px 0',
                        outline: 'none'
                      }} 
                    />
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', userSelect: 'none' }}>
                      <input 
                        type="checkbox" 
                        checked={scriptIsActive} 
                        onChange={(e) => setScriptIsActive(e.target.checked)}
                        style={{ display: 'none' }}
                      />
                      {scriptIsActive ? (
                        <ToggleRight size={26} style={{ color: '#00c853' }} />
                      ) : (
                        <ToggleLeft size={26} style={{ color: 'hsl(var(--text-muted))' }} />
                      )}
                      <span style={{ fontWeight: '600', color: scriptIsActive ? '#00c853' : 'hsl(var(--text-muted))' }}>
                        {scriptIsActive ? 'Ativado' : 'Desativado'}
                      </span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(scriptCode);
                        alert("Script copiado para a área de transferência!");
                      }}
                      className="btn-secondary" 
                      style={{ padding: '10px', borderRadius: '8px', display: 'flex', cursor: 'pointer' }}
                      title="Copiar Código"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={handleDeleteScript}
                      disabled={scriptSaving}
                      className="btn-secondary" 
                      style={{ padding: '10px', borderRadius: '8px', display: 'flex', color: 'hsl(var(--danger))', borderColor: 'hsl(var(--danger) / 0.3)', cursor: 'pointer' }}
                      title="Excluir Código"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={handleExecuteScript} 
                      disabled={scriptExecuting}
                      className="btn-primary" 
                      style={{ 
                        background: '#00c853', 
                        border: 'none',
                        color: '#000',
                        boxShadow: '0 0 12px rgba(0, 200, 83, 0.45)', 
                        padding: '10px 18px', 
                        fontSize: '13px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: '800'
                      }}
                    >
                      <Play size={14} fill="#000" /> {scriptExecuting ? 'Executando...' : 'Executar'}
                    </button>
                    <button 
                      onClick={handleSaveScript} 
                      disabled={scriptSaving}
                      className="btn-primary" 
                      style={{ padding: '10px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Save size={14} /> Salvar
                    </button>
                  </div>
                </div>

                {/* Interactive Monospace Code Editor */}
                <div style={{ 
                  display: 'flex', 
                  border: '1px solid hsl(var(--border))', 
                  borderRadius: '8px', 
                  background: '#040406', 
                  overflow: 'hidden', 
                  minHeight: '380px', 
                  fontFamily: '"Fira Code", Consolas, Monaco, monospace', 
                  fontSize: '13px', 
                  lineHeight: '20px' 
                }}>
                  {/* Line numbers column */}
                  <div style={{ 
                    background: '#070709', 
                    borderRight: '1px solid hsl(var(--border) / 0.5)', 
                    padding: '16px 8px', 
                    color: 'hsl(var(--text-muted) / 0.4)', 
                    textAlign: 'right', 
                    userSelect: 'none', 
                    minWidth: '42px' 
                  }}>
                    {(scriptCode || "").split('\n').map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  {/* Code Textarea field */}
                  <textarea
                    value={scriptCode}
                    onChange={(e) => setScriptCode(e.target.value)}
                    placeholder="async (input) => { ... }"
                    spellCheck="false"
                    style={{ 
                      flex: 1, 
                      background: 'transparent', 
                      border: 'none', 
                      color: '#00e5ff', 
                      padding: '16px', 
                      outline: 'none', 
                      resize: 'vertical', 
                      minHeight: '380px', 
                      fontFamily: 'inherit', 
                      fontSize: 'inherit', 
                      lineHeight: 'inherit', 
                      tabSize: '2' 
                    }}
                  />
                </div>
              </div>

              {/* Interactive Execution terminal drawer */}
              <div className="glass" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={18} style={{ color: 'hsl(var(--secondary))' }} /> Testbed & Sandbox Console
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '20px' }}>
                  
                  {/* Column 1: JSON Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>Payload JSON de Entrada</span>
                    <textarea 
                      value={testInput} 
                      onChange={(e) => setTestInput(e.target.value)} 
                      style={{ 
                        width: '100%', 
                        background: '#050508', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '6px', 
                        padding: '10px', 
                        color: 'hsl(var(--secondary))', 
                        fontFamily: 'monospace', 
                        fontSize: '12px', 
                        resize: 'vertical',
                        outline: 'none'
                      }} 
                      rows={6} 
                    />
                  </div>

                  {/* Column 2: captured console logs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>Stdout Logs</span>
                    <div style={{ 
                      flex: 1,
                      width: '100%', 
                      background: '#020204', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '6px', 
                      padding: '10px', 
                      color: '#00ff66', 
                      fontFamily: 'monospace', 
                      fontSize: '11px', 
                      maxHeight: '140px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.4'
                    }}>
                      {testLogs.length === 0 ? (
                        <span style={{ color: 'hsl(var(--text-muted) / 0.5)' }}>[TERMINAL] Aguardando execução do código...</span>
                      ) : (
                        testLogs.map((log, index) => (
                          <div key={index} style={{
                            color: log.startsWith('[ERRO]') || log.startsWith('CRITICAL') ? '#ff1744' : log.startsWith('[INFO]') ? '#00e5ff' : '#00ff66'
                          }}>{log}</div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 3: execution output json */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>Resultado Retornado</span>
                    <div style={{ flex: 1, maxHeight: '140px', overflowY: 'auto' }}>
                      {testOutput ? (
                        <pre style={{ 
                          margin: 0,
                          background: '#050508', 
                          border: '1px solid hsl(var(--border))', 
                          padding: '10px', 
                          borderRadius: '6px', 
                          color: testOutput.error ? '#ff1744' : '#00e5ff', 
                          fontSize: '11px', 
                          overflowX: 'auto',
                          lineHeight: '1.4'
                        }}>
                          {JSON.stringify(testOutput, null, 2)}
                        </pre>
                      ) : (
                        <div style={{ 
                          height: '100%',
                          background: '#050508', 
                          border: '1px solid hsl(var(--border))', 
                          borderRadius: '6px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'hsl(var(--text-muted) / 0.5)',
                          fontSize: '11px'
                        }}>
                          Aguardando retorno...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Developer welcome empty state page */
            <div className="glass" style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', gap: '28px', borderRadius: '12px', alignItems: 'center' }}>
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
                <FlaskConical size={36} style={{ color: 'hsl(var(--primary))' }} />
              </div>
              
              <div style={{ textAlign: 'center', maxWidth: '580px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>Crie Códigos Dinâmicos para a IA</h3>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', marginTop: '8px', lineHeight: '1.6' }}>
                  Personalize o fluxo de atendimento integrando códigos Javascript customizados. Rode consultas a APIs externas, formate dados de clientes e execute lógicas complexas direto nos servidores.
                </p>
              </div>

              <button 
                onClick={handleCreateScript} 
                disabled={scriptSaving}
                className="btn-primary" 
                style={{ padding: '12px 28px', fontSize: '13px', fontWeight: '800', borderRadius: '8px' }}
              >
                {scriptSaving ? 'Criando...' : 'Criar Primeiro Código'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

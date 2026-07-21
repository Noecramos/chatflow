import React from 'react';
import { Database } from 'lucide-react';

export default function KnowledgeBaseView({
  knowledgeSource,
  setKnowledgeSource,
  knowledgeText,
  setKnowledgeText,
  uploadingKnowledge,
  handleUploadKnowledge
}) {
  return (
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
  );
}

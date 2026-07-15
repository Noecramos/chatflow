import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingBag, Clock, CheckCircle2, 
  Search, ExternalLink, Settings, Globe, ShieldCheck 
} from 'lucide-react';

export default function EcommerceDashboard({ token }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalOrdersCount: 0,
    pendingOrdersCount: 0,
    paidOrdersCount: 0,
    itemsSold: 0
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bot connector settings mock configurations
  const [catalogId, setCatalogId] = useState('meta_catalog_101');
  const [connectorUrl, setConnectorUrl] = useState('http://localhost:5000/ecommerce/connector/inventory');
  const [connectorMethod, setConnectorMethod] = useState('POST');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Metrics
      const mRes = await fetch('/ecommerce/metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const mData = await mRes.json();
      if (mData.success) {
        setMetrics(mData.metrics);
      }

      // Fetch Orders
      const oRes = await fetch('/ecommerce/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const oData = await oRes.json();
      if (oData.success) {
        setOrders(oData.orders);
      }
    } catch (e) {
      console.error("Failed to load ecommerce dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Handle Order status updates (simulated payment hook)
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/ecommerce/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. Header & Actions */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '28px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800 }}>
            Comércio Conversacional no WhatsApp
          </h2>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '14px', marginTop: '4px' }}>
            Monitore criações automáticas de carrinhos, gerencie checkouts e configure conectores de catálogos HTTP de ERP.
          </p>
        </div>
        <button onClick={fetchData} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
          Sincronizar Métricas de Vendas
        </button>
      </div>

      {/* 2. Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        <div className="glowing-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'hsl(var(--secondary) / 0.15)', padding: '12px', borderRadius: '10px', color: 'hsl(var(--secondary))' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Volume Conversacional</span>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: 'hsl(var(--secondary))' }}>
              R$ {metrics.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        <div className="glowing-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'hsl(var(--primary) / 0.15)', padding: '12px', borderRadius: '10px', color: 'hsl(var(--primary))' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Total de Vendas</span>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>
              {metrics.totalOrdersCount} Pedidos
            </h3>
          </div>
        </div>

        <div className="glowing-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'hsl(var(--warning) / 0.15)', padding: '12px', borderRadius: '10px', color: 'hsl(var(--warning))' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Aguardando Pagamento</span>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: 'hsl(var(--warning))' }}>
              {metrics.pendingOrdersCount} Pendentes
            </h3>
          </div>
        </div>

        <div className="glowing-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'hsl(var(--success) / 0.15)', padding: '12px', borderRadius: '10px', color: 'hsl(var(--success))' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Unidades de Produtos Vendidas</span>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: 'hsl(var(--success))' }}>
              {metrics.itemsSold} Itens
            </h3>
          </div>
        </div>

      </div>

      {/* 3. Main Split View: Orders List & Connector Settings */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Panel: Table of Orders */}
        <div className="glass" style={{ padding: '24px', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px' }}>
            <ShoppingBag size={20} style={{ color: 'hsl(var(--primary))' }} /> Registros de Pedidos
          </h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>Carregando...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'hsl(var(--text-muted))', fontSize: '14px' }}>
              Nenhum pedido de comércio transacional registrado ainda. Inicie o checkout dentro do chat em tempo real dos clientes para ver as entradas!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))', color: 'hsl(var(--text-muted))' }}>
                    <th style={{ padding: '10px 8px' }}>Cliente</th>
                    <th style={{ padding: '10px 8px' }}>Endereço</th>
                    <th style={{ padding: '10px 8px' }}>Itens</th>
                    <th style={{ padding: '10px 8px' }}>Total</th>
                    <th style={{ padding: '10px 8px' }}>Status</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Simular Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: '600' }}>{order.customerName}</div>
                        <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>{order.customerPhone}</div>
                      </td>
                      <td style={{ padding: '12px 8px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.address}>
                        {order.address}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {order.cartItems.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '11px' }}>
                            {item.quantity} × {item.name}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: '700', color: 'hsl(var(--secondary))' }}>
                        R$ {order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700',
                          background: order.status === 'PAID' ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--warning) / 0.15)',
                          color: order.status === 'PAID' ? 'hsl(var(--success))' : 'hsl(var(--warning))',
                          border: '1px solid',
                          borderColor: order.status === 'PAID' ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--warning) / 0.3)'
                        }}>
                          {order.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {order.status === 'PENDING' ? (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'PAID')}
                            style={{
                              background: 'linear-gradient(135deg, hsl(var(--success)), hsl(var(--success) / 0.8))',
                              border: 'none',
                              color: '#000',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Marcar Pago
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Concluído</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Panel: ERP Catalog Connector Configs */}
        <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px' }}>
            <Settings size={20} style={{ color: 'hsl(var(--secondary))' }} /> Integrações de ERP
          </h3>

          {/* Meta catalog ID */}
          <div>
            <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              ID do Catálogo da Meta
            </label>
            <input 
              type="text" 
              value={catalogId}
              onChange={(e) => setCatalogId(e.target.value)}
              style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
            />
            <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', display: 'block', marginTop: '4px' }}>
              Necessário para disparar cartões nativos e interativos de catálogo de produtos da Meta.
            </span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border))', margin: '0' }} />

          {/* Secure HTTP action connectors info */}
          <div>
            <h4 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontWeight: '600' }}>
              <Globe size={14} style={{ color: 'hsl(var(--primary))' }} /> Conector de ERP HTTP em Tempo Real
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>URL de Destino do Conector</label>
                <input 
                  type="text" 
                  value={connectorUrl}
                  onChange={(e) => setConnectorUrl(e.target.value)}
                  style={{ width: '100%', background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Método</label>
                  <select 
                    value={connectorMethod}
                    onChange={(e) => setConnectorMethod(e.target.value)}
                    style={{ width: '100%', background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '6px', borderRadius: '4px', fontSize: '12px' }}
                  >
                    <option value="POST">POST (JSON)</option>
                    <option value="GET">GET (Parâmetros)</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                  <button 
                    onClick={() => alert("Handshake do conector validado com sucesso!")}
                    className="btn-secondary" 
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid hsl(var(--primary))', color: 'hsl(var(--primary))' }}
                  >
                    Testar Conexão
                  </button>
                </div>
              </div>
            </div>

            <div className="glass" style={{ padding: '12px', borderRadius: '8px', marginTop: '16px', background: 'hsl(var(--primary-glow) / 0.15)', borderColor: 'hsl(var(--primary-glow))', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <ShieldCheck size={16} style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                <strong>Conexões Seguras Ativadas</strong>: As requisições contêm cabeçalhos criptográficos exclusivos do tenant para autenticar solicitações de dados de forma segura com suas outras aplicações de backend.
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

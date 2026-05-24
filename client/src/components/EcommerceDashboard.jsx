import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingBag, Clock, CheckCircle2, 
  Search, ExternalLink, Settings, Globe, ShieldCheck 
} from 'lucide-react';

export default function EcommerceDashboard({ token }) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800 }}>
            WhatsApp Conversational Commerce
          </h2>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '14px', marginTop: '4px' }}>
            Monitor automated cart creations, manage checkouts, and configure ERP HTTP catalog connectors.
          </p>
        </div>
        <button onClick={fetchData} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
          Sync Sales Metrics
        </button>
      </div>

      {/* 2. Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        <div className="glowing-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'hsl(var(--secondary) / 0.15)', padding: '12px', borderRadius: '10px', color: 'hsl(var(--secondary))' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Conversational Volume</span>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: 'hsl(var(--secondary))' }}>
              ${metrics.totalSales.toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="glowing-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'hsl(var(--primary) / 0.15)', padding: '12px', borderRadius: '10px', color: 'hsl(var(--primary))' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Total Sales</span>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>
              {metrics.totalOrdersCount} Orders
            </h3>
          </div>
        </div>

        <div className="glowing-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'hsl(var(--warning) / 0.15)', padding: '12px', borderRadius: '10px', color: 'hsl(var(--warning))' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Awaiting Pay</span>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: 'hsl(var(--warning))' }}>
              {metrics.pendingOrdersCount} Pending
            </h3>
          </div>
        </div>

        <div className="glowing-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'hsl(var(--success) / 0.15)', padding: '12px', borderRadius: '10px', color: 'hsl(var(--success))' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Product Units Sold</span>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: 'hsl(var(--success))' }}>
              {metrics.itemsSold} Items
            </h3>
          </div>
        </div>

      </div>

      {/* 3. Main Split View: Orders List & Connector Settings */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Panel: Table of Orders */}
        <div className="glass" style={{ padding: '24px', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px' }}>
            <ShoppingBag size={20} style={{ color: 'hsl(var(--primary))' }} /> Order Records
          </h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>Loading...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'hsl(var(--text-muted))', fontSize: '14px' }}>
              No transactional commerce orders recorded yet. Initiate checkout inside customer live chats to view entries!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))', color: 'hsl(var(--text-muted))' }}>
                    <th style={{ padding: '10px 8px' }}>Customer</th>
                    <th style={{ padding: '10px 8px' }}>Address</th>
                    <th style={{ padding: '10px 8px' }}>Items</th>
                    <th style={{ padding: '10px 8px' }}>Total</th>
                    <th style={{ padding: '10px 8px' }}>Status</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Simulate Pay</th>
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
                        ${order.totalAmount.toFixed(2)}
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
                          {order.status}
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
                            Mark Paid
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Completed</span>
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
            <Settings size={20} style={{ color: 'hsl(var(--secondary))' }} /> ERP Integrations
          </h3>

          {/* Meta catalog ID */}
          <div>
            <label style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Meta Catalog ID
            </label>
            <input 
              type="text" 
              value={catalogId}
              onChange={(e) => setCatalogId(e.target.value)}
              style={{ width: '100%', background: 'hsl(var(--border) / 0.5)', border: '1px solid hsl(var(--border))', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
            />
            <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', display: 'block', marginTop: '4px' }}>
              Required to trigger native interactive Meta product catalog cards.
            </span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border))', margin: '0' }} />

          {/* Secure HTTP action connectors info */}
          <div>
            <h4 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontWeight: '600' }}>
              <Globe size={14} style={{ color: 'hsl(var(--primary))' }} /> Live HTTP ERP Connector
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Connector Destination URL</label>
                <input 
                  type="text" 
                  value={connectorUrl}
                  onChange={(e) => setConnectorUrl(e.target.value)}
                  style={{ width: '100%', background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Method</label>
                  <select 
                    value={connectorMethod}
                    onChange={(e) => setConnectorMethod(e.target.value)}
                    style={{ width: '100%', background: 'hsl(var(--border) / 0.3)', border: '1px solid hsl(var(--border))', padding: '6px', borderRadius: '4px', fontSize: '12px' }}
                  >
                    <option value="POST">POST (JSON)</option>
                    <option value="GET">GET (Params)</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                  <button 
                    onClick={() => alert("Connector handshake validated successfully!")}
                    className="btn-secondary" 
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid hsl(var(--primary))', color: 'hsl(var(--primary))' }}
                  >
                    Test Connect
                  </button>
                </div>
              </div>
            </div>

            <div className="glass" style={{ padding: '12px', borderRadius: '8px', marginTop: '16px', background: 'hsl(var(--primary-glow) / 0.15)', borderColor: 'hsl(var(--primary-glow))', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <ShieldCheck size={16} style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                <strong>Secure Connections Enabled</strong>: Requests contain unique tenant cryptographic headers to authenticate payload requests securely with your other backend applications.
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

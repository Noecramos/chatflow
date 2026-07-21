import React from 'react';

export function Card({ children, className = '', style = {}, ...props }) {
  return (
    <div 
      className={`glass-panel ${className}`} 
      style={{ 
        padding: '24px', 
        borderRadius: '16px', 
        border: '1px solid var(--border-color)', 
        background: 'var(--card-bg)',
        ...style 
      }} 
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'var(--primary)', trend }) {
  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</span>
        {Icon && (
          <div style={{ padding: '8px', borderRadius: '10px', background: `hsl(var(--primary) / 0.1)`, color: color }}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.5px' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

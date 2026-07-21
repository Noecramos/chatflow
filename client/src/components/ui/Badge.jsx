import React from 'react';

export function Badge({ children, variant = 'default', color, style = {}, className = '' }) {
  const getVariantStyles = () => {
    if (color) {
      return {
        background: `${color}15`,
        color: color,
        border: `1px solid ${color}30`
      };
    }

    switch (variant) {
      case 'success':
        return { background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' };
      case 'warning':
        return { background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' };
      case 'danger':
        return { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'primary':
        return { background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.3)' };
      default:
        return { background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)' };
    }
  };

  return (
    <span 
      className={`badge ${className}`} 
      style={{
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        ...getVariantStyles(),
        ...style
      }}
    >
      {children}
    </span>
  );
}

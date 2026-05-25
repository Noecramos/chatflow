import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("[React Error Boundary Caught]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, #14141d 0%, #08080c 100%)',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '40px',
            borderRadius: '16px',
            maxWidth: '500px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>⚠️</div>
            <h2 style={{
              margin: '0 0 10px 0',
              fontWeight: '700',
              background: 'linear-gradient(to right, #ff4e50, #f9d423)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Algo deu errado</h2>
            <p style={{
              color: '#7f7f9e',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '24px'
            }}>
              Ocorreu um erro inesperado no painel. Tente recarregar a página ou entre em contato com o suporte se o problema persistir.
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #8a2be2 0%, #4a00e0 100%)',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(138, 43, 226, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(138, 43, 226, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(138, 43, 226, 0.4)';
              }}
            >
              Recarregar Painel
            </button>
            {this.state.error && (
              <pre style={{
                marginTop: '24px',
                padding: '12px',
                background: '#060609',
                border: '1px solid #1c1c24',
                borderRadius: '6px',
                color: '#ff4e50',
                fontSize: '11px',
                textAlign: 'left',
                overflowX: 'auto',
                maxHeight: '150px'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

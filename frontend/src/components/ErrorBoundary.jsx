import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 24, color: '#fca5a5', background: '#1a1a25',
          fontFamily: 'monospace', minHeight: '100vh',
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: 12, fontFamily: 'inherit' }}>
            ⚠️ Something broke
          </h2>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            {this.state.error.toString()}
          </div>
          <pre style={{
            background: '#0a0a0f', padding: 16, borderRadius: 8,
            overflow: 'auto', fontSize: 12, whiteSpace: 'pre-wrap',
            border: '1px solid #2a2a3a',
          }}>
            {this.state.info?.componentStack || this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16, padding: '10px 20px', borderRadius: 8,
              background: '#7c6af7', color: 'white', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

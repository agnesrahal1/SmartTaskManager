import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: '#1a2e1a', border: '#69db7c', color: '#69db7c' },
    error: { bg: '#2e1a1a', border: '#ff6b6b', color: '#ff6b6b' },
    info: { bg: '#1a1a2e', border: '#7F77DD', color: '#7F77DD' }
  };

  const c = colors[type];

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.color, padding: '12px 20px', borderRadius: '12px',
      fontSize: '14px', fontWeight: '500', zIndex: 9999,
      animation: 'slideIn 0.3s ease', boxShadow: `0 4px 24px ${c.border}33`
    }}>
      {message}
    </div>
  );
}
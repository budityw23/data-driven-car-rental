import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 0', marginTop: 'auto', backgroundColor: 'var(--bg-card)' }}>
      <div className="container" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <p className="text-sm">&copy; {new Date().getFullYear()} Data-Driven Car Rental. Built for Portfolio.</p>
      </div>
    </footer>
  );
};

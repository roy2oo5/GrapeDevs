import React from 'react';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="main-content" style={{ padding: 0 }}>
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          Singularity Full-Stack Template • Built with <Heart size={14} fill="#f43f5e" color="#f43f5e" /> using ReactJS & FastAPI
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
          Repository: <a href="https://github.com/roy2oo5/GrapeDevs" target="_blank" rel="noopener noreferrer">roy2oo5/GrapeDevs</a>
        </p>
      </div>
    </footer>
  );
}

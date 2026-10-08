import React from 'react';
import { Layers, Server, Sparkles, Github } from 'lucide-react';

export function Navbar({ backendStatus }) {
  const getStatusBadge = () => {
    switch (backendStatus) {
      case 'online':
        return (
          <span className="status-badge">
            <span className="status-dot status-online"></span>
            FastAPI Connected
          </span>
        );
      case 'offline':
        return (
          <span className="status-badge">
            <span className="status-dot status-offline"></span>
            FastAPI Offline
          </span>
        );
      default:
        return (
          <span className="status-badge">
            <span className="status-dot status-connecting"></span>
            Checking API...
          </span>
        );
    }
  };

  return (
    <nav className="navbar">
      <a href="#" className="logo-container">
        <div className="logo-icon">
          <Layers size={22} />
        </div>
        <span>Singularity</span>
      </a>

      <ul className="nav-links">
        <li>
          <a href="#features" className="nav-item">
            <Sparkles size={16} /> Features
          </a>
        </li>
        <li>
          <a href="#api-explorer" className="nav-item">
            <Server size={16} /> API Explorer
          </a>
        </li>
        <li>{getStatusBadge()}</li>
        <li>
          <a
            href="https://github.com/roy2oo5/GrapeDevs"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item"
            title="GitHub Repository"
          >
            <Github size={20} />
          </a>
        </li>
      </ul>
    </nav>
  );
}

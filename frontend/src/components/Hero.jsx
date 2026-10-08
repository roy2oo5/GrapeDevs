import React from 'react';
import { Zap, ArrowRight, Code2 } from 'lucide-react';

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-tag">
        <Zap size={14} /> Full-Stack Starter Template
      </div>

      <h1 className="hero-title">
        Build Next-Gen Web Apps with <br />
        <span className="gradient-text">ReactJS</span> & <span className="gradient-text-purple">FastAPI</span>
      </h1>

      <p className="hero-subtitle">
        A production-grade, modular full-stack architecture pre-configured with Vite, 
        FastAPI async endpoints, CORS middleware, and automated documentation.
      </p>

      <div className="hero-actions">
        <a href="#api-explorer" className="btn btn-primary">
          Explore Live API <ArrowRight size={18} />
        </a>
        <a 
          href="http://localhost:8000/docs" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-secondary"
        >
          <Code2 size={18} /> Swagger Docs
        </a>
      </div>
    </section>
  );
}

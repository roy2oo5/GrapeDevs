import React from 'react';
import { ShieldCheck, Cpu, Zap, Layers, Globe, Workflow } from 'lucide-react';

export function Features() {
  const featureList = [
    {
      icon: <Zap size={24} />,
      title: "Lightning-Fast Vite React",
      desc: "Instant HMR, lightweight bundling, modern React 19 structure for smooth client performance."
    },
    {
      icon: <Cpu size={24} />,
      title: "Asynchronous FastAPI",
      desc: "High-performance Python backend powered by Starlette & Pydantic with automated OpenAPI docs."
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Pre-Configured CORS",
      desc: "Cross-Origin Resource Sharing enabled out of the box for secure local and production deployment."
    },
    {
      icon: <Layers size={24} />,
      title: "Modular Architecture",
      desc: "Clean separation of frontend components, service layers, backend schemas, and routers."
    },
    {
      icon: <Globe size={24} />,
      title: "Docker-Ready Template",
      desc: "Includes docker-compose configuration to launch both ReactJS and FastAPI with one command."
    },
    {
      icon: <Workflow size={24} />,
      title: "ML Pipeline Ready",
      desc: "Dedicated machine learning folder structure ready to serve models over FastAPI endpoints."
    }
  ];

  return (
    <section id="features" style={{ marginTop: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2>Architectural Highlights</h2>
        <p className="feature-desc">Engineered for speed, scalability, and seamless full-stack developer experience</p>
      </div>

      <div className="features-grid">
        {featureList.map((f, i) => (
          <div key={i} className="glass-card">
            <div className="feature-icon">{f.icon}</div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

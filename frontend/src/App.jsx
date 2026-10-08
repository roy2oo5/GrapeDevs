import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { ApiTester } from './components/ApiTester';
import { Footer } from './components/Footer';

export default function App() {
  const [backendStatus, setBackendStatus] = useState('connecting');

  return (
    <div className="app-container">
      {/* Background Glow Mesh */}
      <div className="bg-mesh">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <Navbar backendStatus={backendStatus} />

      <main className="main-content">
        <Hero />
        <Features />
        <ApiTester onStatusChange={setBackendStatus} />
      </main>

      <Footer />
    </div>
  );
}

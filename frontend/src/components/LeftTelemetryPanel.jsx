import React, { useState, useEffect } from 'react';

const BRAND_IMG_SRC = "https://lh3.googleusercontent.com/aida/AEtjO1WHTBT3X-7KAuiEYhg8o191c0Agq-hrf7gAI1COQPFg5JOGBeV4jQbDsqTDiCqt66EaETaCLkHo8wb1ESh17ZdiiImxvd8B4DIe7clieu7BRNCXTo8T9CGkICy8HKBXflMnmjfn_tJhrXOUM3FUf_x5YY3EBqDvlxw6-A68ouZ2VPJFRFjeogXDdlxnXqbPhhdMyxZ-pYT5ZWCE9PHbwPn2Zo34zpnVOPPo_Wmh9_8q";

export function LeftTelemetryPanel() {
  const [imageError, setImageError] = useState(false);
  const [latency, setLatency] = useState(14);

  // Subtle telemetry pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = prev + delta;
        return next >= 10 && next <= 22 ? next : 14;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="lg:w-[46%] bg-inverse-surface text-inverse-on-surface p-space-lg lg:p-space-xl flex flex-col justify-between relative overflow-hidden select-none">
      {/* Ambient Decorative Clinical Halos */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-tertiary/15 blur-3xl pointer-events-none"></div>

      {/* Top Section: Header & Live Beacon */}
      <div className="relative z-10 space-y-space-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            {!imageError ? (
              <img
                alt="PulseGrid Brand Mark"
                className="w-9 h-9 rounded-lg object-contain bg-surface-container-lowest/10 p-1 backdrop-blur-md ring-1 ring-white/10"
                src={BRAND_IMG_SRC}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-surface-container-lowest/10 p-1 backdrop-blur-md ring-1 ring-white/10 flex items-center justify-center text-primary-fixed">
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-surface-container-lowest tracking-tight leading-none font-semibold">
                PulseGrid
              </span>
              <span className="font-label-sm text-label-sm text-surface-variant/70 tracking-wider uppercase mt-1 font-medium">
                Node Sec-09
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest/10 backdrop-blur-md border border-white/10 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-fixed opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary-fixed"></span>
            </span>
            <span className="font-label-sm text-label-sm text-surface-container-lowest tracking-wide font-medium">
              LIVE SYNC
            </span>
          </div>
        </div>

        {/* Headline & Value Prop */}
        <div className="space-y-space-sm pt-2">
          <span className="font-label-sm text-label-sm tracking-widest text-primary-fixed uppercase font-semibold block">
            Epidemic Defense &amp; Logistics
          </span>
          <h1 className="font-headline-xl text-headline-xl text-surface-container-lowest tracking-tight leading-tight font-semibold">
            Predictive inventory, zero-stockout allocation.
          </h1>
          <p className="font-body-md text-body-md text-surface-variant/80 pt-1 leading-relaxed">
            Empowering regional healthcare networks with bio-surveillance signal detection, demand surge modeling, and algorithmic stock redistribution.
          </p>
        </div>

        {/* Capability Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest/10 backdrop-blur-md text-surface-container-lowest font-label-md text-label-md border border-white/5 transition-colors hover:bg-surface-container-lowest/15">
            <span className="material-symbols-outlined text-[15px] text-primary-fixed">vital_signs</span>
            <span>Outbreak Spike Detection</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest/10 backdrop-blur-md text-surface-container-lowest font-label-md text-label-md border border-white/5 transition-colors hover:bg-surface-container-lowest/15">
            <span className="material-symbols-outlined text-[15px] text-tertiary-fixed">update</span>
            <span>Expiry-Aware Redistribution</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest/10 backdrop-blur-md text-surface-container-lowest font-label-md text-label-md border border-white/5 transition-colors hover:bg-surface-container-lowest/15">
            <span className="material-symbols-outlined text-[15px] text-primary-fixed">verified</span>
            <span>Reconciliation Audit Log</span>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Real-Time Telemetry Card */}
      <div className="relative z-10 mt-space-lg pt-space-md">
        <div className="p-space-md rounded-2xl bg-surface-container-lowest/10 backdrop-blur-xl space-y-3 border border-white/10 shadow-inner">
          <div className="flex items-center justify-between font-label-sm text-label-sm">
            <span className="text-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-tertiary-fixed animate-pulse">sensors</span>
              System Telemetry Status
            </span>
            <span className="text-tertiary-fixed font-semibold tracking-wide">
              Operational • {latency}ms
            </span>
          </div>

          {/* Mini SVG Telemetry Sparkline */}
          <div className="h-10 w-full flex items-center justify-between gap-1 overflow-hidden">
            <svg className="w-full h-9 stroke-primary-fixed fill-none" viewBox="0 0 260 36">
              <defs>
                <linearGradient id="gridSpark" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#93ccff" stopOpacity="0.4"></stop>
                  <stop offset="100%" stopColor="#93ccff" stopOpacity="0.0"></stop>
                </linearGradient>
              </defs>
              <path
                d="M0,28 L20,24 L45,26 L65,12 L85,22 L110,18 L135,26 L155,7 L175,20 L195,14 L220,19 L240,8 L260,16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
              ></path>
              <path
                d="M0,28 L20,24 L45,26 L65,12 L85,22 L110,18 L135,26 L155,7 L175,20 L195,14 L220,19 L240,8 L260,16 L260,36 L0,36 Z"
                fill="url(#gridSpark)"
              ></path>
            </svg>
          </div>

          <div className="flex items-center justify-between text-surface-container-highest font-label-sm text-label-sm pt-1 border-t border-white/5">
            <span className="flex items-center gap-1 text-surface-variant/90">
              <span className="material-symbols-outlined text-[13px] text-primary-fixed">domain</span>
              6 Facilities Active
            </span>
            <span className="text-surface-container-lowest font-medium">
              1,420 Monitored SKUs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

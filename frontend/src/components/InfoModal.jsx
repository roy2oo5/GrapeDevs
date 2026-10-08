import React, { useState } from 'react';

export function InfoModal({ modalType, onClose }) {
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  if (!modalType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low/50">
          <div className="flex items-center gap-2 text-primary font-semibold">
            {modalType === 'reset' && (
              <>
                <span className="material-symbols-outlined text-[22px]">key</span>
                <span className="font-headline-sm text-base text-on-surface">Terminal Access Key Recovery</span>
              </>
            )}
            {modalType === 'sso' && (
              <>
                <span className="material-symbols-outlined text-[22px]">local_hospital</span>
                <span className="font-headline-sm text-base text-on-surface">Institutional SSO Provider</span>
              </>
            )}
            {modalType === 'terms' && (
              <>
                <span className="material-symbols-outlined text-[22px]">gavel</span>
                <span className="font-headline-sm text-base text-on-surface">PulseGrid Protocol Terms</span>
              </>
            )}
            {modalType === 'audit' && (
              <>
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
                <span className="font-headline-sm text-base text-on-surface">Cryptographic Audit Report</span>
              </>
            )}
            {modalType === 'telemetry' && (
              <>
                <span className="material-symbols-outlined text-[22px]">vital_signs</span>
                <span className="font-headline-sm text-base text-on-surface">Node Incident Telemetry</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-on-surface text-sm space-y-4">
          {modalType === 'reset' && (
            <div>
              {!resetSent ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setResetSent(true);
                  }}
                  className="space-y-4"
                >
                  <p className="text-secondary leading-relaxed">
                    Enter your authorized institutional email. A cryptographic challenge token will be transmitted to your registered hardware key or secure director inbox.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
                      Official Institutional Email
                    </label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="admin@metropolitan-health.org"
                      className="w-full h-11 px-3 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-secondary hover:bg-surface-container font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold shadow-md hover:bg-primary-container"
                    >
                      Send Challenge
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-tertiary-container/20 text-tertiary flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
                  </div>
                  <h4 className="font-semibold text-base text-on-surface">Recovery Challenge Transmitted</h4>
                  <p className="text-xs text-secondary leading-relaxed max-w-sm mx-auto">
                    Verification payload dispatched to <span className="font-semibold text-on-surface">{resetEmail || 'registered inbox'}</span>. Please verify via your FIPS Hardware Token within 15 minutes.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-2 px-6 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}

          {modalType === 'sso' && (
            <div className="space-y-3">
              <p className="text-secondary leading-relaxed">
                PulseGrid connects directly to your hospital network’s SAML 2.0 / OpenID Connect Identity Federation:
              </p>
              <div className="space-y-2 pt-1">
                {[
                  { name: 'Metro Health Unified Federation', cert: 'SAML 2.0 • Active' },
                  { name: 'Kaiser Regional Health Directory', cert: 'OIDC • OAuth 2.0' },
                  { name: 'NHS Digital Care Identity Service', cert: 'FIDO2 / PKI' },
                  { name: 'Veterans Health Admin Portal', cert: 'CAC / PIV Enforced' },
                ].map((org, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      alert(`Initiating SAML handshake with ${org.name}...`);
                      onClose();
                    }}
                    className="w-full p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-left transition-colors border border-surface-container-high/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-[20px]">domain</span>
                      <div>
                        <div className="font-semibold text-on-surface text-xs">{org.name}</div>
                        <div className="text-[11px] text-secondary">{org.cert}</div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {modalType === 'terms' && (
            <div className="space-y-3 text-secondary text-xs leading-relaxed max-h-72 overflow-y-auto pr-1">
              <h4 className="font-semibold text-on-surface text-sm">Mutual Aid Redistribution Protocol</h4>
              <p>
                By connecting a healthcare terminal to PulseGrid AI, participating facilities agree to multi-lateral stock reallocation guidelines during designated epidemic emergencies and severe supply chain stress events.
              </p>
              <h4 className="font-semibold text-on-surface text-sm">Privacy &amp; Data Boundary</h4>
              <p>
                All batch inventories, lot numbers, and facility consumption logs are partitioned behind zero-knowledge encryption barriers. No protected health information (PHI) is transmitted or stored.
              </p>
              <h4 className="font-semibold text-on-surface text-sm">Auditability</h4>
              <p>
                Every transfer recommendation, acceptance signature, and route optimization is permanently written to an immutable cryptographic audit ledger conforming to FIPS 140-3 requirements.
              </p>
            </div>
          )}

          {modalType === 'audit' && (
            <div className="space-y-3 text-secondary text-xs leading-relaxed">
              <div className="p-3 rounded-xl bg-surface-container-low font-mono text-[11px] space-y-1">
                <div><span className="text-outline">CERT-ID:</span> SEC-2025-PULSE-89104</div>
                <div><span className="text-outline">STANDARDS:</span> SOC2 Type II, HIPAA, FIPS 140-3 L3</div>
                <div><span className="text-outline">CIPHER SUITE:</span> TLS_AES_256_GCM_SHA384</div>
                <div><span className="text-outline">SIGNATURE:</span> SHA256:7f83b1657ff1fc53b92dc18148a1d65b</div>
              </div>
              <p>
                Audit verification performed continuously by independent third-party automated compliance agents. Last full attestation completed 04 hours ago.
              </p>
            </div>
          )}

          {modalType === 'telemetry' && (
            <div className="space-y-3 text-secondary text-xs leading-relaxed">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <div className="text-xl font-semibold text-tertiary">99.998%</div>
                  <div className="text-[11px] text-secondary mt-1">Network Availability</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <div className="text-xl font-semibold text-primary">14 ms</div>
                  <div className="text-[11px] text-secondary mt-1">P95 Grid Latency</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <div className="text-xl font-semibold text-on-surface">6 Active</div>
                  <div className="text-[11px] text-secondary mt-1">Regional Nodes</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <div className="text-xl font-semibold text-on-surface">0 Outages</div>
                  <div className="text-[11px] text-secondary mt-1">Last 90 Days</div>
                </div>
              </div>
              <p className="pt-1">
                Telemetry streams are cryptographically signed at origin hardware boundaries and routed via isolated regional backbones.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-surface-container-low/50 border-t border-surface-container flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

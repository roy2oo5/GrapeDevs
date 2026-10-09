import React, { useState } from 'react';
import { loginHospital, registerHospital } from '../services/api';

export function AuthFormPanel({ onLoginSuccess, onRegisterSuccess }) {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'register'

  // Sign In State
  const [signinAdminId, setSigninAdminId] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [signinStatus, setSigninStatus] = useState('idle'); // 'idle' | 'verifying' | 'authenticated'

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regHospitalName, setRegHospitalName] = useState('');
  const [regClassification, setRegClassification] = useState('tertiary');
  const [regNodeRole, setRegNodeRole] = useState('pharmacy'); // 'pharmacy' | 'coordinator' | 'logistics'
  const [regAdminId, setRegAdminId] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [registerStatus, setRegisterStatus] = useState('idle'); // 'idle' | 'verifying' | 'submitted'
  const [formError, setFormError] = useState('');
  const [authNotification, setAuthNotification] = useState(null);

  // Handle Sign In Submission
  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSigninStatus('verifying');
    try {
      const session = await loginHospital({
        hospital_administrator_id: signinAdminId.trim(),
        terminal_access_key: signinPassword,
      });
      setSigninStatus('authenticated');
      setAuthNotification({
        type: 'success',
        title: 'Hospital Login Successful',
        message: `Secure session opened for ${session.hospital_name}.`,
      });
      onLoginSuccess?.(session);
    } catch (error) {
      setFormError(error.message || 'Unable to sign in to this hospital.');
      setSigninStatus('idle');
    }
  };

  // Handle Register Submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (regPass.length < 8) {
      setFormError('Security policy requires access keys to be at least 8 characters long.');
      return;
    }

    if (regPass !== regPassConfirm) {
      setFormError('Terminal Access Keys do not match. Please verify.');
      return;
    }

    setRegisterStatus('verifying');
    try {
      const registrationData = await registerHospital({
        hospital_name: regHospitalName.trim(),
        administrator_name: regName.trim(),
        administrator_email: regEmail.trim(),
        classification: regClassification,
        node_role: regNodeRole,
        hospital_administrator_id: regAdminId.trim(),
        terminal_access_key: regPass,
      });
      setRegisterStatus('submitted');
      setAuthNotification({
        type: 'success',
        title: 'Hospital Registered',
        message: `${registrationData.hospital_name} is registered. Sign in with ${registrationData.hospital_administrator_id} to continue.`,
      });
      onRegisterSuccess?.(registrationData);
      setSigninAdminId(regAdminId.trim());
      setSigninPassword('');
      setActiveTab('signin');
      setTimeout(() => {
        setRegisterStatus('idle');
      }, 2500);
    } catch (error) {
      setFormError(error.message || 'Unable to register this hospital.');
      setRegisterStatus('idle');
    }
  };

  return (
    <div className="lg:w-[54%] p-space-lg lg:p-space-xl flex flex-col justify-between bg-surface-container-lowest">
      <div>
        {/* Mode Switcher Segmented Bar */}
        <div className="w-full flex justify-center mb-space-lg">
          <div className="inline-flex p-1 rounded-full bg-surface-container-high w-full max-w-sm shadow-inner">
            <button
              id="tab-signin"
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setFormError('');
              }}
              className={`flex-1 py-2 rounded-full font-label-lg text-label-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                  : 'text-secondary hover:text-on-surface font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
              <span>Sign In</span>
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setActiveTab('register');
                setFormError('');
              }}
              className={`flex-1 py-2 rounded-full font-label-lg text-label-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                  : 'text-secondary hover:text-on-surface font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              <span>Register Hospital</span>
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {authNotification && (
          <div className="mb-4 p-3.5 rounded-xl bg-tertiary-fixed/40 border border-tertiary text-on-surface flex items-start gap-2.5 animate-fadeIn">
            <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">
              check_circle
            </span>
            <div className="flex-1 text-sm">
              <div className="font-semibold text-tertiary">{authNotification.title}</div>
              <div className="text-on-surface-variant text-xs mt-0.5">{authNotification.message}</div>
            </div>
            <button
              type="button"
              onClick={() => setAuthNotification(null)}
              className="text-on-surface-variant hover:text-on-surface text-xs p-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Error banner */}
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}

        {/* VIEW 1: SIGN IN FORM */}
        {activeTab === 'signin' && (
          <div className="transition-opacity duration-200" id="signin-view">
            <div className="mb-space-lg">
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                Hospital Login
              </h2>
              <p className="font-body-md text-body-md text-secondary mt-1">
                Sign in to manage your hospital’s medicine and transfers.
              </p>
            </div>

            <form className="space-y-space-md" onSubmit={handleSigninSubmit}>
              {/* Hospital Administrator ID */}
              <div className="space-y-1.5">
                <label
                  className="block font-label-md text-label-md text-on-surface font-semibold"
                  htmlFor="signin-email"
                >
                  Hospital Administrator ID
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
                    badge
                  </span>
                  <input
                    id="signin-email"
                    type="text"
                    required
                    value={signinAdminId}
                    onChange={(e) => setSigninAdminId(e.target.value)}
                    placeholder="HOSP-ADMIN-0042"
                    className="w-full h-12 pl-11 pr-4 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl shadow-[inset_0_2px_4px_rgba(25,28,30,0.03)] placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="block font-label-md text-label-md text-on-surface font-semibold"
                    htmlFor="signin-password"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
                    key
                  </span>
                  <input
                    id="signin-password"
                    type={showSigninPassword ? 'text' : 'password'}
                    required
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full h-12 pl-11 pr-11 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl shadow-[inset_0_2px_4px_rgba(25,28,30,0.03)] placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary/20"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowSigninPassword(!showSigninPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors focus:outline-none p-1 flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showSigninPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                aria-label="Sign in"
                disabled={signinStatus !== 'idle'}
                className="w-full h-12 mt-2 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl shadow-[0_4px_16px_rgba(0,97,148,0.25)] hover:shadow-[0_6px_20px_rgba(0,97,148,0.35)] active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 font-semibold cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
              >
                {signinStatus === 'verifying' ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                    <span>Signing in…</span>
                  </>
                ) : signinStatus === 'authenticated' ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Authenticated</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

          </div>
        )}

        {/* VIEW 2: REGISTER HOSPITAL FORM */}
        {activeTab === 'register' && (
          <div className="transition-opacity duration-200" id="register-view">
            <div className="mb-space-md">
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                Join Network
              </h2>
              <p className="font-body-md text-body-md text-secondary mt-1">
                Register your hospital and create its first administrator login.
              </p>
            </div>

            <form className="space-y-space-sm" onSubmit={handleRegisterSubmit}>
              {/* 2-Col: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                <div className="space-y-1">
                  <label
                    className="block font-label-md text-label-md text-on-surface font-semibold"
                    htmlFor="reg-name"
                  >
                    Hospital Administrator Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl shadow-[inset_0_2px_4px_rgba(25,28,30,0.03)] placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="block font-label-md text-label-md text-on-surface font-semibold"
                    htmlFor="reg-email"
                  >
                    Official Email
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.vance@metrohealth.org"
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl shadow-[inset_0_2px_4px_rgba(25,28,30,0.03)] placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary/20"
                  />
                </div>
              </div>

              {/* Hospital Name & Classification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                <div className="space-y-1">
                  <label
                    className="block font-label-md text-label-md text-on-surface font-semibold"
                    htmlFor="reg-hospital"
                  >
                    Hospital Name
                  </label>
                  <input
                    id="reg-hospital"
                    type="text"
                    required
                    value={regHospitalName}
                    onChange={(e) => setRegHospitalName(e.target.value)}
                    placeholder="North District General Hospital"
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl shadow-[inset_0_2px_4px_rgba(25,28,30,0.03)] placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="block font-label-md text-label-md text-on-surface font-semibold"
                    htmlFor="reg-classification"
                  >
                    Hospital Classification
                  </label>
                  <div className="relative">
                    <select
                      id="reg-classification"
                      required
                      value={regClassification}
                      onChange={(e) => setRegClassification(e.target.value)}
                      className="w-full h-10 px-3 pr-8 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl appearance-none shadow-[inset_0_2px_4px_rgba(25,28,30,0.03)] focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer border border-transparent focus:border-primary/20"
                    >
                      <option value="tertiary">Tertiary Center (500+ beds)</option>
                      <option value="secondary">District General Hospital</option>
                      <option value="clinic">Community Care Clinic</option>
                      <option value="depot">Regional Strategic Stockpile</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  className="block font-label-md text-label-md text-on-surface font-semibold"
                  htmlFor="reg-admin-id"
                >
                  Hospital Administrator ID
                </label>
                <input
                  id="reg-admin-id"
                  type="text"
                  required
                  minLength={3}
                  maxLength={80}
                  value={regAdminId}
                  onChange={(e) => setRegAdminId(e.target.value)}
                  placeholder="HOSP-ADMIN-0042"
                  className="w-full h-10 px-3 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl border border-transparent focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Hospital Administrator Role */}
              <div className="space-y-1.5 pt-1">
                <label className="block font-label-md text-label-md text-on-surface font-semibold">
                  Operational Node Function
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="node-role"
                      value="pharmacy"
                      checked={regNodeRole === 'pharmacy'}
                      onChange={() => setRegNodeRole('pharmacy')}
                      className="peer sr-only"
                    />
                    <div className="p-2 rounded-xl bg-surface-container-low text-center peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed border border-transparent peer-checked:border-primary/20 transition-all text-ellipsis overflow-hidden">
                      <span className="material-symbols-outlined text-[18px] block mb-0.5">
                        medication
                      </span>
                      <span className="font-label-sm text-label-sm font-semibold truncate block">
                        Pharmacy
                      </span>
                    </div>
                  </label>

                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="node-role"
                      value="coordinator"
                      checked={regNodeRole === 'coordinator'}
                      onChange={() => setRegNodeRole('coordinator')}
                      className="peer sr-only"
                    />
                    <div className="p-2 rounded-xl bg-surface-container-low text-center peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed border border-transparent peer-checked:border-primary/20 transition-all text-ellipsis overflow-hidden">
                      <span className="material-symbols-outlined text-[18px] block mb-0.5">
                        health_and_safety
                      </span>
                      <span className="font-label-sm text-label-sm font-semibold truncate block">
                        District Health
                      </span>
                    </div>
                  </label>

                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="node-role"
                      value="logistics"
                      checked={regNodeRole === 'logistics'}
                      onChange={() => setRegNodeRole('logistics')}
                      className="peer sr-only"
                    />
                    <div className="p-2 rounded-xl bg-surface-container-low text-center peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed border border-transparent peer-checked:border-primary/20 transition-all text-ellipsis overflow-hidden">
                      <span className="material-symbols-outlined text-[18px] block mb-0.5">
                        local_shipping
                      </span>
                      <span className="font-label-sm text-label-sm font-semibold truncate block">
                        Logistics
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-1">
                <div className="space-y-1">
                  <label
                    className="block font-label-md text-label-md text-on-surface font-semibold"
                    htmlFor="reg-pass"
                  >
                    Set Password
                  </label>
                  <div className="relative">
                    <input
                      id="reg-pass"
                      type={showRegPass ? 'text' : 'password'}
                      required
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      placeholder="Min 12 chars"
                      className="w-full h-10 px-3 pr-9 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl shadow-[inset_0_2px_4px_rgba(25,28,30,0.03)] focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 focus:outline-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showRegPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    className="block font-label-md text-label-md text-on-surface font-semibold"
                    htmlFor="reg-pass-confirm"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="reg-pass-confirm"
                    type={showRegPass ? 'text' : 'password'}
                    required
                    value={regPassConfirm}
                    onChange={(e) => setRegPassConfirm(e.target.value)}
                    placeholder="Repeat key"
                    className="w-full h-10 px-3 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl shadow-[inset_0_2px_4px_rgba(25,28,30,0.03)] focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary transition-all border border-transparent focus:border-primary/20"
                  />
                </div>
              </div>

              {/* Authority Approval Notice */}
              <div className="p-3 rounded-xl bg-secondary-container/50 flex items-start gap-2.5 mt-2 border border-secondary-container">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                  shield
                </span>
                <p className="font-label-sm text-label-sm text-on-secondary-container leading-relaxed font-medium">
                  This creates the hospital and its first administrator account. The terminal access key is stored as a secure hash.
                </p>
              </div>

              {/* Submit Registration */}
              <button
                type="submit"
                disabled={registerStatus !== 'idle'}
                className="w-full h-11 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl shadow-[0_4px_16px_rgba(0,97,148,0.25)] hover:shadow-[0_6px_20px_rgba(0,97,148,0.35)] active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 font-semibold mt-3 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
              >
                {registerStatus === 'verifying' ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                    <span>Registering Hospital...</span>
                  </>
                ) : registerStatus === 'submitted' ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
                    <span>Hospital Registered</span>
                  </>
                ) : (
                  <>
                    <span>Create Hospital Account</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Persistent Compliance & Cryptographic Footnote */}
      <div className="pt-space-md mt-space-md flex flex-col sm:flex-row items-center justify-between text-outline font-label-sm text-label-sm gap-2 border-t border-surface-container-high/60">
        <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
          256-bit TLS Hardware Encrypted
        </span>
        <span className="text-on-surface-variant">SOC2 Type II • HIPAA Compliant</span>
      </div>
    </div>
  );
}

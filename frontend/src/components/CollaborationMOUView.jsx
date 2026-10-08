import React, { useEffect, useMemo, useState } from 'react';
import {
  createAgreement,
  fetchAgreements,
  fetchCurrentHospital,
  fetchHospitals,
  updateAgreementStatus,
} from '../services/api';

function formatDate(value) {
  if (!value) return 'No expiry date';
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function statusLabel(status) {
  return status === 'archived' ? 'Revoked' : status === 'rejected' ? 'Declined' : status;
}

const STANDARD_MOU_TERMS = [
  'Surplus sharing is non-commercial and subject to availability; this MOU does not guarantee supply, purchase, or delivery.',
  'Every transfer requires a separate request and approval by the releasing hospital.',
  'Supplies must be unopened, authentic, within expiry, and stored and transported according to manufacturer instructions.',
  'The receiving hospital arranges collection and reasonable transport costs unless otherwise agreed for a specific transfer.',
  'Each hospital remains responsible for licensing, patient safety, privacy, and regulatory compliance. No patient-identifying information may be shared.',
  'Either hospital may revoke the MOU. Revocation does not automatically cancel an already approved transfer.',
  'Hospital administrators will first resolve disputes in good faith and document corrective action.',
];

export function CollaborationMOUView({ onToast }) {
  const [agreements, setAgreements] = useState([]);
  const [partnerHospitals, setPartnerHospitals] = useState([]);
  const [currentHospital, setCurrentHospital] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [agreementRecords, hospitals, hospital] = await Promise.all([
        fetchAgreements(),
        fetchHospitals(),
        fetchCurrentHospital(),
      ]);
      setAgreements(agreementRecords);
      setPartnerHospitals(hospitals.filter((candidate) => candidate.id !== hospital.id));
      setCurrentHospital(hospital);
    } catch (loadError) {
      setError(loadError.message || 'Could not load MOU requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const outgoing = useMemo(
    () => agreements.filter((agreement) => agreement.hospital_id === currentHospital?.id && agreement.status !== 'active'),
    [agreements, currentHospital],
  );
  const incoming = useMemo(
    () => agreements.filter((agreement) => agreement.partner_hospital_id === currentHospital?.id && agreement.status !== 'active'),
    [agreements, currentHospital],
  );
  const activeAgreements = useMemo(
    () => agreements.filter((agreement) => agreement.status === 'active'),
    [agreements],
  );

  const sendRequest = async (event) => {
    event.preventDefault();
    if (!selectedPartnerId) return;
    setIsSending(true);
    setError('');
    try {
      await createAgreement({
        partner_hospital_id: selectedPartnerId,
        title: 'Direct Hospital MOU',
        signatory: currentHospital?.name || 'Hospital Administrator',
        agreement_type: 'direct_mou',
        valid_until: validUntil || null,
      });
      setSelectedPartnerId('');
      setValidUntil('');
      setTermsAccepted(false);
      await loadData();
      onToast?.('MOU request sent.');
    } catch (sendError) {
      setError(sendError.message || 'Could not send MOU request.');
    } finally {
      setIsSending(false);
    }
  };

  const updateStatus = async (agreement, status) => {
    setUpdatingId(agreement.id);
    setError('');
    try {
      await updateAgreementStatus(agreement.id, status);
      await loadData();
      onToast?.(status === 'active' ? 'MOU accepted.' : status === 'archived' ? 'MOU revoked.' : 'MOU request declined.');
    } catch (updateError) {
      setError(updateError.message || 'Could not update MOU request.');
    } finally {
      setUpdatingId(null);
    }
  };

  const requestCard = (agreement, direction) => {
    const otherHospital = direction === 'incoming'
      ? agreement.hospital_name
      : agreement.partner_hospital_name;
    return (
      <article key={agreement.id} className="rounded-xl border border-outline/20 p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-on-surface">{otherHospital}</h3>
            <p className="text-sm text-on-surface-variant">
              {direction === 'incoming' ? 'Incoming MOU request' : 'MOU request sent'}
            </p>
          </div>
          <details className="mt-3 rounded-lg bg-surface-container-low px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium text-on-surface">View MOU terms</summary>
            <p className="mt-2 whitespace-pre-line text-sm text-on-surface-variant">
              {agreement.terms_and_conditions || STANDARD_MOU_TERMS.map((term, index) => `${index + 1}. ${term}`).join('\n')}
            </p>
          </details>
          <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface">
            {statusLabel(agreement.status)}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-on-surface-variant">
          <span>Type: Direct MOU</span>
          <span>Valid until: {formatDate(agreement.valid_until)}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {direction === 'incoming' && agreement.status === 'pending' && (
            <>
              <button type="button" onClick={() => updateStatus(agreement, 'active')} disabled={updatingId === agreement.id} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary disabled:opacity-50">Accept</button>
              <button type="button" onClick={() => updateStatus(agreement, 'rejected')} disabled={updatingId === agreement.id} className="rounded-lg border border-error/30 px-3 py-2 text-sm font-semibold text-error disabled:opacity-50">Decline</button>
            </>
          )}
          {((direction === 'outgoing' && agreement.status === 'pending') || agreement.status === 'active') && (
            <button type="button" onClick={() => updateStatus(agreement, 'archived')} disabled={updatingId === agreement.id} className="rounded-lg border border-outline/30 px-3 py-2 text-sm font-semibold text-on-surface disabled:opacity-50">
              {agreement.status === 'active' ? 'Revoke MOU' : 'Revoke request'}
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="flex flex-col w-full gap-space-lg animate-fadeIn">
      <header className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Hospital collaboration</span>
        <h1 className="mt-1 font-headline-lg text-headline-lg text-on-surface">Direct MOUs</h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          Send a direct agreement request to another hospital. They can accept or decline it, and either hospital can revoke an active MOU.
        </p>
      </header>
      {error && <div role="alert" className="rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{error}</div>}

      <form onSubmit={sendRequest} className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Send an MOU request</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Choose a hospital and optionally set an expiry date.</p>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
          Hospital
          <select value={selectedPartnerId} onChange={(event) => setSelectedPartnerId(event.target.value)} required className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2.5 text-on-surface">
            <option value="">Select a hospital</option>
            {partnerHospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
          Valid until <span className="font-normal text-on-surface-variant">(optional)</span>
          <input type="date" value={validUntil} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setValidUntil(event.target.value)} className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2.5 text-on-surface" />
        </label>
        <fieldset className="rounded-lg border border-outline/20 p-4">
          <legend className="px-1 text-sm font-semibold text-on-surface">Standard MOU terms</legend>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-on-surface-variant">
            {STANDARD_MOU_TERMS.map((term) => <li key={term}>{term}</li>)}
          </ul>
          <label className="mt-4 flex items-start gap-2 text-sm text-on-surface">
            <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} required className="mt-0.5" />
            <span>I confirm that I have authority to send this MOU and agree to these terms.</span>
          </label>
        </fieldset>
        <button type="submit" disabled={isSending || partnerHospitals.length === 0 || !termsAccepted} className="self-start rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50">
          {isSending ? 'Sending...' : 'Send MOU request'}
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Requests sent by me</h2>
          <div className="mt-4 flex flex-col gap-3">
            {isLoading ? <p className="text-sm text-on-surface-variant">Loading...</p> : outgoing.length === 0 ? <p className="text-sm text-on-surface-variant">No outgoing MOU requests.</p> : outgoing.map((agreement) => requestCard(agreement, 'outgoing'))}
          </div>
        </section>
        <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Requests received</h2>
          <div className="mt-4 flex flex-col gap-3">
            {isLoading ? <p className="text-sm text-on-surface-variant">Loading...</p> : incoming.length === 0 ? <p className="text-sm text-on-surface-variant">No incoming MOU requests.</p> : incoming.map((agreement) => requestCard(agreement, 'incoming'))}
          </div>
        </section>
      </div>
      <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Active MOUs</h2>
        <div className="mt-4 flex flex-col gap-3">
          {isLoading ? <p className="text-sm text-on-surface-variant">Loading...</p> : activeAgreements.length === 0 ? <p className="text-sm text-on-surface-variant">No active MOUs.</p> : activeAgreements.map((agreement) => requestCard(agreement, agreement.hospital_id === currentHospital?.id ? 'outgoing' : 'incoming'))}
        </div>
      </section>
    </div>
  );
}

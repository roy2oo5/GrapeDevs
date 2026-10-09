import React, { useEffect, useState } from 'react';
import {
  changeAccessKey,
  fetchHospitalSettings,
  saveHospitalProfile,
  saveHospitalSettings,
} from '../services/api';

const inputClassName = 'w-full rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2.5 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

export function HospitalSettingsView({ onToast, onHospitalUpdated }) {
  const [hospitalName, setHospitalName] = useState('');
  const [administratorName, setAdministratorName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [currentAccessKey, setCurrentAccessKey] = useState('');
  const [newAccessKey, setNewAccessKey] = useState('');
  const [confirmAccessKey, setConfirmAccessKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [changingAccessKey, setChangingAccessKey] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchHospitalSettings()
      .then((hospital) => {
        if (!active) return;
        setHospitalName(hospital.name || '');
        setAdministratorName(hospital.administrator_name || '');
        setLatitude(hospital.settings?.latitude?.toString() || '');
        setLongitude(hospital.settings?.longitude?.toString() || '');
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Could not load hospital settings.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setSavingProfile(true);
    try {
      const hospital = await saveHospitalProfile({
        hospital_name: hospitalName.trim(),
        administrator_name: administratorName.trim(),
      });
      setHospitalName(hospital.name);
      setAdministratorName(hospital.administrator_name);
      onHospitalUpdated?.(hospital);
      onToast?.('Hospital details updated.');
    } catch (saveError) {
      setError(saveError.message || 'Could not update hospital details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveLocation = async (event) => {
    event.preventDefault();
    setError('');
    setSavingLocation(true);
    try {
      const settings = {};
      if (latitude.trim() || longitude.trim()) {
        const lat = Number(latitude);
        const lng = Number(longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw new Error('Enter a valid latitude and longitude.');
        }
        settings.latitude = lat;
        settings.longitude = lng;
      } else {
        settings.latitude = null;
        settings.longitude = null;
      }
      await saveHospitalSettings(settings);
      onToast?.('Hospital location saved.');
    } catch (saveError) {
      setError(saveError.message || 'Could not save hospital location.');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleChangeAccessKey = async (event) => {
    event.preventDefault();
    setError('');
    if (newAccessKey !== confirmAccessKey) {
      setError('The new passwords do not match.');
      return;
    }
    setChangingAccessKey(true);
    try {
      await changeAccessKey({
        current_access_key: currentAccessKey,
        new_access_key: newAccessKey,
      });
      setCurrentAccessKey('');
      setNewAccessKey('');
      setConfirmAccessKey('');
      onToast?.('Password updated.');
    } catch (saveError) {
      setError(saveError.message || 'Could not update password.');
    } finally {
      setChangingAccessKey(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-on-surface-variant">Loading settings…</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Settings</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Update your hospital details, location, and password.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-on-surface">Hospital details</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Change the names shown to other hospitals.</p>
        </div>
        <label className="block space-y-1.5 text-sm font-medium text-on-surface">
          Hospital name
          <input
            required
            minLength={2}
            maxLength={180}
            value={hospitalName}
            onChange={(event) => setHospitalName(event.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-on-surface">
          Your name
          <input
            required
            minLength={2}
            maxLength={160}
            value={administratorName}
            onChange={(event) => setAdministratorName(event.target.value)}
            className={inputClassName}
          />
        </label>
        <button disabled={savingProfile} className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-on-primary disabled:opacity-60">
          {savingProfile ? 'Saving…' : 'Save details'}
        </button>
      </form>

      <form onSubmit={handleSaveLocation} className="space-y-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-on-surface">Hospital location</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Used to find nearby hospitals and surplus stock.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-on-surface">
            Latitude
            <input type="number" min="-90" max="90" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="e.g. 12.9716" className={inputClassName} />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-on-surface">
            Longitude
            <input type="number" min="-180" max="180" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="e.g. 77.5946" className={inputClassName} />
          </label>
        </div>
        <button disabled={savingLocation} className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-on-primary disabled:opacity-60">
          {savingLocation ? 'Saving…' : 'Save location'}
        </button>
      </form>

      <form onSubmit={handleChangeAccessKey} className="space-y-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-on-surface">Password</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Confirm your current password before setting a new one.</p>
        </div>
        <label className="block space-y-1.5 text-sm font-medium text-on-surface">
          Current password
          <input required minLength={8} type="password" autoComplete="current-password" value={currentAccessKey} onChange={(event) => setCurrentAccessKey(event.target.value)} className={inputClassName} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-on-surface">
          New password
          <input required minLength={8} type="password" autoComplete="new-password" value={newAccessKey} onChange={(event) => setNewAccessKey(event.target.value)} className={inputClassName} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-on-surface">
          Confirm new password
          <input required minLength={8} type="password" autoComplete="new-password" value={confirmAccessKey} onChange={(event) => setConfirmAccessKey(event.target.value)} className={inputClassName} />
        </label>
        <button disabled={changingAccessKey} className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-on-primary disabled:opacity-60">
          {changingAccessKey ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

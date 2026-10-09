import React, { useEffect, useState } from 'react';
import { ConfirmationDialog } from './ConfirmationDialog';
import {
  fetchSurplusInventory,
  fetchMySurplusListings,
  fetchSurplusListings,
  deleteSurplusListing,
  publishSurplusListing,
  requestSurplusListing,
} from '../services/api';

function formatDate(value) {
  if (!value) return 'No expiry date';
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export function MOUPartnersView({ onToast }) {
  const [inventoryBatches, setInventoryBatches] = useState([]);
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [notes, setNotes] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [deletingListingId, setDeletingListingId] = useState(null);
  const [listingPendingDeletion, setListingPendingDeletion] = useState(null);
  const [requestingListingId, setRequestingListingId] = useState(null);
  const [requestQuantity, setRequestQuantity] = useState('');
  const [requestUrgency, setRequestUrgency] = useState('normal');
  const [requestDepartment, setRequestDepartment] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllListings, setShowAllListings] = useState(false);
  const [showAllOwnListings, setShowAllOwnListings] = useState(false);

  const loadMarketplace = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [availableListings, ownListings, batches] = await Promise.all([
        fetchSurplusListings(),
        fetchMySurplusListings(),
        fetchSurplusInventory(),
      ]);
      setListings(availableListings);
      setMyListings(ownListings.filter((listing) => listing.status !== 'withdrawn'));
      setInventoryBatches(batches);
    } catch (loadError) {
      setError(loadError.message || 'Could not load surplus listings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (listing) => {
    setDeletingListingId(listing.id);
    setError('');
    try {
      await deleteSurplusListing(listing.id);
      setMyListings((currentListings) => currentListings.filter((item) => item.id !== listing.id));
      setListingPendingDeletion(null);
      onToast?.('Surplus listing removed.');
    } catch (deleteError) {
      setListingPendingDeletion(null);
      setError(deleteError.message || 'Could not remove surplus listing.');
    } finally {
      setDeletingListingId(null);
    }
  };

  const openRequestForm = (listing) => {
    setRequestingListingId(listing.id);
    setRequestQuantity(String(listing.quantity_available));
    setRequestUrgency('normal');
    setRequestDepartment('');
    setRequestNotes('');
    setError('');
  };

  const closeRequestForm = () => {
    setRequestingListingId(null);
    setRequestQuantity('');
    setRequestDepartment('');
    setRequestNotes('');
  };

  const handleRequest = async (event, listing) => {
    event.preventDefault();
    const requestedQuantity = Number(requestQuantity);
    if (!requestedQuantity || requestedQuantity > listing.quantity_available) {
      setError(`Request between 1 and ${listing.quantity_available} ${listing.unit}.`);
      return;
    }

    setIsRequesting(true);
    setError('');
    try {
      await requestSurplusListing(listing.id, {
        quantity: requestedQuantity,
        urgency: requestUrgency,
        department: requestDepartment.trim() || null,
        notes: requestNotes.trim() || null,
      });
      closeRequestForm();
      await loadMarketplace();
      onToast?.(`Request sent to ${listing.hospital_name}.`);
    } catch (requestError) {
      setError(requestError.message || 'Could not send surplus request.');
    } finally {
      setIsRequesting(false);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, []);

  const selectedBatch = inventoryBatches.find((batch) => batch.id === selectedBatchId);
  const matchesSearch = (listing) => [
    listing.sku_name,
    listing.sku_code,
    listing.hospital_name,
    listing.status,
  ].some((value) => String(value || '').toLowerCase().includes(searchQuery.trim().toLowerCase()));
  const filteredListings = listings.filter(matchesSearch);
  const filteredOwnListings = myListings.filter(matchesSearch);

  const handleBatchChange = (event) => {
    const batchId = event.target.value;
    const batch = inventoryBatches.find((item) => item.id === batchId);
    setSelectedBatchId(batchId);
    setQuantity(batch ? String(batch.quantity_available) : '');
    setExpiresOn(batch?.expires_on || '');
  };

  const handlePost = async (event) => {
    event.preventDefault();
    if (!selectedBatchId || !quantity || !expiresOn) return;

    setIsPosting(true);
    setError('');
    try {
      await publishSurplusListing({
        inventory_batch_id: selectedBatchId,
        quantity: Number(quantity),
        expires_on: expiresOn,
        notes: notes.trim() || null,
      });
      setSelectedBatchId('');
      setQuantity('');
      setExpiresOn('');
      setNotes('');
      await loadMarketplace();
      onToast?.('Surplus posted for nearby hospitals.');
    } catch (postError) {
      setError(postError.message || 'Could not post surplus.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg animate-fadeIn">
      {listingPendingDeletion && (
        <ConfirmationDialog
          title="Remove surplus listing?"
          message={`Remove ${listingPendingDeletion.sku_name} from the surplus marketplace?`}
          confirmLabel="Remove listing"
          isConfirming={deletingListingId === listingPendingDeletion.id}
          onCancel={() => setListingPendingDeletion(null)}
          onConfirm={() => handleDelete(listingPendingDeletion)}
        />
      )}
      <header className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <div className="flex flex-col gap-space-xs">
          <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
            Hospital surplus exchange
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Surplus marketplace
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Post extra stock from your inventory and see active surplus shared by other hospitals.
          </p>
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
          {error}
        </div>
      )}
      <label>
        <span className="sr-only">Search surplus listings</span>
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search surplus by medicine or hospital" className="w-full rounded-lg border border-outline/30 bg-surface-container-lowest px-3 py-2 text-sm" />
      </label>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-space-lg items-start">
        <form onSubmit={handlePost} className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Post your surplus</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Keep 7 days of recent medicine use in reserve. Only the extra stock is available to share.
            </p>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
            Inventory batch
            <select
              value={selectedBatchId}
              onChange={handleBatchChange}
              required
              className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2.5 text-on-surface outline-none focus:border-primary"
            >
              <option value="">Select a batch</option>
              {inventoryBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.sku_name} ({batch.quantity_available} {batch.unit} available)
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
            Quantity to share
            <input
              type="number"
              min="1"
              max={selectedBatch?.quantity_available || undefined}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
              className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2.5 text-on-surface outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
            Expiry date
            <input
              type="date"
              value={expiresOn}
              min={new Date().toISOString().slice(0, 10)}
              max={selectedBatch?.expires_on || undefined}
              onChange={(event) => setExpiresOn(event.target.value)}
              required
              className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2.5 text-on-surface outline-none focus:border-primary"
            />
            {selectedBatch?.expires_on && (
              <span className="text-xs font-normal text-on-surface-variant">
                Cannot be later than the inventory batch expiry: {formatDate(selectedBatch.expires_on)}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
            Note <span className="font-normal text-on-surface-variant">(optional)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows="3"
              maxLength="1000"
              placeholder="Add storage or pickup information"
              className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2.5 text-on-surface outline-none focus:border-primary"
            />
          </label>

          <button
            type="submit"
            disabled={isPosting || inventoryBatches.length === 0}
            className="rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPosting ? 'Posting...' : 'Post surplus'}
          </button>
          {inventoryBatches.length === 0 && !isLoading && (
            <p className="text-sm text-on-surface-variant">
              No extra inventory is available after keeping 7 days of recent medicine use in reserve.
            </p>
          )}
        </form>

        <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Your posted surplus</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Track what you shared and see which hospitals requested it.
          </p>
          {filteredOwnListings.length === 0 ? (
            <p className="mt-6 text-sm text-on-surface-variant">You have not posted any surplus yet.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {(showAllOwnListings ? filteredOwnListings : filteredOwnListings.slice(0, 5)).map((listing) => (
                <article key={listing.id} className="rounded-lg border border-outline/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-on-surface">{listing.sku_name}</h3>
                      <p className="text-sm text-on-surface-variant">
                        {listing.quantity_available} {listing.unit} still available
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        Expires: {formatDate(listing.expires_on)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface">
                        {listing.status}
                      </span>
                      {listing.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => setListingPendingDeletion(listing)}
                          disabled={deletingListingId === listing.id}
                          aria-label={`Delete ${listing.sku_name} surplus`}
                          className="rounded-lg border border-error/30 px-2.5 py-1.5 text-xs font-medium text-error hover:bg-error-container/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingListingId === listing.id ? 'Removing...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 border-t border-outline/10 pt-3">
                    {listing.buyers?.length ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-semibold text-on-surface">Buyer requests</p>
                        {listing.buyers.map((buyer) => (
                          <div key={`${listing.id}-${buyer.hospital_id}-${buyer.status}`} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-on-surface-variant">{buyer.hospital_name}</span>
                            <span className="text-on-surface">
                              {buyer.quantity} {listing.unit} · {buyer.status}
                            </span>
                          </div>
                        ))}
                        {!showAllOwnListings && filteredOwnListings.length > 5 && (
                          <button type="button" onClick={() => setShowAllOwnListings(true)} className="py-2 text-sm font-semibold text-primary">Show all {filteredOwnListings.length} listings</button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-on-surface-variant">No buyer found yet.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-space-md">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Nearby hospital surplus</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Active listings shared by other hospitals in the network.
              </p>
            </div>
            <button
              type="button"
              onClick={loadMarketplace}
              disabled={isLoading}
              className="rounded-lg border border-outline/30 px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">Loading surplus listings...</p>
          ) : filteredListings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-outline/30 px-4 py-8 text-center">
              <p className="font-medium text-on-surface">No surplus listings yet</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Other hospitals&apos; active posts will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(showAllListings ? filteredListings : filteredListings.slice(0, 5)).map((listing) => (
                <article key={listing.id} className="rounded-lg border border-outline/20 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-on-surface">{listing.sku_name}</h3>
                      <p className="text-sm text-primary">{listing.hospital_name}</p>
                    </div>
                    <span className="rounded-full bg-tertiary-container/40 px-2.5 py-1 text-sm font-semibold text-on-tertiary-container">
                      {listing.quantity_available} {listing.unit} available
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-on-surface-variant">
                    <span>Lot: {listing.lot_number || 'Not specified'}</span>
                    <span>Expires: {formatDate(listing.expires_on)}</span>
                    <span>Storage: {listing.storage_regime}</span>
                  </div>
                  {listing.notes && (
                    <p className="mt-3 border-t border-outline/10 pt-3 text-sm text-on-surface-variant">
                      {listing.notes}
                    </p>
                  )}
                  {requestingListingId === listing.id ? (
                    <form onSubmit={(event) => handleRequest(event, listing)} className="mt-4 border-t border-outline/10 pt-4 flex flex-col gap-3">
                      <p className="text-sm font-semibold text-on-surface">Request this surplus</p>
                      <label className="flex flex-col gap-1 text-sm font-medium text-on-surface">
                        Quantity
                        <input
                          type="number"
                          min="1"
                          max={listing.quantity_available}
                          value={requestQuantity}
                          onChange={(event) => setRequestQuantity(event.target.value)}
                          required
                          className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2 text-on-surface"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-medium text-on-surface">
                        Urgency
                        <select value={requestUrgency} onChange={(event) => setRequestUrgency(event.target.value)} className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2 text-on-surface">
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-medium text-on-surface">
                        Receiving department <span className="font-normal text-on-surface-variant">(optional)</span>
                        <input value={requestDepartment} onChange={(event) => setRequestDepartment(event.target.value)} maxLength="120" placeholder="e.g. Emergency Department" className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2 text-on-surface" />
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-medium text-on-surface">
                        Message <span className="font-normal text-on-surface-variant">(optional)</span>
                        <textarea value={requestNotes} onChange={(event) => setRequestNotes(event.target.value)} maxLength="1000" rows="2" placeholder="Add pickup timing or clinical need" className="rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2 text-on-surface" />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button type="submit" disabled={isRequesting} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary disabled:opacity-50">{isRequesting ? 'Sending...' : 'Send request'}</button>
                        <button type="button" onClick={closeRequestForm} disabled={isRequesting} className="rounded-lg border border-outline/30 px-3 py-2 text-sm font-medium text-on-surface disabled:opacity-50">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button type="button" onClick={() => openRequestForm(listing)} className="mt-4 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary">
                      Request surplus
                    </button>
                  )}
                </article>
              ))}
              {!showAllListings && filteredListings.length > 5 && (
                <button type="button" onClick={() => setShowAllListings(true)} className="py-2 text-sm font-semibold text-primary">Show all {filteredListings.length} listings</button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

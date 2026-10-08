import React, { useEffect, useState } from 'react';
import {
  fetchInventory,
  fetchMySurplusListings,
  fetchSurplusListings,
  deleteSurplusListing,
  publishSurplusListing,
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMarketplace = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [availableListings, ownListings, batches] = await Promise.all([
        fetchSurplusListings(),
        fetchMySurplusListings(),
        fetchInventory(),
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
    if (!window.confirm(`Remove ${listing.sku_name} from the surplus marketplace?`)) return;

    setDeletingListingId(listing.id);
    setError('');
    try {
      await deleteSurplusListing(listing.id);
      setMyListings((currentListings) => currentListings.filter((item) => item.id !== listing.id));
      onToast?.('Surplus listing removed.');
    } catch (deleteError) {
      setError(deleteError.message || 'Could not remove surplus listing.');
    } finally {
      setDeletingListingId(null);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, []);

  const selectedBatch = inventoryBatches.find((batch) => batch.id === selectedBatchId);

  const handleBatchChange = (event) => {
    const batchId = event.target.value;
    const batch = inventoryBatches.find((item) => item.id === batchId);
    setSelectedBatchId(batchId);
    setQuantity(batch ? String(batch.quantity) : '');
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

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-space-lg items-start">
        <form onSubmit={handlePost} className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Post your surplus</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Choose an inventory batch and the quantity nearby hospitals can use.
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
                  {batch.sku_name} ({batch.quantity} {batch.unit})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-on-surface">
            Quantity to share
            <input
              type="number"
              min="1"
              max={selectedBatch?.quantity || undefined}
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
              Add inventory first before posting surplus.
            </p>
          )}
        </form>

        <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Your posted surplus</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Track what you shared and see which hospitals requested it.
          </p>
          {myListings.length === 0 ? (
            <p className="mt-6 text-sm text-on-surface-variant">You have not posted any surplus yet.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {myListings.map((listing) => (
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
                          onClick={() => handleDelete(listing)}
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
          ) : listings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-outline/30 px-4 py-8 text-center">
              <p className="font-medium text-on-surface">No surplus listings yet</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Other hospitals&apos; active posts will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {listings.map((listing) => (
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
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

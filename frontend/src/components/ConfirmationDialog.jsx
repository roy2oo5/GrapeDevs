import React from 'react';

export function ConfirmationDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  isConfirming = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isConfirming) onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
        className="w-full max-w-md rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-2xl"
      >
        <h2 id="confirmation-title" className="text-lg font-semibold text-on-surface">{title}</h2>
        <p id="confirmation-message" className="mt-2 text-sm text-on-surface-variant">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="rounded-lg border border-outline/30 px-4 py-2 text-sm font-semibold text-on-surface-variant disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-on-error disabled:opacity-50"
          >
            {isConfirming ? 'Working...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

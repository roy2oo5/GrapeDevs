import React from 'react';

export function Footer({ onOpenModal }) {
  return (
    <footer className="relative z-10 w-full bg-surface-container-lowest/70 backdrop-blur-md shadow-[0_-1px_6px_rgba(0,0,0,0.02)] border-t border-surface-container">
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-md flex items-center justify-end">
        <div className="flex items-center gap-space-md font-label-sm text-label-sm text-on-surface-variant">
          <button
            type="button"
            onClick={() => onOpenModal && onOpenModal('terms')}
            className="hover:text-on-surface transition-colors focus:outline-none cursor-pointer"
          >
            Terms
          </button>
        </div>
      </div>
    </footer>
  );
}

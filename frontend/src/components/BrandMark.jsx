import React from 'react';

export function BrandMark({ className = 'h-9 w-9' }) {
  return (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-sm ring-1 ring-primary/20`}>
      <span className="material-symbols-outlined text-[21px]">medical_services</span>
    </div>
  );
}

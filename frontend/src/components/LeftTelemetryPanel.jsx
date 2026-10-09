import React from 'react';

export function LeftTelemetryPanel() {
  const features = [
    { icon: 'inventory_2', label: 'Track medicine stock and expiry dates' },
    { icon: 'query_stats', label: 'Review medicine use and forecasts' },
    { icon: 'local_shipping', label: 'Coordinate transfers with hospitals' },
  ];

  return (
    <section className="relative flex flex-col justify-between overflow-hidden bg-inverse-surface p-space-lg text-inverse-on-surface lg:w-[46%] lg:p-space-xl">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-tertiary/15 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest/10 text-primary-fixed">
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">hub</span>
          </div>
          <span className="font-headline-sm font-semibold tracking-tight text-surface-container-lowest">
            PulseGrid
          </span>
        </div>

        <div className="mt-10 space-y-3">
          <p className="text-sm font-semibold text-primary-fixed">Hospital stock, made easier</p>
          <h1 className="text-3xl font-semibold leading-tight text-surface-container-lowest">
            Keep medicine stock moving where it is needed.
          </h1>
          <p className="max-w-md leading-relaxed text-surface-variant/80">
            Track inventory, check expected use, and coordinate transfers with other hospitals.
          </p>
        </div>

        <ul className="mt-8 space-y-3">
          {features.map((feature) => (
            <li key={feature.label} className="flex items-center gap-3 text-sm text-surface-container-lowest">
              <span className="material-symbols-outlined text-[20px] text-tertiary-fixed" aria-hidden="true">
                {feature.icon}
              </span>
              {feature.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

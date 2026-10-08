create table if not exists public.transfer_audit_events (
    id uuid primary key default gen_random_uuid(),
    transfer_id uuid not null references public.transfer_requests(id) on delete cascade,
    actor_hospital_id uuid references public.hospitals(id) on delete set null,
    from_status varchar(24),
    to_status varchar(24) not null,
    quantity integer not null check (quantity > 0),
    created_at timestamptz not null default now()
);

create index if not exists ix_transfer_audit_events_transfer_id
    on public.transfer_audit_events (transfer_id, created_at);

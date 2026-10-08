create extension if not exists pgcrypto;

create table if not exists public.hospitals (
    id uuid primary key default gen_random_uuid(),
    name varchar(180) not null,
    administrator_name varchar(160) not null,
    administrator_email varchar(254) not null,
    classification varchar(24) not null check (classification in ('tertiary', 'secondary', 'clinic', 'depot')),
    node_role varchar(24) not null check (node_role in ('pharmacy', 'coordinator', 'logistics')),
    status varchar(24) not null default 'active' check (status in ('active', 'suspended')),
    settings jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create unique index if not exists uq_hospitals_administrator_email_lower
    on public.hospitals (lower(administrator_email));
create index if not exists ix_hospitals_name on public.hospitals (name);

create table if not exists public.hospital_admin_accounts (
    id uuid primary key default gen_random_uuid(),
    hospital_id uuid not null references public.hospitals(id) on delete cascade,
    administrator_id varchar(80) not null,
    password_hash varchar(256) not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create unique index if not exists uq_hospital_admin_accounts_administrator_id_lower
    on public.hospital_admin_accounts (lower(administrator_id));
create index if not exists ix_hospital_admin_accounts_hospital_id
    on public.hospital_admin_accounts (hospital_id);

create table if not exists public.inventory_batches (
    id uuid primary key default gen_random_uuid(),
    hospital_id uuid not null references public.hospitals(id) on delete cascade,
    sku_code varchar(80) not null,
    sku_name varchar(200) not null,
    quantity integer not null check (quantity >= 0),
    unit varchar(40) not null default 'units',
    lot_number varchar(100),
    expires_on date,
    storage_regime varchar(80) not null default 'ambient',
    average_daily_use double precision not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists ix_inventory_batches_hospital_id on public.inventory_batches (hospital_id);
create index if not exists ix_inventory_batches_sku_code on public.inventory_batches (sku_code);
create index if not exists ix_inventory_batches_expires_on on public.inventory_batches (expires_on);

create table if not exists public.surplus_listings (
    id uuid primary key default gen_random_uuid(),
    hospital_id uuid not null references public.hospitals(id) on delete cascade,
    inventory_batch_id uuid not null references public.inventory_batches(id) on delete cascade,
    sku_code varchar(80) not null,
    sku_name varchar(200) not null,
    quantity integer not null check (quantity > 0),
    quantity_available integer not null check (quantity_available >= 0),
    unit varchar(40) not null default 'units',
    lot_number varchar(100),
    expires_on date,
    storage_regime varchar(80) not null default 'ambient',
    notes varchar(1000),
    status varchar(24) not null default 'active' check (status in ('active', 'filled', 'withdrawn')),
    created_at timestamptz not null default now()
);

create index if not exists ix_surplus_listings_hospital_id on public.surplus_listings (hospital_id);
create index if not exists ix_surplus_listings_inventory_batch_id on public.surplus_listings (inventory_batch_id);
create index if not exists ix_surplus_listings_sku_code on public.surplus_listings (sku_code);
create index if not exists ix_surplus_listings_status on public.surplus_listings (status);

create table if not exists public.hospital_agreements (
    id uuid primary key default gen_random_uuid(),
    hospital_id uuid not null references public.hospitals(id) on delete cascade,
    partner_hospital_id uuid not null references public.hospitals(id) on delete cascade,
    title varchar(180) not null,
    signatory varchar(160) not null,
    agreement_type varchar(120) not null,
    valid_until date,
    terms_and_conditions text not null default '',
    status varchar(24) not null default 'pending' check (status in ('pending', 'active', 'rejected', 'archived')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (hospital_id <> partner_hospital_id)
);

create index if not exists ix_hospital_agreements_hospital_id on public.hospital_agreements (hospital_id);
create index if not exists ix_hospital_agreements_partner_hospital_id on public.hospital_agreements (partner_hospital_id);
create index if not exists ix_hospital_agreements_status on public.hospital_agreements (status);

create table if not exists public.scenario_runs (
    id uuid primary key default gen_random_uuid(),
    hospital_id uuid not null references public.hospitals(id) on delete cascade,
    scenario_type varchar(120) not null,
    demand_multiplier double precision not null,
    supplier_delay_days integer not null,
    reproduction_index double precision not null,
    results jsonb not null,
    created_at timestamptz not null default now()
);

create index if not exists ix_scenario_runs_hospital_id on public.scenario_runs (hospital_id);
create index if not exists ix_scenario_runs_created_at on public.scenario_runs (created_at desc);

create table if not exists public.transfer_requests (
    id uuid primary key default gen_random_uuid(),
    requesting_hospital_id uuid references public.hospitals(id) on delete set null,
    source_hospital_id uuid references public.hospitals(id) on delete set null,
    surplus_listing_id uuid references public.surplus_listings(id) on delete set null,
    sku_code varchar(80),
    sku_name varchar(200) not null,
    quantity integer not null check (quantity > 0),
    unit varchar(40) not null default 'units',
    urgency varchar(24) not null default 'normal' check (urgency in ('critical', 'high', 'normal')),
    department varchar(120),
    notes varchar(1000),
    status varchar(24) not null default 'requested'
        check (status in ('requested', 'approved', 'rejected', 'in_transit', 'completed', 'canceled')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists ix_transfer_requests_requesting_hospital_id
    on public.transfer_requests (requesting_hospital_id);
create index if not exists ix_transfer_requests_source_hospital_id
    on public.transfer_requests (source_hospital_id);
create index if not exists ix_transfer_requests_surplus_listing_id
    on public.transfer_requests (surplus_listing_id);
create index if not exists ix_transfer_requests_sku_code on public.transfer_requests (sku_code);
create index if not exists ix_transfer_requests_status on public.transfer_requests (status);
create index if not exists ix_transfer_requests_created_at on public.transfer_requests (created_at desc);

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

alter table public.hospitals enable row level security;
alter table public.hospital_admin_accounts enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.transfer_requests enable row level security;
alter table public.surplus_listings enable row level security;
alter table public.hospital_agreements enable row level security;
alter table public.scenario_runs enable row level security;
alter table public.hospitals
    add column if not exists settings jsonb not null default '{}'::jsonb;

alter table public.inventory_batches
    add column if not exists average_daily_use double precision not null default 0;

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

alter table public.surplus_listings enable row level security;
alter table public.hospital_agreements enable row level security;
alter table public.scenario_runs enable row level security;
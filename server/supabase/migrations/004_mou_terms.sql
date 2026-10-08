alter table public.hospital_agreements
    add column if not exists terms_and_conditions text not null default '';

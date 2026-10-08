do $$
begin
    if to_regclass('public.hospitals') is null and to_regclass('public.facilities') is not null then
        alter table public.facilities rename to hospitals;
    end if;

    if to_regclass('public.hospitals') is not null then
        if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'hospital_admin_accounts' and column_name = 'facility_id') then
            alter table public.hospital_admin_accounts rename column facility_id to hospital_id;
        end if;
        if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'inventory_batches' and column_name = 'facility_id') then
            alter table public.inventory_batches rename column facility_id to hospital_id;
        end if;
        if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'transfer_requests' and column_name = 'requesting_facility_id') then
            alter table public.transfer_requests rename column requesting_facility_id to requesting_hospital_id;
        end if;
        if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'transfer_requests' and column_name = 'source_facility_id') then
            alter table public.transfer_requests rename column source_facility_id to source_hospital_id;
        end if;

        if not exists (select 1 from pg_constraint where conrelid = 'public.hospitals'::regclass and conname = 'ck_hospitals_status') then
            alter table public.hospitals drop constraint if exists facilities_status_check;
            alter table public.hospitals drop constraint if exists ck_facility_status;
            update public.hospitals set status = 'active' where status = 'pending';
            update public.hospitals set status = 'suspended' where status = 'rejected';
            alter table public.hospitals add constraint ck_hospitals_status check (status in ('active', 'suspended'));
        end if;
    end if;
end
$$;
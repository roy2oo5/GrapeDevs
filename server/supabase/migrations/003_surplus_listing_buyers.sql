-- Link surplus requests to the listing that created them so sellers can see buyers.
-- apply_schema.py runs migrations before the canonical schema, so this is
-- intentionally a no-op for a fresh database; schema.sql creates the column there.
DO $$
BEGIN
    IF to_regclass('public.transfer_requests') IS NOT NULL
       AND to_regclass('public.surplus_listings') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'transfer_requests'
             AND column_name = 'surplus_listing_id'
       ) THEN
        ALTER TABLE public.transfer_requests
        ADD COLUMN surplus_listing_id UUID
        REFERENCES public.surplus_listings(id)
        ON DELETE SET NULL;
    END IF;

    IF to_regclass('public.transfer_requests') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_indexes
           WHERE schemaname = 'public'
             AND tablename = 'transfer_requests'
             AND indexname = 'ix_transfer_requests_surplus_listing_id'
       ) THEN
        CREATE INDEX ix_transfer_requests_surplus_listing_id
        ON public.transfer_requests (surplus_listing_id);
    END IF;
END
$$;

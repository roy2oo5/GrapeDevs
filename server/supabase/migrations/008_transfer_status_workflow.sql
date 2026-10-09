ALTER TABLE public.transfer_requests
    DROP CONSTRAINT IF EXISTS transfer_requests_status_check;

ALTER TABLE public.transfer_requests
    DROP CONSTRAINT IF EXISTS ck_transfer_status;

ALTER TABLE public.transfer_requests
    ADD CONSTRAINT ck_transfer_status CHECK (
        status IN (
            'requested', 'approved', 'pending_pickup', 'in_transit',
            'arrived_awaiting_inspection', 'completed', 'rejected',
            'returned', 'exception', 'canceled'
        )
    );

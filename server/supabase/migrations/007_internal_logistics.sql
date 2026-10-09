CREATE TABLE IF NOT EXISTS public.drivers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_identifier varchar(80) NOT NULL UNIQUE,
    full_name varchar(160) NOT NULL,
    terminal_access_key_hash varchar(256),
    phone_number varchar(40),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_identifier varchar(80) NOT NULL UNIQUE,
    registration_number varchar(80) UNIQUE,
    vehicle_type varchar(32) NOT NULL CHECK (vehicle_type IN ('cold_chain_bike', 'standard_bike', 'cold_chain_van', 'standard_van')),
    status varchar(24) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_service', 'maintenance', 'retired')),
    max_payload_kg double precision CHECK (max_payload_kg IS NULL OR max_payload_kg > 0),
    is_cold_chain_capable boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_batches
    ADD COLUMN IF NOT EXISTS reserved_quantity integer NOT NULL DEFAULT 0
    CHECK (reserved_quantity >= 0 AND reserved_quantity <= quantity);

ALTER TABLE public.transfer_requests
    ADD COLUMN IF NOT EXISTS assigned_driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_transfer_status') THEN
        ALTER TABLE public.transfer_requests DROP CONSTRAINT ck_transfer_status;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_transfer_status') THEN
        ALTER TABLE public.transfer_requests ADD CONSTRAINT ck_transfer_status CHECK (
            status IN (
                'requested', 'approved', 'pending_pickup', 'in_transit',
                'arrived_awaiting_inspection', 'completed', 'rejected',
                'returned', 'exception', 'canceled'
            )
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.transfer_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id uuid NOT NULL REFERENCES public.transfer_requests(id) ON DELETE CASCADE,
    source_inventory_batch_id uuid REFERENCES public.inventory_batches(id) ON DELETE SET NULL,
    requested_quantity integer NOT NULL CHECK (requested_quantity > 0),
    reserved_quantity integer NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    accepted_quantity integer NOT NULL DEFAULT 0 CHECK (accepted_quantity >= 0),
    damaged_quantity integer NOT NULL DEFAULT 0 CHECK (damaged_quantity >= 0),
    returned_quantity integer NOT NULL DEFAULT 0 CHECK (returned_quantity >= 0),
    destination_batch_id uuid REFERENCES public.inventory_batches(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.transfer_chain_of_custody (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id uuid NOT NULL REFERENCES public.transfer_requests(id) ON DELETE CASCADE,
    event_type varchar(32) NOT NULL CHECK (event_type IN ('picked_up', 'received_by_hospital', 'returned_to_origin')),
    occurred_at timestamptz NOT NULL,
    recorded_at timestamptz NOT NULL DEFAULT now(),
    liability_from_type varchar(24) NOT NULL CHECK (liability_from_type IN ('hospital', 'logistics_fleet')),
    liability_to_type varchar(24) NOT NULL CHECK (liability_to_type IN ('hospital', 'logistics_fleet')),
    liability_from_hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
    liability_to_hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
    driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
    vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
    confirmed_by_name varchar(160) NOT NULL,
    notes varchar(1000)
);

CREATE TABLE IF NOT EXISTS public.transfer_receipts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id uuid NOT NULL UNIQUE REFERENCES public.transfer_requests(id) ON DELETE CASCADE,
    receiving_hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    received_by_name varchar(160) NOT NULL,
    inspected_at timestamptz NOT NULL,
    accepted_quantity integer NOT NULL CHECK (accepted_quantity >= 0),
    rejected_quantity integer NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),
    notes varchar(1000)
);

CREATE TABLE IF NOT EXISTS public.transfer_incidents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id uuid NOT NULL REFERENCES public.transfer_requests(id) ON DELETE CASCADE,
    driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
    incident_type varchar(32) NOT NULL CHECK (incident_type IN ('damaged', 'temperature_breach', 'lost', 'vehicle_failure', 'accident')),
    affected_quantity integer NOT NULL DEFAULT 0 CHECK (affected_quantity >= 0),
    occurred_at timestamptz NOT NULL,
    description varchar(2000) NOT NULL,
    evidence_url varchar(500),
    resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.transfer_tracking_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id uuid NOT NULL UNIQUE REFERENCES public.transfer_requests(id) ON DELETE CASCADE,
    driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
    is_active boolean NOT NULL DEFAULT true,
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    last_latitude double precision,
    last_longitude double precision,
    last_recorded_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.transfer_location_points (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_session_id uuid NOT NULL REFERENCES public.transfer_tracking_sessions(id) ON DELETE CASCADE,
    latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    accuracy_meters double precision CHECK (accuracy_meters IS NULL OR accuracy_meters >= 0),
    captured_at timestamptz NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_transfer_items_transfer_id ON public.transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS ix_transfer_custody_transfer_id ON public.transfer_chain_of_custody(transfer_id, occurred_at);
CREATE INDEX IF NOT EXISTS ix_transfer_incidents_transfer_id ON public.transfer_incidents(transfer_id);
CREATE INDEX IF NOT EXISTS ix_transfer_location_points_session_id ON public.transfer_location_points(tracking_session_id, captured_at);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_chain_of_custody ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_location_points ENABLE ROW LEVEL SECURITY;

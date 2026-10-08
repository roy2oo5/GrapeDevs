CREATE TABLE IF NOT EXISTS medicine_daily_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    sku_code varchar(80) NOT NULL,
    sku_name varchar(200) NOT NULL,
    usage_date date NOT NULL,
    quantity_dispensed integer NOT NULL DEFAULT 0 CHECK (quantity_dispensed >= 0),
    quantity_requested integer NOT NULL DEFAULT 0 CHECK (quantity_requested >= 0),
    quantity_issued integer NOT NULL DEFAULT 0 CHECK (quantity_issued >= 0),
    stockout_flag boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (hospital_id, sku_code, usage_date)
);

CREATE INDEX IF NOT EXISTS ix_medicine_daily_usage_hospital_sku
    ON medicine_daily_usage (hospital_id, sku_code, usage_date);

CREATE TABLE IF NOT EXISTS hospital_surveillance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    report_date date NOT NULL,
    syndrome varchar(120) NOT NULL,
    new_cases integer NOT NULL DEFAULT 0 CHECK (new_cases >= 0),
    admissions integer NOT NULL DEFAULT 0 CHECK (admissions >= 0),
    icu_admissions integer NOT NULL DEFAULT 0 CHECK (icu_admissions >= 0),
    outbreak_flag boolean NOT NULL DEFAULT false,
    alert_level varchar(24) NOT NULL DEFAULT 'normal'
        CHECK (alert_level IN ('normal', 'watch', 'surge')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (hospital_id, report_date, syndrome)
);

CREATE INDEX IF NOT EXISTS ix_hospital_surveillance_hospital_date
    ON hospital_surveillance (hospital_id, report_date);

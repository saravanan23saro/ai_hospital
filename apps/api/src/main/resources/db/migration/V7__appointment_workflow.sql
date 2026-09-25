ALTER TABLE appointment ADD COLUMN reservation_id uuid UNIQUE REFERENCES slot_reservation(reservation_id);
ALTER TABLE appointment ADD COLUMN cancellation_reason varchar(500);
ALTER TABLE appointment ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

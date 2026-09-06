-- Pitch Book database schema for DrawSQL
-- PostgreSQL DDL generated from prisma/schema/*.prisma

CREATE TYPE role AS ENUM ('ADMIN', 'PLAYER', 'OWNER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'BLOCKED', 'DELETED');
CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE auth_provider AS ENUM ('GOOGLE', 'CREDENTIAL');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE ground_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE day_type AS ENUM ('WEEKDAY', 'WEEKEND', 'PEAK');
CREATE TYPE slot_status AS ENUM ('AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
CREATE TYPE payout_status AS ENUM ('REQUESTED', 'APPROVED', 'PAID');
CREATE TYPE sport_type AS ENUM ('FUTSAL', 'CRICKET', 'BADMINTON', 'TENNIS', 'VOLLEYBALL', 'BASKETBALL');

CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT,
  google_id TEXT UNIQUE,
  auth_provider auth_provider NOT NULL DEFAULT 'CREDENTIAL',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  role role NOT NULL DEFAULT 'PLAYER',
  status user_status NOT NULL DEFAULT 'ACTIVE',
  need_password_change BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE owner_profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  license_doc_url TEXT,
  verification_status verification_status NOT NULL DEFAULT 'PENDING',
  commission_rate DOUBLE PRECISION NOT NULL DEFAULT 0.10,
  CONSTRAINT fk_owner_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE grounds (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  sport_types sport_type NOT NULL,
  status ground_status NOT NULL DEFAULT 'ACTIVE',
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_grounds_owner
    FOREIGN KEY (owner_id) REFERENCES owner_profiles(id)
);

CREATE TABLE ground_photos (
  id UUID PRIMARY KEY,
  ground_id UUID NOT NULL,
  url TEXT NOT NULL,
  CONSTRAINT fk_ground_photos_ground
    FOREIGN KEY (ground_id) REFERENCES grounds(id)
);

CREATE TABLE ground_schedules (
  id UUID PRIMARY KEY,
  ground_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL,
  open_time VARCHAR(255) NOT NULL,
  close_time VARCHAR(255) NOT NULL,
  slot_duration_min INTEGER NOT NULL,
  CONSTRAINT fk_ground_schedules_ground
    FOREIGN KEY (ground_id) REFERENCES grounds(id)
);

CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY,
  ground_id UUID NOT NULL,
  day_type day_type NOT NULL,
  start_time VARCHAR(255) NOT NULL,
  end_time VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  CONSTRAINT fk_pricing_rules_ground
    FOREIGN KEY (ground_id) REFERENCES grounds(id)
);

CREATE TABLE slots (
  id UUID PRIMARY KEY,
  ground_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time VARCHAR(255) NOT NULL,
  end_time VARCHAR(255) NOT NULL,
  status slot_status NOT NULL DEFAULT 'AVAILABLE',
  price NUMERIC(10, 2) NOT NULL,
  CONSTRAINT fk_slots_ground
    FOREIGN KEY (ground_id) REFERENCES grounds(id),
  CONSTRAINT uq_slots_ground_date_start
    UNIQUE (ground_id, date, start_time)
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  player_id UUID NOT NULL,
  ground_id UUID NOT NULL,
  slot_id UUID NOT NULL UNIQUE,
  status booking_status NOT NULL DEFAULT 'PENDING',
  total_amount NUMERIC(10, 2) NOT NULL,
  cancelled_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_player
    FOREIGN KEY (player_id) REFERENCES users(id),
  CONSTRAINT fk_bookings_ground
    FOREIGN KEY (ground_id) REFERENCES grounds(id),
  CONSTRAINT fk_bookings_slot
    FOREIGN KEY (slot_id) REFERENCES slots(id)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE,
  bkash TEXT NOT NULL,
  transaction_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'PENDING',
  paid_at TIMESTAMP,
  CONSTRAINT fk_payments_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE payouts (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status payout_status NOT NULL DEFAULT 'REQUESTED',
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  CONSTRAINT fk_payouts_owner
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX idx_grounds_latitude_longitude ON grounds (latitude, longitude);
CREATE INDEX idx_grounds_owner_id ON grounds (owner_id);
CREATE INDEX idx_ground_photos_ground_id ON ground_photos (ground_id);
CREATE INDEX idx_ground_schedules_ground_id ON ground_schedules (ground_id);
CREATE INDEX idx_pricing_rules_ground_id ON pricing_rules (ground_id);
CREATE INDEX idx_slots_ground_date ON slots (ground_id, date);
CREATE INDEX idx_bookings_player_id ON bookings (player_id);
CREATE INDEX idx_bookings_ground_id ON bookings (ground_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payouts_owner_id ON payouts (owner_id);
CREATE INDEX idx_payouts_status ON payouts (status);

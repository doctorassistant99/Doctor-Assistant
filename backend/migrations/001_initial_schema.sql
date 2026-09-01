-- Doctor Assistant Database Schema
-- Production-ready Doctor Management SaaS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (Internal users: Admin, Cashier/Receptionist)
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'cashier');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'cashier',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================================
-- PATIENTS TABLE
-- ============================================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    notes TEXT,
    total_visits INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_patients_full_name ON patients(full_name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_created_at ON patients(created_at);

-- ============================================================
-- APPOINTMENTS TABLE
-- ============================================================
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show');
CREATE TYPE booking_source AS ENUM ('online', 'reception', 'phone', 'manual');

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    service VARCHAR(255),
    booking_source booking_source NOT NULL DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT uq_doctor_date_start UNIQUE (doctor_id, appointment_date, start_time)
);

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);

-- ============================================================
-- VISITS TABLE (Patient visit history)
-- ============================================================
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);
CREATE INDEX idx_visits_appointment_id ON visits(appointment_id);

-- ============================================================
-- TRANSACTIONS TABLE (Financial records)
-- ============================================================
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'other');
CREATE TYPE transaction_type AS ENUM ('consultation', 'payment', 'refund', 'other');

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    transaction_type transaction_type NOT NULL,
    payment_method payment_method NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_transactions_invoice ON transactions(invoice_number);
CREATE INDEX idx_transactions_patient_id ON transactions(patient_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- ============================================================
-- CLINIC SETTINGS TABLE
-- ============================================================
CREATE TABLE clinic_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_name VARCHAR(255),
    clinic_name VARCHAR(255),
    logo_url TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    booking_enabled BOOLEAN NOT NULL DEFAULT false,
    working_hours JSONB DEFAULT '{}',
    appointment_duration_minutes INTEGER NOT NULL DEFAULT 30,
    invoice_prefix VARCHAR(20),
    invoice_format VARCHAR(100) DEFAULT 'YYMMDD0001',
    extra_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FUNCTION: Generate Invoice Number
-- Format: YYMMDD + 4-digit DAILY sequence number
-- The sequence RESETS every day (first invoice of a new day = 0001).
-- A pg advisory lock serializes concurrent invoice generation so
-- two simultaneous inserts can never receive the same number.
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    today_str TEXT;
    seq_num INTEGER;
BEGIN
    -- Serialize concurrent invoice-number generation for today
    PERFORM pg_advisory_xact_lock(hashtext('invoice_number_generator'));

    today_str := to_char(NOW(), 'YYMMDD');

    -- Next sequence number for TODAY only. On a new day this
    -- returns 0, so the sequence resets to 0001.
    SELECT COALESCE(MAX(CAST(RIGHT(invoice_number, 4) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM transactions
    WHERE invoice_number LIKE today_str || '%';

    NEW.invoice_number := today_str || LPAD(seq_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: Auto-generate invoice number
-- ============================================================
CREATE TRIGGER trg_generate_invoice_number
    BEFORE INSERT ON transactions
    FOR EACH ROW
    WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
    EXECUTE FUNCTION generate_invoice_number();

-- ============================================================
-- FUNCTION: Update patient visit count
-- ============================================================
CREATE OR REPLACE FUNCTION update_patient_visit_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE patients
    SET total_visits = (
        SELECT COUNT(*) FROM visits WHERE patient_id = NEW.patient_id
    ),
    updated_at = NOW()
    WHERE id = NEW.patient_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: Auto-update patient visit count on visit creation
-- ============================================================
CREATE TRIGGER trg_update_patient_visit_count
    AFTER INSERT ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_visit_count();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- RLS is ENABLED on all tables with NO anon/authenticated policies.
-- Default deny: the public publishable/anon key CANNOT read or write
-- any medical data. Only the Supabase service role (used by the
-- backend, and which bypasses RLS) can access these tables.
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- Phase 2 will add scoped policies (e.g. patient:read-own) when the
-- public booking website is built. Do NOT add permissive policies here.

-- ============================================================
-- SEED DATA: Default admin user (password: admin123 - hashed with bcrypt)
-- This hash is for the password "admin123"
-- ============================================================
INSERT INTO users (id, email, full_name, hashed_password, role, is_active)
VALUES (
    uuid_generate_v4(),
    'admin@doctor.com',
    'System Administrator',
    '$2b$12$Uo0KkMq3MzEwcxqXcLWvw.VMz0rZUDfOcHbQIhAO10zGn7YILJ12K',
    'admin',
    true
);

-- Insert default clinic settings
INSERT INTO clinic_settings (id) VALUES (uuid_generate_v4());

-- Initial Database Schema for Ethiopia EMR

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mrn VARCHAR(20) UNIQUE NOT NULL, -- Medical Record Number
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    amharic_name VARCHAR(200), -- Amharic Name support
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    phone_number VARCHAR(20),
    email VARCHAR(100),
    address_kebele VARCHAR(100), -- Specific to Ethiopia administrative levels
    address_woreda VARCHAR(100),
    address_city VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users/Staff Table (Doctors, Nurses, Admin)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('Admin', 'Doctor', 'Nurse', 'Pharmacist', 'Lab_Tech')),
    specialty VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Encounters/Visits Table
CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES users(id),
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    encounter_type VARCHAR(20) CHECK (encounter_type IN ('OPD', 'Emergency', 'Inpatient', 'Follow-up')),
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    physical_examination TEXT,
    plan TEXT,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled'))
);

-- Vital Signs Table
CREATE TABLE vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
    temperature DECIMAL(4,1), -- Celsius
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    spo2 INTEGER, -- Oxygen Saturation
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Diagnoses Table (ICD-10)
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
    icd10_code VARCHAR(10),
    diagnosis_description TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory/Drugs Table
CREATE TABLE drugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generic_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    form VARCHAR(50), -- Tablet, Injection, Syrup, etc.
    strength VARCHAR(50), -- 500mg, 10mg/ml, etc.
    stock_quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2),
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions Table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
    drug_id UUID REFERENCES drugs(id),
    dosage VARCHAR(100), -- 1 tab twice daily
    duration VARCHAR(50), -- 5 days
    instructions TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Dispensed', 'Cancelled')),
    prescribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff Table
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50),
    shift VARCHAR(20) DEFAULT 'Day',
    status VARCHAR(20) DEFAULT 'On Duty',
    education TEXT,
    license VARCHAR(100),
    experience TEXT,
    surgeries JSONB DEFAULT '[]',
    training JSONB DEFAULT '[]',
    awards JSONB DEFAULT '[]',
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Asset Management Table
CREATE TABLE assets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    serial VARCHAR(100),
    qty INTEGER DEFAULT 1,
    weight VARCHAR(50),
    supplier VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Functional',
    location VARCHAR(100),
    rfid_tag VARCHAR(100),
    barcode VARCHAR(100),
    photo_url TEXT,
    added_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

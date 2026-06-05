-- PostgreSQL Schema for Clinical Trial Electronic Data Capture (EDC)
-- Compliant with 21 CFR Part 11 and CDISC standards

CREATE TABLE protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_number VARCHAR(100) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    version VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'AMENDED', 'ARCHIVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    investigator_name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID REFERENCES protocols(id) ON DELETE RESTRICT,
    site_id UUID REFERENCES sites(id) ON DELETE RESTRICT,
    subject_number VARCHAR(50) NOT NULL,
    randomization_group VARCHAR(100),
    randomization_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'SCREENING' CHECK (status IN ('SCREENING', 'ACTIVE', 'COMPLETED', 'WITHDRAWN', 'SCREEN_FAILURE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(protocol_id, subject_number)
);

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    target_day INT NOT NULL,
    window_minus INT NOT NULL,
    window_plus INT NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    UNIQUE(protocol_id, code)
);

CREATE TABLE subject_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE RESTRICT,
    scheduled_date DATE NOT NULL,
    actual_date DATE,
    status VARCHAR(50) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'MISSED', 'COMPLETED', 'BYPASSED')),
    UNIQUE(subject_id, visit_id)
);

CREATE TABLE crf_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    schema_json JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(protocol_id, visit_id, name, version)
);

CREATE TABLE crf_data_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_visit_id UUID REFERENCES subject_visits(id) ON DELETE CASCADE,
    crf_definition_id UUID REFERENCES crf_definitions(id) ON DELETE RESTRICT,
    data_json JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'SIGNED', 'FROZEN')),
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_visit_id, crf_definition_id)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SIGN', 'QUERY_RAISE', 'QUERY_RESOLVE')),
    old_values JSONB,
    new_values JSONB,
    performed_by VARCHAR(100) NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    reason_for_change TEXT NOT NULL,
    previous_hash VARCHAR(64),
    current_hash VARCHAR(64) NOT NULL
);

CREATE TABLE queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crf_data_entry_id UUID REFERENCES crf_data_entries(id) ON DELETE CASCADE,
    field_key VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ANSWERED', 'RESOLVED', 'CLOSED')),
    query_text TEXT NOT NULL,
    raised_by VARCHAR(100) NOT NULL,
    raised_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_text TEXT,
    response_text TEXT
);

CREATE TABLE signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    signed_by VARCHAR(100) NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    signature_meaning TEXT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    public_key TEXT NOT NULL,
    signature_value TEXT NOT NULL
);

CREATE TABLE randomization_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
    kit_number VARCHAR(100) UNIQUE NOT NULL,
    treatment_arm VARCHAR(100) NOT NULL,
    is_allocated BOOLEAN DEFAULT FALSE,
    allocated_to_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    allocated_at TIMESTAMP WITH TIME ZONE,
    sequence_number INT NOT NULL
);

CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_crf_data_entries_subject_visit ON crf_data_entries(subject_visit_id);
CREATE INDEX idx_queries_crf_entry ON queries(crf_data_entry_id);
CREATE INDEX idx_subjects_protocol ON subjects(protocol_id);
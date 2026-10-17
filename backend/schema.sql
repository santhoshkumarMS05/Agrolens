-- AgroLens database schema. Safe to re-run (everything is IF NOT EXISTS).

-- 1. Users table (authentication & user profile)
CREATE TABLE IF NOT EXISTS users (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name      VARCHAR(80)  NOT NULL,
    email          VARCHAR(254) NOT NULL,
    password_hash  TEXT         NOT NULL,
    role           VARCHAR(20)  NOT NULL DEFAULT 'farmer',
    district       VARCHAR(120),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_login_at  TIMESTAMPTZ
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS district VARCHAR(120);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (lower(email));

-- 2. Disease prediction history table (per-user history)
CREATE TABLE IF NOT EXISTS disease_history (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_name         VARCHAR(255),
    image_path         TEXT NOT NULL,
    gradcam_image      TEXT,
    predicted_disease  VARCHAR(150) NOT NULL,
    crop               VARCHAR(80),
    confidence         FLOAT NOT NULL,
    severity           VARCHAR(50),
    diagnosis          TEXT,
    treatment          TEXT,
    fertilizer         TEXT,
    admin_note         TEXT,
    admin_note_at      TIMESTAMPTZ,
    admin_noted_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backward-compatible columns migration
ALTER TABLE disease_history ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE disease_history ADD COLUMN IF NOT EXISTS admin_note_at TIMESTAMPTZ;
ALTER TABLE disease_history ADD COLUMN IF NOT EXISTS admin_noted_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- Index for fast per-user history retrieval sorted newest first
CREATE INDEX IF NOT EXISTS disease_history_user_idx
    ON disease_history (user_id, created_at DESC);

-- 3. Login attempts (optional rate-limiting)
CREATE TABLE IF NOT EXISTS login_attempts (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         VARCHAR(254) NOT NULL,
    ip            VARCHAR(45)  NOT NULL,
    succeeded     BOOLEAN      NOT NULL,
    attempted_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_attempts_email_time_idx
    ON login_attempts (lower(email), attempted_at DESC);

-- 4. Continuous Learning Staging Queue (Active Learning Pool)
CREATE TABLE IF NOT EXISTS training_queue (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    image_name      VARCHAR(255) NOT NULL,
    image_path      TEXT NOT NULL,
    proposed_class  VARCHAR(150) NOT NULL,
    crop            VARCHAR(80),
    confidence      FLOAT NOT NULL,
    crop_score      FLOAT,
    source          VARCHAR(50) DEFAULT 'nova_lite',  -- 'nova_lite', 'farmer_report', 'edge_case'
    status          VARCHAR(30) DEFAULT 'pending',    -- 'pending', 'approved', 'rejected', 'trained'
    reviewed_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS training_queue_status_idx ON training_queue (status, created_at DESC);
CREATE INDEX IF NOT EXISTS training_queue_class_idx ON training_queue (proposed_class, status);

-- 5. Model Continuous Learning Training Runs
CREATE TABLE IF NOT EXISTS model_training_history (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    target_class    VARCHAR(150) NOT NULL,
    images_count    INTEGER NOT NULL,
    train_loss      FLOAT,
    val_accuracy    FLOAT,
    checkpoint_path TEXT,
    onnx_path       TEXT,
    trained_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Outbreak Alerts & Geofenced District Warnings
CREATE TABLE IF NOT EXISTS outbreak_alerts (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    crop                  VARCHAR(80) NOT NULL,
    disease               VARCHAR(150) NOT NULL,
    district              VARCHAR(100) NOT NULL DEFAULT 'All Districts',
    severity              VARCHAR(50) NOT NULL DEFAULT 'High',
    alert_title           VARCHAR(255) NOT NULL,
    alert_message         TEXT NOT NULL,
    preventative_advisory TEXT,
    farmer_count          INTEGER DEFAULT 0,
    status                VARCHAR(30) DEFAULT 'active', -- 'active', 'broadcasted', 'resolved'
    broadcasted_at        TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Farmer In-App Notifications
CREATE TABLE IF NOT EXISTS farmer_notifications (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
    alert_id   BIGINT REFERENCES outbreak_alerts(id) ON DELETE SET NULL,
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,
    crop       VARCHAR(80),
    is_read    BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. LLM API Usage & Cost Monitoring (Groq + AWS Bedrock Nova Lite)
CREATE TABLE IF NOT EXISTS llm_api_logs (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider           VARCHAR(50) NOT NULL, -- 'aws_bedrock_nova_lite' | 'groq'
    model_name         VARCHAR(100) NOT NULL,
    endpoint_purpose   VARCHAR(100) NOT NULL, -- 'teacher_escalation', 'stage_vision', 'stage_advisory', 'crop_doctor_chat'
    prompt_tokens      INTEGER NOT NULL DEFAULT 0,
    completion_tokens  INTEGER NOT NULL DEFAULT 0,
    total_tokens       INTEGER NOT NULL DEFAULT 0,
    latency_ms         INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0.0,
    status             VARCHAR(20) NOT NULL DEFAULT 'success',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS llm_api_logs_provider_idx ON llm_api_logs (provider, created_at DESC);


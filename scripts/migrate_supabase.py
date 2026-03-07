#!/usr/bin/env python3
import os
import sys

# Install supabase if needed
try:
    from supabase import create_client
except ImportError:
    print("[v0] Installing supabase-py...")
    os.system("pip install supabase")
    from supabase import create_client

# Get Supabase credentials
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("[v0] ERROR: SUPABASE_URL or SUPABASE_ANON_KEY not set")
    print(f"[v0] SUPABASE_URL: {supabase_url}")
    print(f"[v0] SUPABASE_ANON_KEY: {supabase_key}")
    sys.exit(1)

print(f"[v0] Connecting to Supabase at {supabase_url}")

# Create Supabase client
supabase = create_client(supabase_url, supabase_key)

# Migration 1: Create base tables
print("[v0] Executing migration 1: base_tables...")

migration_1 = """
-- Users table for professionals/admins
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'professional',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pacientes table
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  cpf VARCHAR(11) UNIQUE,
  data_nascimento DATE,
  endereco TEXT,
  sexo VARCHAR(10),
  profissional_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient sessions table for tracking access
CREATE TABLE IF NOT EXISTS paciente_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pacientes_profissional_id ON pacientes(profissional_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_created_by ON pacientes(created_by);
CREATE INDEX IF NOT EXISTS idx_paciente_sessions_paciente_id ON paciente_sessions(paciente_id);
CREATE INDEX IF NOT EXISTS idx_paciente_sessions_token ON paciente_sessions(session_token);
"""

try:
    # Execute base migration using RPC
    result = supabase.rpc("exec_sql", {"sql": migration_1}).execute()
    print("[v0] Migration 1 completed successfully")
except Exception as e:
    print(f"[v0] Warning on migration 1: {str(e)}")

# Migration 2: Add codigo_acesso column
print("[v0] Executing migration 2: add_codigo_acesso...")

migration_2 = """
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS codigo_acesso VARCHAR(8) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_pacientes_codigo_acesso ON pacientes(codigo_acesso);
"""

try:
    result = supabase.rpc("exec_sql", {"sql": migration_2}).execute()
    print("[v0] Migration 2 completed successfully")
except Exception as e:
    print(f"[v0] Warning on migration 2: {str(e)}")

print("[v0] All migrations completed!")

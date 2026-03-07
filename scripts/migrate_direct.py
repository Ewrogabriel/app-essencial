#!/usr/bin/env python3
import os
import sys

try:
    import psycopg2
except ImportError:
    print("[v0] Installing psycopg2...")
    os.system("pip install psycopg2-binary -q")
    import psycopg2

# Get database URL from environment
postgres_url = os.environ.get("POSTGRES_URL") or os.environ.get("POSTGRES_URL_NON_POOLING")

if not postgres_url:
    print("[v0] ERROR: POSTGRES_URL environment variable not set")
    print("[v0] Available env vars:", list(os.environ.keys())[:10])
    sys.exit(1)

# SQL migrations
migrations = [
    # Migration 1: Create base tables
    """
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255),
      nome VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pacientes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      telefone VARCHAR(20),
      data_nascimento DATE,
      cpf VARCHAR(11),
      sexo VARCHAR(10),
      profissional_id UUID REFERENCES users(id) ON DELETE SET NULL,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      endereco VARCHAR(255),
      numero VARCHAR(10),
      complemento VARCHAR(255),
      bairro VARCHAR(100),
      cidade VARCHAR(100),
      estado VARCHAR(2),
      cep VARCHAR(8),
      responsavel_nome VARCHAR(255),
      responsavel_email VARCHAR(255),
      responsavel_telefone VARCHAR(20),
      responsavel_cpf VARCHAR(11),
      responsavel_parentesco VARCHAR(50),
      responsavel_endereco VARCHAR(255),
      responsavel_numero VARCHAR(10),
      responsavel_complemento VARCHAR(255),
      responsavel_bairro VARCHAR(100),
      responsavel_cidade VARCHAR(100),
      responsavel_estado VARCHAR(2),
      responsavel_cep VARCHAR(8)
    );

    CREATE INDEX IF NOT EXISTS idx_pacientes_profissional_id ON pacientes(profissional_id);
    CREATE INDEX IF NOT EXISTS idx_pacientes_created_by ON pacientes(created_by);
    CREATE INDEX IF NOT EXISTS idx_pacientes_email ON pacientes(email);
    CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);
    """,
    
    # Migration 2: Add codigo_acesso column
    """
    ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS codigo_acesso VARCHAR(8) UNIQUE;

    CREATE TABLE IF NOT EXISTS paciente_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
      session_token VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days',
      remember_me BOOLEAN DEFAULT false,
      last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_pacientes_codigo_acesso ON pacientes(codigo_acesso);
    CREATE INDEX IF NOT EXISTS idx_paciente_sessions_token ON paciente_sessions(session_token);
    CREATE INDEX IF NOT EXISTS idx_paciente_sessions_paciente_id ON paciente_sessions(paciente_id);
    """
]

try:
    conn = psycopg2.connect(postgres_url)
    cursor = conn.cursor()
    
    for i, migration_sql in enumerate(migrations, 1):
        print(f"[v0] Executing migration {i}...")
        try:
            cursor.execute(migration_sql)
            conn.commit()
            print(f"[v0] ✓ Migration {i} completed")
        except Exception as e:
            conn.rollback()
            print(f"[v0] ✗ Error in migration {i}: {str(e)}")
    
    cursor.close()
    conn.close()
    print("[v0] All migrations completed successfully!")
    
except Exception as e:
    print(f"[v0] Database connection error: {str(e)}")
    sys.exit(1)

#!/usr/bin/env python3
import os
import sys

try:
    import psycopg2
except ImportError:
    print("[v0] Installing psycopg2-binary...")
    os.system("pip install psycopg2-binary")
    import psycopg2

from urllib.parse import urlparse

# Get database URL
postgres_url = os.environ.get("POSTGRES_URL")
if not postgres_url:
    print("[v0] ERROR: POSTGRES_URL not set")
    sys.exit(1)

# Parse URL
parsed = urlparse(postgres_url)
hostname = parsed.hostname
port = parsed.port or 5432
username = parsed.username
password = parsed.password
database = parsed.path.lstrip("/") or "postgres"

print(f"[v0] Connecting to {hostname}:{port} as {username}...")

try:
    conn = psycopg2.connect(
        host=hostname,
        port=port,
        user=username,
        password=password,
        database=database
    )
    cur = conn.cursor()
    print("[v0] Connected successfully!")

    # SQL for creating tables
    migrations = [
        # Create users table
        """
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255),
            full_name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        
        # Create pacientes table
        """
        CREATE TABLE IF NOT EXISTS pacientes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            nome VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            telefone VARCHAR(20),
            cpf VARCHAR(20) UNIQUE,
            data_nascimento DATE,
            genero VARCHAR(20),
            endereco TEXT,
            cidade VARCHAR(100),
            estado VARCHAR(2),
            cep VARCHAR(10),
            profissional_id UUID,
            created_by UUID,
            codigo_acesso VARCHAR(8) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (profissional_id) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );
        """,
        
        # Create paciente_sessions table
        """
        CREATE TABLE IF NOT EXISTS paciente_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            paciente_id UUID NOT NULL,
            session_token VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
        );
        """,
        
        # Create indexes
        """
        CREATE INDEX IF NOT EXISTS idx_pacientes_codigo_acesso ON pacientes(codigo_acesso);
        """,
        
        """
        CREATE INDEX IF NOT EXISTS idx_paciente_sessions_token ON paciente_sessions(session_token);
        """,
        
        """
        CREATE INDEX IF NOT EXISTS idx_paciente_sessions_paciente_id ON paciente_sessions(paciente_id);
        """
    ]

    for i, sql in enumerate(migrations, 1):
        try:
            print(f"[v0] Executing migration {i}...")
            cur.execute(sql)
            conn.commit()
            print(f"[v0] Migration {i} completed successfully!")
        except psycopg2.Error as e:
            print(f"[v0] Error in migration {i}: {e}")
            conn.rollback()

    cur.close()
    conn.close()
    print("[v0] All migrations completed successfully!")

except Exception as e:
    print(f"[v0] Error: {e}")
    sys.exit(1)

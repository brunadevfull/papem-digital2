-- Script de Setup Completo do Banco de Dados
-- Sistema de Visualização da Marinha
-- Execute este script para criar todas as tabelas necessárias

-- Criar banco de dados (se necessário)
-- CREATE DATABASE marinha_display;

-- Usar o banco
-- \c marinha_display;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de avisos
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('plasa', 'bono', 'escala', 'cardapio')),
    category TEXT CHECK (category IN ('oficial', 'praca')),
    active BOOLEAN NOT NULL DEFAULT true,
    upload_date TIMESTAMP DEFAULT NOW()
);

-- Tabela de oficiais de serviço (estrutura simplificada)
CREATE TABLE IF NOT EXISTS duty_officers (
    id SERIAL PRIMARY KEY,
    officer_name TEXT NOT NULL DEFAULT '', -- Nome completo com graduação: "1º Tenente KARINE"
    master_name TEXT NOT NULL DEFAULT '',  -- Nome completo com graduação: "1º Sargento RAFAELA"
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notices_active ON notices(active);
CREATE INDEX IF NOT EXISTS idx_notices_dates ON notices(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(active);

-- Inserir usuário padrão admin (senha: admin123)
INSERT INTO users (username, password) 
VALUES ('admin', '$2b$10$rOvAl5.tQ5w5w5w5w5w5w5w5w5w5w5w5w5w5w5w5w5w5w5w5w5w5w')
ON CONFLICT (username) DO NOTHING;

-- Inserir dados exemplo (opcional)
-- INSERT INTO notices (title, content, priority, start_date, end_date) 
-- VALUES ('Bem-vindo', 'Sistema de visualização ativo', 'medium', NOW(), NOW() + INTERVAL '30 days')
-- ON CONFLICT DO NOTHING;

-- Trigger para auto-atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas relevantes
DROP TRIGGER IF EXISTS update_notices_updated_at ON notices;
CREATE TRIGGER update_notices_updated_at 
    BEFORE UPDATE ON notices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_duty_officers_updated_at ON duty_officers;
CREATE TRIGGER update_duty_officers_updated_at 
    BEFORE UPDATE ON duty_officers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Permissões (ajustar conforme necessário)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO navy_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO navy_user;

-- Verificar criação das tabelas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

COMMIT;
-- ========================================
-- BACKUP COMPLETO DO SISTEMA DA MARINHA
-- Data: 08/07/2025
-- Todas as tabelas e dados do PostgreSQL
-- ========================================

-- 1. CRIAR TODAS AS TABELAS
-- ========================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de militares
CREATE TABLE IF NOT EXISTS military_personnel (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  rank TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('officer', 'master')),
  specialty TEXT,
  full_rank_name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duty_role TEXT
);

-- Tabela de avisos/notices
CREATE TABLE IF NOT EXISTS notices (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  type TEXT,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de oficiais de serviço
CREATE TABLE IF NOT EXISTS duty_officers (
  id SERIAL PRIMARY KEY,
  officer_name TEXT,
  master_name TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  officer_id INTEGER REFERENCES military_personnel(id),
  master_id INTEGER REFERENCES military_personnel(id)
);

-- 2. INSERIR TODOS OS DADOS
-- ========================================

-- Limpar tabelas antes de inserir (para restore limpo)
TRUNCATE TABLE duty_officers CASCADE;
TRUNCATE TABLE military_personnel RESTART IDENTITY CASCADE;
TRUNCATE TABLE notices RESTART IDENTITY CASCADE;
TRUNCATE TABLE documents RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- INSERIR TODOS OS MILITARES (47 REGISTROS)
-- ========================================

INSERT INTO military_personnel (id, name, rank, type, specialty, full_rank_name, active, created_at, updated_at, duty_role) VALUES
(7, 'YAGO', 'ct', 'officer', 'IM', 'Capitão-Tenente', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(8, 'MATEUS BARBOSA', 'ct', 'officer', 'IM', 'Capitão-Tenente', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(9, 'LARISSA CASTRO', '1t', 'officer', 'RM2-T', 'Primeiro-Tenente', true, '2025-07-03 23:47:52.31645', '2025-07-08 05:01:15.609301', null),
(10, 'ALEXANDRIA', '1t', 'officer', 'IM', 'Primeiro-Tenente', true, '2025-07-03 23:47:52.31645', '2025-07-08 05:31:03.086336', 'officer'),
(11, 'TAMIRES', '1t', 'officer', 'QC-IM', 'Primeiro-Tenente', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(12, 'KARINE', '1t', 'officer', 'RM2-T', 'Primeiro-Tenente', true, '2025-07-03 23:47:52.31645', '2025-07-08 04:12:47.023774', null),
(13, 'RONALD CHAVES', '1t', 'officer', 'AA', 'Primeiro-Tenente', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(14, 'PINA TRIGO', '1t', 'officer', 'RM2-T', 'Primeiro-Tenente', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(15, 'LEONARDO ANDRADE', '1t', 'officer', 'IM', 'Primeiro-Tenente', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(16, 'ELIEZER', '1t', 'officer', 'IM', '1º Tenente ELIEZER', true, '2025-07-03 23:47:52.31645', '2025-07-06 21:36:02.743484', null),
(17, 'MARCIO MARTINS', '2t', 'officer', 'AA', 'Segundo-Tenente', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(18, 'MACHADO', '2t', 'officer', 'AA', 'Segundo-Tenente', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(19, 'SALES', '1sg', 'master', 'PL', 'Primeiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(20, 'LEANDRO', '1sg', 'master', 'EP', 'Primeiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(21, 'ELIANE', '1sg', 'master', 'CL', 'Primeiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(22, 'RAFAELA', '1sg', 'master', 'CL', 'Primeiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(23, 'SILVIA HELENA', '1sg', 'master', 'QI', 'Primeiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(24, 'DA SILVA', '1sg', 'master', 'ES', 'Primeiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(25, 'BEIRUTH', '1sg', 'master', 'PD', 'Primeiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(26, 'CARLA2', '1sg', 'master', 'CL', 'Primeiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-08 05:31:43.680345', 'master'),
(27, 'ALICE', '2sg', 'master', 'CL', 'Segundo-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(28, 'DIEGO', '2sg', 'master', 'ES', 'Segundo-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(29, 'CANESCHE', '2sg', 'master', 'EL', 'Segundo-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(30, 'NIBI', '2sg', 'master', 'ES', 'Segundo-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(31, 'MONIQUE', '2sg', 'master', 'PD', 'Segundo-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(32, 'DAMASCENO', '2sg', 'master', 'CL', 'Segundo-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(33, 'SOUZA LIMA', '2sg', 'master', 'BA', 'Segundo-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(34, 'SANT''ANNA', '2sg', 'master', 'MO', 'Segundo-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(35, 'AFONSO', '2sg', 'master', 'SI', 'Segundo-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(36, 'MEIRELES', '2sg', 'master', 'MR', 'Segundo-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(37, 'BRUNA ROCHA', '2sg', 'master', 'PD', 'Segundo-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(38, 'ARIANNE', '2sg', 'master', 'AD', 'Segundo-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(39, 'MAYARA', '3sg', 'master', 'AD', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(40, 'MÁRCIA', '3sg', 'master', 'AD', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(41, 'JUSTINO', '3sg', 'master', 'OS', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(42, 'JONAS', '3sg', 'master', 'AD', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(43, 'THAÍS SILVA', '3sg', 'master', 'PD', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(44, 'SABRINA', '3sg', 'master', 'AD', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(45, 'TAINÁ NEVES', '3sg', 'master', 'AD', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(46, 'AMANDA PAULINO', '3sg', 'master', 'AD', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(47, 'ANA BEATHRIZ', '3sg', 'master', 'AD', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(48, 'KEVIN', '3sg', 'master', 'MO', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(49, 'JORGE', '3sg', 'master', 'CI', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(50, 'ALAN', '3sg', 'master', 'BA', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(51, 'HUGO', '3sg', 'master', 'EL', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(52, 'FERNANDES', '3sg', 'master', 'AM', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null),
(53, 'LUCAS SANTOS', '3sg', 'master', 'AM', 'Terceiro-Sargento', true, '2025-07-03 23:47:52.31645', '2025-07-03 23:47:52.31645', null);

-- INSERIR AVISOS
-- ========================================

INSERT INTO notices (id, title, content, priority, start_date, end_date, active, created_at, updated_at) VALUES
(1, 'teste', 'teste', 'medium', '2025-07-06 20:54:39.158', '2025-07-07 20:54:39.158', true, '2025-07-06 20:54:57.474142', '2025-07-06 20:54:57.474142');

-- INSERIR OFICIAIS DE SERVIÇO
-- ========================================

INSERT INTO duty_officers (id, officer_name, master_name, updated_at, officer_id, master_id) VALUES
(1, '1T (IM) ALEXANDRIA', '1SG (CL) CARLA2', '2025-07-08 04:12:22.943846', 10, 26);

-- RESETAR SEQUENCES PARA PRÓXIMOS INSERTS
-- ========================================

SELECT setval('military_personnel_id_seq', 53, true);
SELECT setval('notices_id_seq', 1, true);
SELECT setval('duty_officers_id_seq', 1, true);
SELECT setval('documents_id_seq', 1, false);
SELECT setval('users_id_seq', 1, false);

-- ========================================
-- FIM DO BACKUP
-- Total: 47 militares, 1 aviso, 1 oficial de serviço
-- Para restaurar: psql -d sua_base < backup-completo-banco.sql
-- ========================================

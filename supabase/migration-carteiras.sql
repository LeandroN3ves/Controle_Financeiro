-- =============================================
-- FinControl — Migração: Carteiras
-- =============================================
-- Cole este script no SQL Editor do Supabase e clique "Run"

-- 1. Tabela carteiras
CREATE TABLE IF NOT EXISTS carteiras (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nome        text NOT NULL,
  cor         text NOT NULL DEFAULT '#7c5cff',
  saldo       numeric NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE carteiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_carteiras" ON carteiras FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "insert_own_carteiras" ON carteiras FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "update_own_carteiras" ON carteiras FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "delete_own_carteiras" ON carteiras FOR DELETE USING (auth.uid() = usuario_id);

-- 2. Adicionar coluna carteira_id na tabela gastos
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS carteira_id uuid REFERENCES carteiras(id) ON DELETE SET NULL;

-- 3. Índice para performance
CREATE INDEX IF NOT EXISTS idx_carteiras_usuario ON carteiras(usuario_id);

-- =============================================
-- FinControl — Setup Supabase (SQL Editor)
-- =============================================
-- Cole este script inteiro no SQL Editor do Supabase e clique "Run"

-- 1. Tabela profiles
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nome        text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Tabela gastos
CREATE TABLE IF NOT EXISTS gastos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nome            text NOT NULL,
  valor           numeric NOT NULL,
  vencimento      date NOT NULL,
  tipo            text CHECK (tipo IN ('fixo', 'parcelado')) NOT NULL,
  parcela_atual   int DEFAULT NULL,
  total_parcelas  int DEFAULT NULL,
  pago            boolean DEFAULT false,
  mes_ref         text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_gastos" ON gastos FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "insert_own_gastos" ON gastos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "update_own_gastos" ON gastos FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "delete_own_gastos" ON gastos FOR DELETE USING (auth.uid() = usuario_id);

-- 3. Tabela saldo
CREATE TABLE IF NOT EXISTS saldo (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  valor_disponivel numeric NOT NULL DEFAULT 0,
  mes_ref          text NOT NULL,
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE saldo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_saldo" ON saldo FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "insert_own_saldo" ON saldo FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "update_own_saldo" ON saldo FOR UPDATE USING (auth.uid() = usuario_id);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_gastos_usuario_mes ON gastos(usuario_id, mes_ref);
CREATE INDEX IF NOT EXISTS idx_saldo_usuario_mes ON saldo(usuario_id, mes_ref);

-- 5. Unique constraint para saldo (1 por usuário/mês)
ALTER TABLE saldo ADD CONSTRAINT unique_saldo_usuario_mes UNIQUE (usuario_id, mes_ref);

-- 6. Trigger para criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

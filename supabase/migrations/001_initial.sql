-- Algoja Servis - inicializacija baze podatkov

-- Profili serviserjev (vezani na Supabase Auth)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ime text NOT NULL,
  priimek text NOT NULL,
  vloga text NOT NULL DEFAULT 'serviser', -- 'admin' | 'serviser'
  aktiven boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Stranke
CREATE TABLE stranke (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naziv text NOT NULL,
  naslov text,
  lokacija text,
  telefon text,
  kontakt_oseba text,
  opombe text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Stroji
CREATE TABLE stroji (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naziv text NOT NULL,
  model text,
  serijska text,
  stranka_id uuid REFERENCES stranke(id) ON DELETE SET NULL,
  opombe text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Servisni nalogi
CREATE TABLE nalogi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stevilka text UNIQUE NOT NULL, -- SN-2025-001
  datum date NOT NULL,

  -- Stranka (podatki ob času naloga)
  stranka_id uuid REFERENCES stranke(id) ON DELETE SET NULL,
  stranka_naziv text NOT NULL,
  stranka_lokacija text,
  stranka_telefon text,

  -- Stroj (podatki ob času naloga)
  stroj_id uuid REFERENCES stroji(id) ON DELETE SET NULL,
  stroj_naziv text,
  stroj_serijska text,

  -- Delo
  opis_dela text,
  rezervni_deli text,
  st_ur numeric(6,2),
  km numeric(6,1),

  -- Serviserji (array imen)
  serviserji text[] NOT NULL DEFAULT '{}',

  -- Podpis
  podpis_url text,

  -- Status
  status text NOT NULL DEFAULT 'odprt', -- 'odprt' | 'zakljucen'

  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Avto-increment za stevilko naloga
CREATE SEQUENCE nalog_seq START 1;

-- Funkcija za generiranje stevilke
CREATE OR REPLACE FUNCTION generate_nalog_stevilka()
RETURNS text AS $$
DECLARE
  year_str text;
  seq_num int;
BEGIN
  year_str := to_char(CURRENT_DATE, 'YYYY');
  seq_num := nextval('nalog_seq');
  RETURN 'SN-' || year_str || '-' || LPAD(seq_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger za updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stranke_updated_at BEFORE UPDATE ON stranke
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER stroji_updated_at BEFORE UPDATE ON stroji
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER nalogi_updated_at BEFORE UPDATE ON nalogi
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stranke ENABLE ROW LEVEL SECURITY;
ALTER TABLE stroji ENABLE ROW LEVEL SECURITY;
ALTER TABLE nalogi ENABLE ROW LEVEL SECURITY;

-- Vsak prijavljeni uporabnik ima dostop do vseh podatkov
CREATE POLICY "authenticated_all" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON stranke FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON stroji FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON nalogi FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Supabase Storage bucket za podpise
INSERT INTO storage.buckets (id, name, public) VALUES ('podpisi', 'podpisi', false);
CREATE POLICY "authenticated_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'podpisi');
CREATE POLICY "authenticated_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'podpisi');

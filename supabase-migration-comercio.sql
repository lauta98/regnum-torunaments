-- =====================================================
-- CoR — Migración: Comercio (ex Regnum Market)
-- Ejecutar en el SQL Editor de Supabase del proyecto de Torneos
-- (vaycrixxhupnggdntojg), después de la migración de personajes.
--
-- Trae las tablas de Regnum Market a la misma base de datos que
-- Torneos, con las columnas reales usadas por rpg-marketplace-v2
-- (relevadas del código, no de un schema.sql desactualizado).
--
-- Nota de diseño: por simplicidad y para minimizar riesgo, estas
-- tablas siguen referenciando auth.users(id) directamente (igual
-- que en el Market original), en vez de public.players(id). Es
-- decir: una sola base de datos para todo, pero por ahora sin
-- fusionar el modelo de identidad de Torneos y Comercio en una
-- sola tabla — eso puede hacerse después sin romper nada de esto.
-- =====================================================

-- ── 1. PROFILES (identidad de Comercio) ───────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        text UNIQUE,
  discord         text,              -- discord_username, ej "usuario#0001" o "usuario"
  discord_id      text,              -- snowflake id de Discord
  whatsapp        text,
  regnum_nick     text,
  avg_rating      numeric(3,2) NOT NULL DEFAULT 0,
  total_reviews   integer NOT NULL DEFAULT 0,
  is_premium      boolean NOT NULL DEFAULT false,
  last_sign_in_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 2. LISTINGS (publicaciones) ───────────────────────
CREATE TABLE IF NOT EXISTS public.listings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id         text UNIQUE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             text NOT NULL CHECK (type IN ('sell','buy')),
  item_name        text NOT NULL,
  item_category    text NOT NULL,
  subcategoria     text,
  rareza           text,
  reino            text CHECK (reino IN ('Syrtis','Ignis','Alsius')),
  clase_requerida  text,
  subclase_requerida text,
  item_image_url   text,
  image_urls       text[],
  is_set           boolean DEFAULT false,
  description      text,
  price_gold       numeric,
  price_money      numeric,
  currency_label   text,
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active','reserved','completed')),
  views            integer NOT NULL DEFAULT 0,
  featured         boolean NOT NULL DEFAULT false,
  featured_until   timestamptz,

  -- Estadísticas de ítem (armas/armaduras)
  dano_tipo_1      text, dano_min_1 integer, dano_max_1 integer,
  dano_tipo_2      text, dano_min_2 integer, dano_max_2 integer,
  velocidad        text,
  rango            integer,
  material         text,
  estado           text,          -- calidad: normal/superior/maestre, etc.
  slot_1 text, slot_2 text, slot_3 text, slot_4 text, slot_5 text, slot_6 text,
  armadura_base    integer,
  armadura_bonus   integer,
  res_cortante     integer, res_punzante integer, res_aplastante integer,
  res_fuego        integer, res_hielo integer, res_electrico integer,
  mejora_1         text, mejora_2 text,
  muesca_1_tipo    text, muesca_1_gema text,

  created_at       timestamptz NOT NULL DEFAULT now(),
  last_bumped_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 3. FAVORITES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id  uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

-- ── 4. WATCHLIST (alertas por categoría/rareza/palabra clave) ──
CREATE TABLE IF NOT EXISTS public.watchlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria  text NOT NULL,
  rareza     text,
  tipo       text NOT NULL DEFAULT 'any',
  keyword    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 5. REPORTS (publicaciones reportadas) ─────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id   uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reason       text NOT NULL,
  details      text,
  resolved     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 6. NOTIFICATIONS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  listing_id  uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 7. TRANSACTIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confirmed_by_seller boolean NOT NULL DEFAULT false,
  confirmed_by_buyer  boolean NOT NULL DEFAULT false,
  completed_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── 8. MESSAGES (chat por transacción) ────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  sender_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content        text NOT NULL CHECK (char_length(content) <= 500),
  read_by_other  boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 9. REVIEWS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  reviewer_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score          integer NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment        text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transaction_id, reviewer_id)
);

-- ── 10. PRICE HISTORY (para el historial de precios por ítem) ──
CREATE TABLE IF NOT EXISTS public.price_history (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id     uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  item_name      text NOT NULL,
  price_gold     numeric,
  price_money    numeric,
  currency_label text,
  rareza         text,
  completed_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Trigger: crear profile automáticamente al registrarse ─────
-- (además del auto-link de Discord que ya maneja Torneos en players;
--  esto crea el registro de Comercio la primera vez que hace falta)
CREATE OR REPLACE FUNCTION public.ensure_comercio_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, discord, discord_id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'user_name'),
    NEW.raw_user_meta_data->>'provider_id',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_comercio ON auth.users;
CREATE TRIGGER on_auth_user_created_comercio
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_comercio_profile();

-- ── Índices ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_listings_status   ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(item_category);
CREATE INDEX IF NOT EXISTS idx_listings_user      ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user     ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_tx        ON public.messages(transaction_id);
CREATE INDEX IF NOT EXISTS idx_price_history_item ON public.price_history(item_name);

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Lectura pública de lo que es catálogo/reputación
CREATE POLICY "profiles_read_all"      ON public.profiles      FOR SELECT USING (true);
CREATE POLICY "listings_read_all"      ON public.listings      FOR SELECT USING (true);
CREATE POLICY "price_history_read_all" ON public.price_history FOR SELECT USING (true);

-- Cada usuario administra lo suyo
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "listings_insert_own" ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "listings_update_own" ON public.listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "listings_delete_own" ON public.listings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "favorites_all_own" ON public.favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "watchlist_all_own" ON public.watchlist FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_read_own"   ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "notifications_all_own" ON public.notifications FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "transactions_read_parties" ON public.transactions FOR SELECT
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);
CREATE POLICY "transactions_update_parties" ON public.transactions FOR UPDATE
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);
CREATE POLICY "transactions_insert_buyer" ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "messages_read_parties" ON public.messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id
            AND (t.seller_id = auth.uid() OR t.buyer_id = auth.uid()))
  );
CREATE POLICY "messages_insert_parties" ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id
            AND (t.seller_id = auth.uid() OR t.buyer_id = auth.uid()))
  );

CREATE POLICY "reviews_read_all"    ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own"  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Acceso total para el service role (rutas admin del servidor)
CREATE POLICY "service_all_profiles"      ON public.profiles      FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_listings"      ON public.listings      FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_favorites"     ON public.favorites     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_watchlist"     ON public.watchlist     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_reports"       ON public.reports       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_notifications" ON public.notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_transactions"  ON public.transactions  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_messages"      ON public.messages      FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_reviews"       ON public.reviews       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_price_history" ON public.price_history FOR ALL USING (auth.role() = 'service_role');

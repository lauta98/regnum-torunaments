-- =====================================================
-- CoR Tournament Stats — Cuenta Premium
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- ── 1. COLUMNAS EN PLAYERS ─────────────────────────────
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS es_premium    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_desde timestamptz,
  ADD COLUMN IF NOT EXISTS premium_theme text;

ALTER TABLE public.players
  ADD CONSTRAINT premium_theme_valido CHECK (
    premium_theme IS NULL OR premium_theme IN ('dorado','cian','purpura','legendario','syrtis','ignis','alsius')
  ),
  ADD CONSTRAINT premium_theme_requiere_premium CHECK (
    premium_theme IS NULL OR es_premium = true
  );

-- ── 2. TRIGGER: es_premium/premium_desde solo por service role ──
-- `players_update_own` (schema.sql) deja que cada jugador edite cualquier
-- columna de su propia fila desde el cliente (a propósito, lo usa
-- ElegirPrincipal). Sin este trigger, cualquiera podría hacer
-- `update players set es_premium = true` desde la consola del navegador.
CREATE OR REPLACE FUNCTION public.lock_premium_columns() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF auth.role() <> 'service_role'
     AND (NEW.es_premium IS DISTINCT FROM OLD.es_premium
          OR NEW.premium_desde IS DISTINCT FROM OLD.premium_desde) THEN
    RAISE EXCEPTION 'es_premium/premium_desde solo se puede modificar vía service role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_premium_columns ON public.players;
CREATE TRIGGER lock_premium_columns BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.lock_premium_columns();

-- ── 3. PAGOS PREMIUM ──────────────────────────────────
-- Idempotencia (unique por proveedor+id de pago) y auditoría. Tabla de
-- solo-servicio: ningún usuario autenticado puede insertar/modificar,
-- solo leer sus propios pagos.
CREATE TABLE public.premium_payments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id          uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  proveedor          text NOT NULL CHECK (proveedor IN ('mercadopago','paypal')),
  proveedor_pago_id  text NOT NULL,
  moneda             text NOT NULL CHECK (moneda IN ('ARS','USD')),
  monto              numeric NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proveedor, proveedor_pago_id)
);

ALTER TABLE public.premium_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "premium_payments_read_own" ON public.premium_payments FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.players WHERE id = player_id));

CREATE POLICY "service full access premium_payments" ON public.premium_payments
  FOR ALL USING (auth.role() = 'service_role');

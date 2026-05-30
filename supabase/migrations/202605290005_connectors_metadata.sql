-- Ajoute la colonne metadata sur connectors pour stocker les tokens OAuth
-- (access_token, refresh_token) — utilisée par ingest-communication et enrich-contact
ALTER TABLE public.connectors
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

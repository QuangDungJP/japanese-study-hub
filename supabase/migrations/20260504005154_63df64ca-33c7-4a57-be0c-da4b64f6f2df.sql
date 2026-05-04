ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS agenda jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS speakers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sponsors jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS price_note text,
  ADD COLUMN IF NOT EXISTS register_button_label text,
  ADD COLUMN IF NOT EXISTS section_visibility jsonb NOT NULL DEFAULT '{"hero":true,"info":true,"video":true,"gallery":true,"content":true,"highlights":true,"agenda":true,"speakers":true,"sponsors":true,"faq":true,"register":true}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_events_order ON public.events(order_index);
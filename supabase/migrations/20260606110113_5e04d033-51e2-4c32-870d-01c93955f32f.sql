
ALTER TABLE public.page_settings
  ADD COLUMN IF NOT EXISTS hero_badge_vi text,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS hero_overlay integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS hero_cta_primary_label text,
  ADD COLUMN IF NOT EXISTS hero_cta_primary_url text,
  ADD COLUMN IF NOT EXISTS hero_cta_secondary_label text,
  ADD COLUMN IF NOT EXISTS hero_cta_secondary_url text;

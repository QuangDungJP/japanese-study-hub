
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS show_on_homepage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS homepage_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS courses_show_on_homepage_idx ON public.courses(show_on_homepage) WHERE show_on_homepage = true;
CREATE INDEX IF NOT EXISTS courses_is_featured_idx ON public.courses(is_featured) WHERE is_featured = true;

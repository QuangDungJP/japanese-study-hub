
-- 1. Add slug to classes (auto-generated from name_vi/name)
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.set_class_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base_slug text; final_slug text; counter int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND OLD.name_vi IS DISTINCT FROM NEW.name_vi AND NEW.slug = OLD.slug) THEN
    base_slug := public.generate_slug(COALESCE(NEW.name_vi, NEW.name, 'lop-hoc'));
    IF base_slug IS NULL OR base_slug = '' THEN base_slug := 'lop-hoc'; END IF;
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.classes WHERE slug = final_slug AND id <> NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_class_slug ON public.classes;
CREATE TRIGGER trg_set_class_slug BEFORE INSERT OR UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.set_class_slug();

-- backfill existing slugs
UPDATE public.classes SET slug = NULL WHERE slug IS NULL OR slug = '';
-- trigger fires only on INSERT/UPDATE; force update
UPDATE public.classes SET name_vi = name_vi WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS classes_slug_unique ON public.classes(slug);

-- 2. Time scheduling per item
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS start_at timestamptz,
  ADD COLUMN IF NOT EXISTS end_at timestamptz;

ALTER TABLE public.class_assignments
  ADD COLUMN IF NOT EXISTS start_at timestamptz;

-- exams already have exam_date + start_time + duration
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS end_time time;

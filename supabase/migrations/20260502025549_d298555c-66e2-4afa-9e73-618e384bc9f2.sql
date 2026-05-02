
-- Auto-generate slug for courses on insert/update
CREATE OR REPLACE FUNCTION public.set_course_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND OLD.title_vi IS DISTINCT FROM NEW.title_vi AND (NEW.slug = OLD.slug)) THEN
    base_slug := public.generate_slug(COALESCE(NEW.title_vi, NEW.title, 'khoa-hoc'));
    IF base_slug IS NULL OR base_slug = '' THEN
      base_slug := 'khoa-hoc';
    END IF;
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.courses WHERE slug = final_slug AND id <> NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS courses_set_slug ON public.courses;
CREATE TRIGGER courses_set_slug
BEFORE INSERT OR UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.set_course_slug();

-- Same for events
CREATE OR REPLACE FUNCTION public.set_event_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_slug(COALESCE(NEW.title_vi, NEW.title, 'su-kien'));
    IF base_slug IS NULL OR base_slug = '' THEN
      base_slug := 'su-kien';
    END IF;
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = final_slug AND id <> NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_set_slug ON public.events;
CREATE TRIGGER events_set_slug
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.set_event_slug();

-- Backfill slugs for existing rows (will trigger above)
UPDATE public.courses SET slug = NULL WHERE slug IS NULL OR slug = '';
UPDATE public.courses SET title_vi = title_vi WHERE slug IS NULL;
UPDATE public.events SET slug = NULL WHERE slug IS NULL OR slug = '';
UPDATE public.events SET title_vi = title_vi WHERE slug IS NULL;

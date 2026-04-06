
-- Create a function to generate URL-friendly slugs from Vietnamese text
CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  slug TEXT;
BEGIN
  slug := lower(input_text);
  -- Vietnamese character replacements
  slug := translate(slug,
    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyyd'
  );
  -- Replace non-alphanumeric with hyphens
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
  -- Trim leading/trailing hyphens
  slug := trim(both '-' from slug);
  RETURN slug;
END;
$$;

-- Add slug column to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add slug column to events  
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slugs for existing courses from title_vi
UPDATE public.courses 
SET slug = generate_slug(title_vi) || '-' || substring(id::text from 1 for 8)
WHERE slug IS NULL;

-- Generate slugs for existing events from title_vi
UPDATE public.events
SET slug = generate_slug(title_vi) || '-' || substring(id::text from 1 for 8)
WHERE slug IS NULL;

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

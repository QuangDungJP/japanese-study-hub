
CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  slug TEXT;
BEGIN
  slug := lower(input_text);
  slug := translate(slug,
    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyyd'
  );
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
  slug := trim(both '-' from slug);
  RETURN slug;
END;
$$;

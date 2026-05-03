
-- De-duplicate any existing rows that share the same section_key (keep newest)
DELETE FROM public.website_content w
USING public.website_content w2
WHERE w.section_key = w2.section_key
  AND w.ctid < w2.ctid;

ALTER TABLE public.website_content
  ADD CONSTRAINT website_content_section_key_unique UNIQUE (section_key);

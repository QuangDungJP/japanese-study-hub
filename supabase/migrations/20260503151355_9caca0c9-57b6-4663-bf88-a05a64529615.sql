
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;

CREATE POLICY "Anyone can submit valid contact form"
ON public.contact_submissions
FOR INSERT
WITH CHECK (
  data IS NOT NULL
  AND jsonb_typeof(data) = 'object'
  AND (data <> '{}'::jsonb)
  AND length(data::text) <= 10000
);

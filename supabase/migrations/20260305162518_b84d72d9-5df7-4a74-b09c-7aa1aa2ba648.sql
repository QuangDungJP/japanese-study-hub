
CREATE TABLE public.blog_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value text NOT NULL UNIQUE,
  label text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blog categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog categories" ON public.blog_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default categories
INSERT INTO public.blog_categories (value, label) VALUES
  ('general', 'Chung'),
  ('tips', 'Mẹo học'),
  ('culture', 'Văn hóa Nhật'),
  ('grammar', 'Ngữ pháp'),
  ('vocabulary', 'Từ vựng'),
  ('jlpt', 'JLPT'),
  ('news', 'Tin tức');

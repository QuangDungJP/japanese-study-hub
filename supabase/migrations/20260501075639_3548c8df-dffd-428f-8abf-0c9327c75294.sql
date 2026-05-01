-- Page settings table for admin to rename pages
CREATE TABLE public.page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  display_name_vi TEXT NOT NULL,
  nav_label TEXT,
  nav_label_vi TEXT,
  hero_title TEXT,
  hero_title_vi TEXT,
  hero_subtitle TEXT,
  hero_subtitle_vi TEXT,
  route_path TEXT NOT NULL,
  show_in_nav BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active page settings"
ON public.page_settings FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage page settings"
ON public.page_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_page_settings_updated_at
BEFORE UPDATE ON public.page_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.page_settings (page_key, display_name, display_name_vi, nav_label, nav_label_vi, route_path, order_index) VALUES
('home', 'Home', 'Trang chủ', 'Home', 'Trang chủ', '/', 1),
('about', 'About', 'Giới thiệu', 'About', 'Giới thiệu', '/gioi-thieu', 2),
('courses', 'Courses', 'Khóa học', 'Courses', 'Khóa học', '/khoa-hoc', 3),
('teachers', 'Teachers', 'Giáo viên', 'Teachers', 'Giáo viên', '/giao-vien', 4),
('zoom', 'Google Meet', 'Google Meet', 'Google Meet', 'Google Meet', '/zoom', 5),
('events', 'Events', 'Sự kiện', 'Events', 'Sự kiện', '/su-kien', 6),
('blog', 'Blog', 'Blog', 'Blog', 'Blog', '/blog', 7),
('contact', 'Contact', 'Liên hệ', 'Contact', 'Liên hệ', '/lien-he', 8);

-- Course-Teachers junction (many-to-many)
CREATE TABLE public.course_teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  role TEXT DEFAULT 'main',
  role_vi TEXT DEFAULT 'Giáo viên chính',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, teacher_id)
);

ALTER TABLE public.course_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course teachers"
ON public.course_teachers FOR SELECT
USING (true);

CREATE POLICY "Admins can manage course teachers"
ON public.course_teachers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_course_teachers_course ON public.course_teachers(course_id);
CREATE INDEX idx_course_teachers_teacher ON public.course_teachers(teacher_id);
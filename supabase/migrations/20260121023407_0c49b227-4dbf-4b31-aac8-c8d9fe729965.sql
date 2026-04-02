-- Create table for website CMS content (landing page sections)
CREATE TABLE public.website_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  title_vi TEXT,
  subtitle TEXT,
  subtitle_vi TEXT,
  description TEXT,
  description_vi TEXT,
  content JSONB DEFAULT '{}',
  image_url TEXT,
  video_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;

-- Admins can manage all content
CREATE POLICY "Admins can manage website content"
ON public.website_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active content (for public website)
CREATE POLICY "Anyone can view active website content"
ON public.website_content
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_website_content_updated_at
BEFORE UPDATE ON public.website_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sections
INSERT INTO public.website_content (section_key, title, title_vi, subtitle, subtitle_vi, order_index) VALUES
('hero', 'Master Japanese with AI', 'Chinh Phục Tiếng Nhật Cùng AI', 'The smartest way to learn Japanese', 'Phương pháp học tiếng Nhật thông minh nhất', 1),
('skills', 'Build All Your Skills', 'Xây Dựng Toàn Bộ Kỹ Năng', 'Comprehensive learning approach', 'Phương pháp học toàn diện', 2),
('languages', 'Available Languages', 'Các Ngôn Ngữ Có Sẵn', 'Learn multiple languages', 'Học nhiều ngôn ngữ', 3),
('zoom', 'Live Learning Sessions', 'Buổi Học Trực Tuyến', 'Interactive live classes', 'Lớp học trực tiếp tương tác', 4),
('features', 'Why Choose Us', 'Tại Sao Chọn Chúng Tôi', 'Our unique features', 'Các tính năng độc đáo', 5),
('cta', 'Start Learning Today', 'Bắt Đầu Học Ngay Hôm Nay', 'Join thousands of learners', 'Tham gia cùng hàng nghìn học viên', 6),
('pricing', 'Course Pricing', 'Bảng Giá Khóa Học', 'Affordable plans for everyone', 'Gói học phí phù hợp cho mọi người', 7);

-- Create storage bucket for website assets
INSERT INTO storage.buckets (id, name, public) VALUES ('website-assets', 'website-assets', true);

-- Storage policies for website assets
CREATE POLICY "Admins can manage website assets"
ON storage.objects
FOR ALL
USING (bucket_id = 'website-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view website assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'website-assets');
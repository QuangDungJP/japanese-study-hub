-- Migration for Marketing Popups table

CREATE TABLE IF NOT EXISTS public.marketing_popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  target_link TEXT,
  pc_width_px INTEGER DEFAULT 520,
  pc_height_px INTEGER DEFAULT 620,
  mobile_width_px INTEGER DEFAULT 340,
  mobile_height_px INTEGER DEFAULT 450,
  display_frequency TEXT DEFAULT 'first_visit' CHECK (display_frequency IN ('first_visit', 'session', 'once_a_day', 'always')),
  start_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.marketing_popups ENABLE ROW LEVEL SECURITY;

-- Anyone can read active popups
CREATE POLICY "Anyone can view active popups" ON public.marketing_popups
  FOR SELECT USING (is_active = true);

-- Admins can manage all popups
CREATE POLICY "Admins can manage marketing popups" ON public.marketing_popups
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_marketing_popups_updated_at
  BEFORE UPDATE ON public.marketing_popups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  description TEXT,
  description_vi TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location TEXT,
  location_vi TEXT,
  is_online BOOLEAN DEFAULT false,
  meet_link TEXT,
  max_participants INTEGER,
  is_published BOOLEAN DEFAULT false,
  layout_style TEXT DEFAULT 'standard',
  content_html TEXT,
  content_html_vi TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view published events" ON public.events
  FOR SELECT
  USING (is_published = true);

-- Event form fields (admin configurable registration form)
CREATE TABLE public.event_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  label_vi TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  placeholder TEXT,
  placeholder_vi TEXT,
  is_required BOOLEAN DEFAULT false,
  options JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage event form fields" ON public.event_form_fields
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active event form fields" ON public.event_form_fields
  FOR SELECT
  USING (is_active = true);

-- Event registrations
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'registered',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all event registrations" ON public.event_registrations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can register for events" ON public.event_registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own registrations" ON public.event_registrations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

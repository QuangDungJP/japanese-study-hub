
-- Contact form fields configuration (admin-managed)
CREATE TABLE public.contact_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  label_vi text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  placeholder text,
  placeholder_vi text,
  is_required boolean DEFAULT false,
  options jsonb DEFAULT '[]'::jsonb,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contact form submissions
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.contact_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Fields: anyone can read active, admin can manage
CREATE POLICY "Anyone can view active fields" ON public.contact_form_fields FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage fields" ON public.contact_form_fields FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Submissions: anyone can insert, admin can manage
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage submissions" ON public.contact_submissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

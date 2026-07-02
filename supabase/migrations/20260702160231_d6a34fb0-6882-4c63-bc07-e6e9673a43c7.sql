
-- Extend classes with banner, color, join code
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#4f46e5',
  ADD COLUMN IF NOT EXISTS join_code text;

-- Backfill join_code with a random 6-char alphanumeric
UPDATE public.classes SET join_code = lower(substr(md5(random()::text || id::text), 1, 6)) WHERE join_code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS classes_join_code_uniq ON public.classes(join_code) WHERE join_code IS NOT NULL;

-- Extend class_assignments
ALTER TABLE public.class_assignments
  ADD COLUMN IF NOT EXISTS topic_id uuid,
  ADD COLUMN IF NOT EXISTS points integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS rubric jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS assigned_to jsonb DEFAULT '"all"'::jsonb,
  ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS kind text DEFAULT 'assignment';

-- Extend class_assignment_submissions
ALTER TABLE public.class_assignment_submissions
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rubric_scores jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS returned_at timestamptz;

-- ============================================
-- class_topics
-- ============================================
CREATE TABLE IF NOT EXISTS public.class_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_topics TO authenticated;
GRANT ALL ON public.class_topics TO service_role;
ALTER TABLE public.class_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class members view topics" ON public.class_topics FOR SELECT TO authenticated USING (
  public.is_class_teacher(class_id, auth.uid()) OR public.is_class_student(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "Teachers manage topics" ON public.class_topics FOR ALL TO authenticated USING (
  public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
);

CREATE TRIGGER trg_topics_updated BEFORE UPDATE ON public.class_topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FK now that table exists
DO $$ BEGIN
  ALTER TABLE public.class_assignments
    ADD CONSTRAINT class_assignments_topic_fk FOREIGN KEY (topic_id) REFERENCES public.class_topics(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- class_materials
-- ============================================
CREATE TABLE IF NOT EXISTS public.class_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.class_topics(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  order_index integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_materials TO authenticated;
GRANT ALL ON public.class_materials TO service_role;
ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class members view materials" ON public.class_materials FOR SELECT TO authenticated USING (
  public.is_class_teacher(class_id, auth.uid()) OR public.is_class_student(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "Teachers manage materials" ON public.class_materials FOR ALL TO authenticated USING (
  public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
);

CREATE TRIGGER trg_materials_updated BEFORE UPDATE ON public.class_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- class_stream_posts
-- ============================================
CREATE TABLE IF NOT EXISTS public.class_stream_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'announcement',
  title text,
  body text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  assignment_id uuid REFERENCES public.class_assignments(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.class_materials(id) ON DELETE CASCADE,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_stream_posts TO authenticated;
GRANT ALL ON public.class_stream_posts TO service_role;
ALTER TABLE public.class_stream_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view stream" ON public.class_stream_posts FOR SELECT TO authenticated USING (
  public.is_class_teacher(class_id, auth.uid()) OR public.is_class_student(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "Members post to stream" ON public.class_stream_posts FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND (
    public.is_class_teacher(class_id, auth.uid()) OR public.is_class_student(class_id, auth.uid())
  )
);
CREATE POLICY "Author or teacher update" ON public.class_stream_posts FOR UPDATE TO authenticated USING (
  author_id = auth.uid() OR public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  author_id = auth.uid() OR public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "Author or teacher delete" ON public.class_stream_posts FOR DELETE TO authenticated USING (
  author_id = auth.uid() OR public.is_class_teacher(class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
);

CREATE TRIGGER trg_stream_updated BEFORE UPDATE ON public.class_stream_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_stream_class_created ON public.class_stream_posts(class_id, created_at DESC);

-- ============================================
-- class_stream_comments
-- ============================================
CREATE TABLE IF NOT EXISTS public.class_stream_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.class_stream_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  parent_id uuid REFERENCES public.class_stream_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_stream_comments TO authenticated;
GRANT ALL ON public.class_stream_comments TO service_role;
ALTER TABLE public.class_stream_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read comments" ON public.class_stream_comments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.class_stream_posts p WHERE p.id = post_id AND (
    public.is_class_teacher(p.class_id, auth.uid()) OR public.is_class_student(p.class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
  ))
);
CREATE POLICY "Members insert comments" ON public.class_stream_comments FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.class_stream_posts p WHERE p.id = post_id AND (
    public.is_class_teacher(p.class_id, auth.uid()) OR public.is_class_student(p.class_id, auth.uid())
  ))
);
CREATE POLICY "Author or teacher edit comment" ON public.class_stream_comments FOR UPDATE TO authenticated USING (
  author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.class_stream_posts p WHERE p.id = post_id AND public.is_class_teacher(p.class_id, auth.uid()))
) WITH CHECK (
  author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.class_stream_posts p WHERE p.id = post_id AND public.is_class_teacher(p.class_id, auth.uid()))
);
CREATE POLICY "Author or teacher delete comment" ON public.class_stream_comments FOR DELETE TO authenticated USING (
  author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.class_stream_posts p WHERE p.id = post_id AND public.is_class_teacher(p.class_id, auth.uid()))
);

CREATE TRIGGER trg_comments_updated BEFORE UPDATE ON public.class_stream_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.class_stream_comments(post_id, created_at);

-- ============================================
-- class_stream_reactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.class_stream_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.class_stream_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.class_stream_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL DEFAULT '👍',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((post_id IS NOT NULL) OR (comment_id IS NOT NULL)),
  UNIQUE (post_id, comment_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.class_stream_reactions TO authenticated;
GRANT ALL ON public.class_stream_reactions TO service_role;
ALTER TABLE public.class_stream_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read reactions" ON public.class_stream_reactions FOR SELECT TO authenticated USING (
  (post_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.class_stream_posts p WHERE p.id = post_id AND (
    public.is_class_teacher(p.class_id, auth.uid()) OR public.is_class_student(p.class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
  )))
  OR
  (comment_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.class_stream_comments c JOIN public.class_stream_posts p ON p.id=c.post_id WHERE c.id = comment_id AND (
    public.is_class_teacher(p.class_id, auth.uid()) OR public.is_class_student(p.class_id, auth.uid()) OR public.has_role(auth.uid(),'admin')
  )))
);
CREATE POLICY "Members insert reactions" ON public.class_stream_reactions FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "User deletes own reaction" ON public.class_stream_reactions FOR DELETE TO authenticated USING (
  user_id = auth.uid()
);

-- ============================================
-- Realtime
-- ============================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.class_stream_posts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.class_stream_comments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.class_stream_reactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.class_assignment_submissions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.class_stream_posts REPLICA IDENTITY FULL;
ALTER TABLE public.class_stream_comments REPLICA IDENTITY FULL;
ALTER TABLE public.class_stream_reactions REPLICA IDENTITY FULL;

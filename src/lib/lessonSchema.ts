/**
 * Shared Lesson schema used by both /teacher/lessons and /admin/lessons.
 * Keeps both editors in sync: the same fields, the same payload going to DB.
 */

export interface LessonFormData {
  // Core
  title: string;
  title_vi: string;
  description: string;
  description_vi: string;
  skill: string;
  level: string;
  duration_minutes: number;
  xp_reward: number;
  order_index?: number;

  // Media / content
  thumbnail_url?: string;
  video_url?: string;
  content_html?: string;

  // Scheduling / assignment
  class_id?: string | null;
  start_at?: string | null;
  end_at?: string | null;

  // Extended metadata (added migration 2026-06-21)
  tags?: string[];
  estimated_minutes?: number | null;
  objectives?: string;
  prerequisites?: string;
  difficulty?: string;

  /** Block-based lesson content (Notion-style). Saved to `lessons.content` (jsonb). */
  content?: { version: number; blocks: any[] } | null;
}

export const EMPTY_LESSON: LessonFormData = {
  title: '',
  title_vi: '',
  description: '',
  description_vi: '',
  skill: '',
  level: '',
  duration_minutes: 15,
  xp_reward: 0,
  order_index: 0,
  thumbnail_url: '',
  video_url: '',
  content_html: '',
  class_id: null,
  start_at: null,
  end_at: null,
  tags: [],
  estimated_minutes: null,
  objectives: '',
  prerequisites: '',
  difficulty: '',
  content: { version: 1, blocks: [] },
};

/** Map a DB row → form state. */
export const parseLessonRow = (row: any): LessonFormData => ({
  title: row?.title || '',
  title_vi: row?.title_vi || '',
  description: row?.description || '',
  description_vi: row?.description_vi || '',
  skill: row?.skill || '',
  level: row?.level || '',
  duration_minutes: row?.duration_minutes ?? 15,
  xp_reward: row?.xp_reward ?? 0,
  order_index: row?.order_index ?? 0,
  thumbnail_url: row?.thumbnail_url || '',
  video_url: row?.video_url || '',
  content_html: row?.content_html || '',
  class_id: row?.class_id ?? null,
  start_at: row?.start_at ?? null,
  end_at: row?.end_at ?? null,
  tags: Array.isArray(row?.tags) ? row.tags : [],
  estimated_minutes: row?.estimated_minutes ?? null,
  objectives: row?.objectives || '',
  prerequisites: row?.prerequisites || '',
  difficulty: row?.difficulty || '',
  content: (row?.content && typeof row.content === 'object' && Array.isArray(row.content.blocks))
    ? row.content
    : { version: 1, blocks: [] },
});

interface BuildOpts {
  /** Default language tag stored on the row. */
  language?: string;
  /** Force is_published value (admin can publish directly). */
  isPublished?: boolean;
  /** Author of the lesson (teacher_id column). */
  teacherId?: string | null;
}

/**
 * Build the row payload to send to Supabase.
 * Auto cross-fills title/description between EN and VI so teachers don't
 * have to type both — but the columns stay consistent.
 */
export const buildLessonPayload = (form: LessonFormData, opts: BuildOpts = {}) => {
  const title = (form.title || '').trim();
  const title_vi = (form.title_vi || '').trim();
  const description = (form.description || '').trim();
  const description_vi = (form.description_vi || '').trim();

  const payload: Record<string, any> = {
    title: title || title_vi || 'Untitled',
    title_vi: title_vi || title || 'Bài học mới',
    description: description || description_vi || null,
    description_vi: description_vi || description || null,
    skill: form.skill || '',
    level: form.level || '',
    duration_minutes: Number(form.duration_minutes) || 15,
    xp_reward: Number(form.xp_reward) || 0,
    order_index: Number(form.order_index ?? 0),
    thumbnail_url: form.thumbnail_url || null,
    video_url: form.video_url || null,
    content_html: form.content_html || null,
    class_id: form.class_id || null,
    start_at: form.start_at || null,
    end_at: form.end_at || null,
    tags: Array.isArray(form.tags) ? form.tags : [],
    estimated_minutes: form.estimated_minutes ?? null,
    objectives: form.objectives || null,
    prerequisites: form.prerequisites || null,
    difficulty: form.difficulty || null,
    language: opts.language || 'japanese',
    content: form.content && Array.isArray(form.content.blocks) ? form.content : null,
  };

  if (typeof opts.isPublished === 'boolean') {
    payload.is_published = opts.isPublished;
  }
  if (opts.teacherId) {
    payload.teacher_id = opts.teacherId;
  }

  return payload;
};
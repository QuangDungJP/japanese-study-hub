import { supabase } from '@/integrations/supabase/client';

/**
 * Sao chép toàn bộ nội dung một lớp sang lớp mới:
 * lịch buổi học, chủ đề, bài học + quiz (exercises), tài liệu đã upload
 * (lesson_materials, class_materials), bài tập/tài liệu Classwork và đề kiểm tra (exams).
 * File upload được dùng chung URL (xoá tài liệu không xoá file trong storage).
 * Mọi mốc thời gian được dời theo cùng một khoảng để giữ nguyên lịch tương đối.
 */

export interface CopyClassResult {
  classId: string;
  counts: Record<string, number>;
  warnings: string[];
}

const sb = supabase as any;
const DAY_MS = 24 * 60 * 60 * 1000;
const SYSTEM_COLUMNS = ['id', 'created_at', 'updated_at'];

const strip = (row: Record<string, any>, extra: string[] = []) => {
  const out: Record<string, any> = { ...row };
  [...SYSTEM_COLUMNS, ...extra].forEach(k => delete out[k]);
  return out;
};

const parseDay = (d: string) => {
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, day);
};

const todayStr = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
};

export async function copyClass(sourceClassId: string, newName: string, userId: string): Promise<CopyClassResult> {
  const counts: Record<string, number> = {};
  const warnings: string[] = [];

  const { data: source, error: srcErr } = await sb.from('classes').select('*').eq('id', sourceClassId).single();
  if (srcErr || !source) throw srcErr || new Error('Không tìm thấy lớp nguồn');

  const { data: sourceSessions, error: sessErr } = await sb
    .from('class_sessions').select('*').eq('class_id', sourceClassId)
    .order('session_date', { ascending: true }).order('start_time', { ascending: true });
  if (sessErr) throw sessErr;

  // Dời toàn bộ lịch sao cho mốc đầu tiên (start_date hoặc buổi đầu) rơi vào hôm nay
  const newStart = todayStr();
  const anchor = source.start_date || sourceSessions?.[0]?.session_date || null;
  const offsetMs = anchor ? parseDay(newStart) - parseDay(anchor) : 0;
  const shiftDate = (d: string | null) => (d ? new Date(parseDay(d) + offsetMs).toISOString().slice(0, 10) : d);
  const shiftTs = (ts: string | null) => (ts ? new Date(new Date(ts).getTime() + offsetMs).toISOString() : ts);
  const shiftDays = Math.round(offsetMs / DAY_MS);

  // 1. Lớp mới (không sao chép mã tham gia / slug vì phải là duy nhất)
  const { data: created, error: createErr } = await sb.from('classes').insert({
    ...strip(source, ['join_code', 'slug', 'approval_status', 'approved_at', 'approved_by', 'rejection_reason']),
    name: newName,
    name_vi: newName,
    teacher_id: userId,
    start_date: newStart,
    end_date: shiftDate(source.end_date),
    is_active: true,
  }).select('id').single();
  if (createErr || !created) throw createErr || new Error('Không tạo được lớp mới');
  const classId = created.id as string;

  const insertMany = async (table: string, rows: any[], label: string) => {
    if (!rows.length) return [] as any[];
    const { data, error } = await sb.from(table).insert(rows).select('id');
    if (error) {
      warnings.push(`${label}: ${error.message}`);
      return [] as any[];
    }
    counts[label] = data?.length || 0;
    return data as any[];
  };

  // Postgres trả về các dòng theo đúng thứ tự VALUES đã chèn, nên ghép id cũ -> mới theo vị trí
  const buildMap = (sourceRows: any[], inserted: any[]) => {
    const map = new Map<string, string>();
    if (inserted.length === sourceRows.length) sourceRows.forEach((r, i) => map.set(r.id, inserted[i].id));
    return map;
  };

  // 2. Buổi học
  const sessions = sourceSessions || [];
  const sessionMap = buildMap(sessions, await insertMany('class_sessions', sessions.map((s: any) => ({
    ...strip(s, ['record_url']),
    class_id: classId,
    created_by: userId,
    session_date: shiftDate(s.session_date),
    status: 'upcoming',
  })), 'Buổi học'));

  // 3. Chủ đề Classwork
  const { data: topics } = await sb.from('class_topics').select('*').eq('class_id', sourceClassId).order('order_index');
  const topicMap = buildMap(topics || [], await insertMany('class_topics', (topics || []).map((t: any) => ({
    ...strip(t),
    class_id: classId,
  })), 'Chủ đề'));

  // 4. Bài học
  const { data: lessons } = await sb.from('lessons').select('*').eq('class_id', sourceClassId).order('order_index');
  const lessonMap = buildMap(lessons || [], await insertMany('lessons', (lessons || []).map((l: any) => ({
    ...strip(l),
    class_id: classId,
    teacher_id: userId,
    session_id: l.session_id ? sessionMap.get(l.session_id) ?? null : null,
    start_at: shiftTs(l.start_at),
    end_at: shiftTs(l.end_at),
  })), 'Bài học'));

  // 5. Quiz / bài tập trong bài học
  const lessonIds = (lessons || []).map((l: any) => l.id).filter((id: string) => lessonMap.has(id));
  let exerciseMap = new Map<string, string>();
  if (lessonIds.length) {
    const { data: exercises, error } = await sb.from('exercises').select('*').in('lesson_id', lessonIds).order('order_index');
    if (error) warnings.push(`Quiz bài học: ${error.message}`);
    exerciseMap = buildMap(exercises || [], await insertMany('exercises', (exercises || []).map((e: any) => ({
      ...strip(e),
      lesson_id: lessonMap.get(e.lesson_id),
    })), 'Quiz bài học'));
  }

  // 6. Tài liệu đã upload theo buổi / bài học
  const { data: materials } = await sb.from('lesson_materials').select('*').eq('class_id', sourceClassId).order('order_index');
  await insertMany('lesson_materials', (materials || []).map((m: any) => ({
    ...strip(m),
    class_id: classId,
    teacher_id: userId,
    lesson_id: m.lesson_id ? lessonMap.get(m.lesson_id) ?? null : null,
    session_id: m.session_id ? sessionMap.get(m.session_id) ?? null : null,
  })), 'Tài liệu');

  const { data: classMaterials } = await sb.from('class_materials').select('*').eq('class_id', sourceClassId).order('order_index');
  await insertMany('class_materials', (classMaterials || []).map((m: any) => ({
    ...strip(m),
    class_id: classId,
    created_by: userId,
    topic_id: m.topic_id ? topicMap.get(m.topic_id) ?? null : null,
  })), 'Tài liệu lớp');

  // 7. Classwork: bài tập, tài liệu, câu hỏi
  const { data: assignments } = await sb.from('class_assignments').select('*').eq('class_id', sourceClassId).order('created_at');
  await insertMany('class_assignments', (assignments || []).map((a: any) => ({
    ...strip(a, ['assigned_to']),
    class_id: classId,
    created_by: userId,
    topic_id: a.topic_id ? topicMap.get(a.topic_id) ?? null : null,
    lesson_id: a.lesson_id ? lessonMap.get(a.lesson_id) ?? null : null,
    exercise_id: a.exercise_id ? exerciseMap.get(a.exercise_id) ?? a.exercise_id : null,
    start_at: shiftTs(a.start_at),
    due_date: shiftTs(a.due_date),
  })), 'Bài tập');

  // 8. Đề kiểm tra / quiz của lớp — để ở trạng thái nháp cho giáo viên kiểm tra lại lịch trước khi mở
  const { data: exams } = await sb.from('exams').select('*').eq('class_id', sourceClassId).order('exam_date');
  await insertMany('exams', (exams || []).map((e: any) => ({
    ...strip(e),
    class_id: classId,
    teacher_id: userId,
    is_published: false,
    exam_date: shiftDate(e.exam_date),
    starts_at: shiftTs(e.starts_at),
    ends_at: shiftTs(e.ends_at),
  })), 'Đề kiểm tra');

  if (shiftDays !== 0) counts['Dời lịch (ngày)'] = shiftDays;
  return { classId, counts, warnings };
}

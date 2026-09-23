import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  try {
    const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[match[1].trim()] = val;
      }
    });
  } catch (e) {
    console.log('No .env file found');
  }
}
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateQuestions(level: string) {
  return [
    {
      type: "system_config",
      config: {
        difficulty_factor: 1.0,
        section_pass: { language: 19, reading: 19, listening: 19, combined: 38 }
      }
    },
    {
      id: `${level.toLowerCase()}_q_v1`,
      skill: "vocabulary",
      text: `問題１：＿の言葉の読み方として最もよいものを、一つ選びなさい。\n\n彼の**能力**は素晴らしい。(${level})`,
      options: ["のうりょく", "のうりき", "どうりょく", "どうりき"],
      correct_index: 0,
      points: 5
    },
    {
      id: `${level.toLowerCase()}_q_g1`,
      skill: "grammar",
      text: `問題２：＿に何が入りますか。最もよいものを一つ選びなさい。\n\n雨が降っている＿＿＿、試合は中止になった。(${level})`,
      options: ["ために", "ように", "ばかりに", "みたいに"],
      correct_index: 0,
      points: 5
    },
    {
      id: `${level.toLowerCase()}_q_r1`,
      skill: "reading",
      text: `問題３：つぎの文章を読んで、質問に答えなさい。\n\n最近、スマートフォンを使いすぎる若者が増えている。便利なツールであることは間違いないが、健康への影響も心配される。\n\n質問：筆者が心配していることは何か。(${level})`,
      options: [
        "スマートフォンが便利すぎること",
        "若者が増えていること",
        "スマートフォンの使いすぎが健康に影響すること",
        "ツールが間違っていること"
      ],
      correct_index: 2,
      points: 10
    },
    {
      id: `${level.toLowerCase()}_q_l1`,
      skill: "listening",
      text: `問題４：音声をきいて、正しい答えを一つ選びなさい。(${level})`,
      audio_url: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
      options: [
        "明日の会議は３時からです。",
        "明日の会議は４時からです。",
        "明日の会議は中止です。",
        "明日の会議はオンラインです。"
      ],
      correct_index: 0,
      points: 10
    }
  ];
}

const examTemplates = [
  { level: 'N1', title: 'Đề thi JLPT N1 Đạt Chuẩn Cao Cấp (Bộ 1)', duration: 170, maxScore: 180, passScore: 100 },
  { level: 'N1', title: 'Đề thi JLPT N1 Thử Thách Cực Đại (Bộ 2)', duration: 170, maxScore: 180, passScore: 100 },
  { level: 'N2', title: 'Đề thi JLPT N2 Chuẩn Quốc Tế (Bộ 1)', duration: 155, maxScore: 180, passScore: 90 },
  { level: 'N2', title: 'Đề thi JLPT N2 Rèn Luyện Toàn Diện (Bộ 2)', duration: 155, maxScore: 180, passScore: 90 },
  { level: 'N3', title: 'Đề thi JLPT N3 Trung Cấp Chuyên Sâu (Bộ 1)', duration: 140, maxScore: 180, passScore: 95 },
  { level: 'N3', title: 'Đề thi JLPT N3 Mô Phỏng Thực Tế (Bộ 2)', duration: 140, maxScore: 180, passScore: 95 },
  { level: 'N4', title: 'Đề thi JLPT N4 Vững Bước Sơ Cấp (Bộ 1)', duration: 115, maxScore: 180, passScore: 90 },
  { level: 'N4', title: 'Đề thi JLPT N4 Nắm Chắc Kiến Thức (Bộ 2)', duration: 115, maxScore: 180, passScore: 90 },
  { level: 'N5', title: 'Đề thi JLPT N5 Khởi Đầu Thành Công (Bộ 1)', duration: 105, maxScore: 180, passScore: 80 },
  { level: 'N5', title: 'Đề thi JLPT N5 Cơ Bản Hoàn Hảo (Bộ 2)', duration: 105, maxScore: 180, passScore: 80 },
];

const mockExams = examTemplates.map((template, i) => ({
  title: `${template.level} Mock Exam ${i + 1}`,
  title_vi: template.title,
  description_vi: `Đề thi thử ${template.level} gồm đủ 3 kỹ năng: Kiến thức ngôn ngữ, Đọc hiểu và Nghe hiểu. Hệ thống tự động chấm điểm và liệt kê lỗi sai.`,
  exam_type: "jlpt_mock",
  duration_minutes: template.duration,
  exam_date: new Date().toISOString().split('T')[0],
  start_time: "00:00",
  end_time: "23:59",
  max_score: template.maxScore,
  passing_score: template.passScore,
  is_published: true,
  is_public: true,
  questions: generateQuestions(template.level)
}));

async function seedExam() {
  console.log('Seeding 10 mock exams...');
  
  // Fetch a teacher_id to satisfy the not-null constraint
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (profileError || !profiles || profiles.length === 0) {
    console.error('Error fetching a teacher_id from profiles:', profileError);
    return;
  }

  const teacher_id = profiles[0].id;
  const examsToInsert = mockExams.map(exam => ({ ...exam, teacher_id }));

  // Xóa các đề cũ trước khi tạo 10 đề mới để tránh rác DB
  await supabase.from('exams').delete().eq('exam_type', 'jlpt_mock').eq('is_public', true);

  const { data, error } = await supabase
    .from('exams')
    .insert(examsToInsert)
    .select('id, title_vi');

  if (error) {
    console.error('Error inserting exams:', error);
  } else {
    console.log('Successfully inserted exams:', data);
  }
}

seedExam();

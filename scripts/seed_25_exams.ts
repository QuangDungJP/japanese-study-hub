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

const LEVELS = [
  { level: 'N5', duration: 105, pass: 80, max: 180 },
  { level: 'N4', duration: 115, pass: 90, max: 180 },
  { level: 'N3', duration: 140, pass: 95, max: 180 },
  { level: 'N2', duration: 155, pass: 90, max: 180 },
  { level: 'N1', duration: 165, pass: 100, max: 180 }
];

function generateQuestionsForLevel(level: string) {
  return [
    {
      id: 'pool_assignment_config',
      type: 'pool_config',
      pool_id: 'pool-1',
    },
    {
      id: 'scoring_rules_config',
      type: 'system_config',
      config: {
        difficulty_factor: 1.05,
        section_pass: { language: 19, reading: 19, listening: 19, combined: 38 },
      },
    },
    // VOCABULARY & KANJI
    {
      id: `q_v1_${Date.now()}`,
      skill: "vocabulary",
      type: "multiple_choice",
      text: `問題１：＿の言葉の読み方として最もよいものを、１・２・３・４から一つ選びなさい。\n\nきのう、**新しい**カメラを買いました。 (${level} Mẫu)`,
      options: ["あたらし", "あだらしい", "あたらしい", "あたらちい"],
      correct_index: 2,
      points: 2,
      difficulty: "easy"
    },
    {
      id: `q_v2_${Date.now()}`,
      skill: "vocabulary",
      type: "multiple_choice",
      text: `問題２：＿の言葉を漢字で書くとき、最もよいものを一つ選びなさい。\n\n田中さんは**まいにち**運動しています。 (${level} Mẫu)`,
      options: ["毎年", "毎月", "毎日", "毎目"],
      correct_index: 2,
      points: 3,
      difficulty: "medium"
    },
    // GRAMMAR & READING
    {
      id: `q_g1_${Date.now()}`,
      skill: "grammar",
      type: "multiple_choice",
      text: `問題４：＿に何が入りますか。最もよいものを一つ選びなさい。\n\nわたしは　日曜日＿　勉強します。 (${level} Mẫu)`,
      options: ["に", "を", "も", "で"],
      correct_index: 2,
      points: 2,
      difficulty: "easy"
    },
    {
      id: `q_r1_${Date.now()}`,
      skill: "reading",
      type: "multiple_choice",
      is_passage: true,
      text: `問題５：つぎの文章を読んで、質問に答えなさい。\n\n（メールの文章）\nスミスさんへ\nあしたのパーティーですが、午後６時に駅の前で会いましょう。山田さんも来ますよ。\n佐藤より (${level} Mẫu)`,
      sub_questions: [
        {
          id: `sq_r1_1_${Date.now()}`,
          text: "質問：あした、何時にどこで会いますか。",
          options: [
            "午前６時に駅の前で会う。",
            "午後６時に駅の中で会う。",
            "午後６時に駅の前で会う。",
            "午後６時に学校の前で会う。"
          ],
          correct_index: 2,
          points: 5,
          difficulty: "hard"
        }
      ]
    },
    // LISTENING
    {
      id: `q_l1_${Date.now()}`,
      skill: "listening",
      type: "multiple_choice",
      text: `問題６：音声をきいて、正しい答えを一つ選びなさい。 (${level} Mẫu)`,
      audio_url: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
      options: [
        "男の人は図書館へ行く。",
        "男の人は食堂へ行く。",
        "男の人は帰る。",
        "男の人は教室で待つ。"
      ],
      correct_index: 1,
      points: 5,
      difficulty: "medium"
    },
    // KAIWA (Giao tiếp)
    {
      id: `q_k1_${Date.now()}`,
      skill: "kaiwa",
      type: "audio_record",
      text: `Hãy đóng vai nhân viên cửa hàng và chào khách bằng tiếng Nhật một cách tự nhiên nhất. (${level} Giao tiếp)`,
      points: 10,
      difficulty: "medium"
    },
    {
      id: `q_k2_${Date.now()}`,
      skill: "kaiwa",
      type: "audio_record",
      text: `Nghe đoạn hội thoại sau và phản xạ trả lời trong vòng 5 giây. (${level} Phản xạ)`,
      audio_url: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
      points: 15,
      difficulty: "hard"
    }
  ];
}

async function seedExams() {
  console.log('Seeding 25 mock exams to Pool 1...');
  
  // Fetch a user id to use as teacher_id
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  const teacherId = users?.[0]?.id;
  
  if (!teacherId) {
    console.error('No users found in database to set as teacher_id');
    return;
  }
  
  const newExams = [];

  for (const lvlObj of LEVELS) {
    for (let i = 1; i <= 5; i++) {
      newExams.push({
        title: `Đề thi thử ${lvlObj.level} - Bộ chuẩn số ${i}`,
        title_vi: `Đề thi thử ${lvlObj.level} - Bộ chuẩn số ${i} (Kho 1)`,
        description_vi: `Đây là đề thi thử mô phỏng cấp độ ${lvlObj.level}, có đầy đủ các kỹ năng Đọc hiểu, Nghe hiểu và Kaiwa.`,
        exam_type: "jlpt_mock",
        exam_category: "written",
        duration_minutes: lvlObj.duration,
        max_score: lvlObj.max,
        passing_score: lvlObj.pass,
        is_published: true,
        exam_date: new Date().toISOString().split('T')[0],
        start_time: '00:00:00',
        end_time: '23:59:59',
        teacher_id: teacherId,
        questions: generateQuestionsForLevel(lvlObj.level)
      });
    }
  }

  const { data, error } = await supabase
    .from('exams')
    .insert(newExams)
    .select('id, title_vi');

  if (error) {
    console.error('Error inserting exams:', error);
  } else {
    console.log(`Successfully inserted ${data?.length} exams.`);
  }
}

seedExams();

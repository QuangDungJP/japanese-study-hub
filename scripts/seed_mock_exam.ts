import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env or .env.local
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; 

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const mockExamData = {
  title: "JLPT N4 Mock Exam (Full test - Real Data Sim)",
  title_vi: "Đề thi thử JLPT N4 - Mô phỏng đề thật",
  description_vi: "Đề thi thử đầy đủ 3 kỹ năng (Từ vựng/Chữ Hán, Đọc hiểu/Ngữ pháp, Nghe hiểu) theo cấu trúc chuẩn. Bạn có 105 phút để hoàn thành bài thi này.",
  exam_type: "jlpt_mock",
  level: "N4",
  duration_minutes: 105,
  max_score: 180,
  passing_score: 90,
  is_published: true,
  questions: [
    // --- VOCABULARY & KANJI ---
    {
      id: "q_v1",
      skill: "vocabulary",
      text: "問題１：＿の言葉の読み方として最もよいものを、１・２・３・４から一つ選びなさい。\n\nきのう、**新しい**カメラを買いました。",
      options: ["あたらし", "あだらしい", "あたらしい", "あたらちい"],
      correct_index: 2
    },
    {
      id: "q_v2",
      skill: "vocabulary",
      text: "問題２：＿の言葉を漢字で書くとき、最もよいものを一つ選びなさい。\n\n田中さんは**まいにち**運動しています。",
      options: ["毎年", "毎月", "毎日", "毎目"],
      correct_index: 2
    },
    {
      id: "q_v3",
      skill: "vocabulary",
      text: "問題３：文の＿に入れるのに最もよいものを一つ選びなさい。\n\n風邪を引いたので、今日は早く＿＿＿。",
      options: ["帰ります", "寝ます", "起きます", "食べます"],
      correct_index: 1
    },
    
    // --- GRAMMAR & READING ---
    {
      id: "q_g1",
      skill: "grammar",
      text: "問題４：＿に何が入りますか。最もよいものを一つ選びなさい。\n\nわたしは　日曜日＿　勉強します。",
      options: ["に", "を", "も", "で"],
      correct_index: 2
    },
    {
      id: "q_r1",
      skill: "reading",
      text: "問題５：つぎの文章を読んで、質問に答えなさい。\n\n（メールの文章）\nスミスさんへ\nあしたのパーティーですが、午後６時に駅の前で会いましょう。山田さんも来ますよ。\n佐藤より\n\n質問：あした、何時にどこで会いますか。",
      options: [
        "午前６時に駅の前で会う。",
        "午後６時に駅の中で会う。",
        "午後６時に駅の前で会う。",
        "午後６時に学校の前で会う。"
      ],
      correct_index: 2
    },
    
    // --- LISTENING ---
    {
      id: "q_l1",
      skill: "listening",
      text: "問題６：音声をきいて、正しい答えを一つ選びなさい。",
      audio_url: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg", // Dummy audio for testing
      options: [
        "男の人は図書館へ行く。",
        "男の人は食堂へ行く。",
        "男の人は帰る。",
        "男の人は教室で待つ。"
      ],
      correct_index: 1
    }
  ]
};

async function seedExam() {
  console.log('Seeding mock exam...');
  
  const { data, error } = await supabase
    .from('exams')
    .insert([mockExamData])
    .select('id, title_vi');

  if (error) {
    console.error('Error inserting exam:', error);
  } else {
    console.log('Successfully inserted exam:', data);
  }
}

seedExam();

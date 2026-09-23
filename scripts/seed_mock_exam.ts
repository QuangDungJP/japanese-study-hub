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

const mockExams = [
  {
    title: "JLPT N4 Mock Exam (Full test - Real Data Sim)",
    title_vi: "Đề thi thử JLPT N4 - Đề chuẩn công khai",
    description_vi: "Đề thi thử đầy đủ 3 kỹ năng (Từ vựng/Chữ Hán, Đọc hiểu/Ngữ pháp, Nghe hiểu) theo cấu trúc chuẩn. Bạn có 105 phút để hoàn thành bài thi này.",
    exam_type: "jlpt_mock",
    duration_minutes: 115,
    exam_date: new Date().toISOString().split('T')[0],
    start_time: "00:00",
    end_time: "23:59",
    max_score: 180,
    passing_score: 90,
    is_published: true,
    is_public: true,
    questions: [
      // --- VOCABULARY & KANJI ---
      {
        id: "q_v1",
        skill: "vocabulary",
        text: "問題１：＿の言葉の読み方として最もよいものを、１・２・３・４から一つ選びなさい。\n\nきのう、**新しい**カメラを買いました。",
        options: ["あたらし", "あだらしい", "あたらしい", "あたらちい"],
        correct_index: 2,
        points: 5
      },
      {
        id: "q_v2",
        skill: "vocabulary",
        text: "問題２：＿の言葉を漢字で書くとき、最もよいものを一つ選びなさい。\n\n田中さんは**まいにち**運動しています。",
        options: ["毎年", "毎月", "毎日", "毎目"],
        correct_index: 2,
        points: 5
      },
      {
        id: "q_v3",
        skill: "vocabulary",
        text: "問題３：文の＿に入れるのに最もよいものを一つ選びなさい。\n\n風邪を引いたので、今日は早く＿＿＿。",
        options: ["帰ります", "寝ます", "起きます", "食べます"],
        correct_index: 1,
        points: 5
      },
      // --- GRAMMAR & READING ---
      {
        id: "q_g1",
        skill: "grammar",
        text: "問題４：＿に何が入りますか。最もよいものを一つ選びなさい。\n\nわたしは　日曜日＿　勉強します。",
        options: ["に", "を", "も", "で"],
        correct_index: 2,
        points: 5
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
        correct_index: 2,
        points: 10
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
        correct_index: 1,
        points: 10
      }
    ]
  },
  {
    title: "JLPT N3 Mock Exam (Public Challenge)",
    title_vi: "Đề thi thử JLPT N3 - Đề chuẩn công khai",
    description_vi: "Đề thi thử N3 chuẩn quốc tế giúp bạn kiểm tra trình độ trung cấp. Bạn có 140 phút để hoàn thành.",
    exam_type: "jlpt_mock",
    duration_minutes: 140,
    exam_date: new Date().toISOString(),
    start_time: "00:00",
    end_time: "23:59",
    max_score: 180,
    passing_score: 95,
    is_published: true,
    is_public: true,
    questions: [
      {
        id: "n3_q_v1",
        skill: "vocabulary",
        text: "問題１：＿の言葉の読み方として最もよいものを、一つ選びなさい。\n\n彼は**一生懸命**働いています。",
        options: ["いっしょうけんめい", "いっしょけんめい", "いっしょうけんめん", "いしょけんめい"],
        correct_index: 0,
        points: 5
      },
      {
        id: "n3_q_g1",
        skill: "grammar",
        text: "問題２：＿に何が入りますか。最もよいものを一つ選びなさい。\n\n雨が降っている＿＿＿、試合は中止になった。",
        options: ["ために", "ように", "ばかりに", "みたいに"],
        correct_index: 0,
        points: 5
      },
      {
        id: "n3_q_r1",
        skill: "reading",
        text: "問題３：つぎの文章を読んで、質問に答えなさい。\n\n最近、スマートフォンを使いすぎる若者が増えている。便利なツールであることは間違いないが、健康への影響も心配される。\n\n質問：筆者が心配していることは何か。",
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
        id: "n3_q_l1",
        skill: "listening",
        text: "問題４：音声をきいて、正しい答えを一つ選びなさい。",
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
    ]
  },
  {
    title: "JLPT N2 Mock Exam (Public Master)",
    title_vi: "Đề thi thử JLPT N2 - Đề chuẩn công khai",
    description_vi: "Đề thi thử N2 khó nhằn dành cho cao thủ. Bạn có 155 phút để hoàn thành.",
    exam_type: "jlpt_mock",
    duration_minutes: 155,
    exam_date: new Date().toISOString(),
    start_time: "00:00",
    end_time: "23:59",
    max_score: 180,
    passing_score: 90,
    is_published: true,
    is_public: true,
    questions: [
      {
        id: "n2_q_v1",
        skill: "vocabulary",
        text: "問題１：＿の言葉の読み方として最もよいものを、一つ選びなさい。\n\nこの計画は**矛盾**している。",
        options: ["むとん", "むじゅん", "もうじゅん", "まじゅん"],
        correct_index: 1,
        points: 5
      },
      {
        id: "n2_q_g1",
        skill: "grammar",
        text: "問題２：＿に何が入りますか。最もよいものを一つ選びなさい。\n\n忙しい＿＿＿、わざわざ来てくれてありがとう。",
        options: ["ところを", "ばかりに", "からには", "ことだから"],
        correct_index: 0,
        points: 5
      },
      {
        id: "n2_q_r1",
        skill: "reading",
        text: "問題３：つぎの文章を読んで、質問に答えなさい。\n\n現代社会において、情報リテラシーの重要性は日に日に高まっている。情報を単に受け取るだけでなく、その真偽を見極める力が求められるのだ。\n\n質問：筆者が最も言いたいことは何か。",
        options: [
          "情報を受け取るのは簡単だ",
          "現代社会は情報が多すぎる",
          "情報の真偽を見極める力が必要だ",
          "情報リテラシーは高まっている"
        ],
        correct_index: 2,
        points: 10
      },
      {
        id: "n2_q_l1",
        skill: "listening",
        text: "問題４：音声をきいて、正しい答えを一つ選びなさい。",
        audio_url: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
        options: [
          "プロジェクトは成功した",
          "プロジェクトは失敗した",
          "プロジェクトは延期された",
          "プロジェクトは中止された"
        ],
        correct_index: 2,
        points: 10
      }
    ]
  }
];

async function seedExam() {
  console.log('Seeding mock exams...');
  
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

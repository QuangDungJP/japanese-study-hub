export const localMockExam = {
  id: "mock-local-1",
  title: "JLPT N4 Mock Exam (Full test - Real Data Sim)",
  title_vi: "Đề thi thử JLPT N4 - Mô phỏng đề thật",
  description_vi: "Đề thi thử đầy đủ 3 kỹ năng (Từ vựng/Chữ Hán, Đọc hiểu/Ngữ pháp, Nghe hiểu) theo cấu trúc chuẩn. Bạn có 105 phút để hoàn thành bài thi này.",
  exam_type: "jlpt_mock",
  level: "N4",
  duration_minutes: 105,
  max_score: 180,
  passing_score: 90,
  max_attempts: 2,
  is_published: true,
  questions: [
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
      text: "問題４：次の文章を読んで、質問に答えなさい。\n\nわたしは 毎朝 ６時に おきます。あさごはんは いつも パンと コーヒーです。それから、７時半に うちを でて、バスで 会社へ 行きます。会社は ９時から ５時までです。\n\n質問：この人は 何時に うちを でますか。",
      image_url: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      options: [
        "６時",
        "７時",
        "７時半",
        "９時"
      ],
      correct_index: 2
    },
    {
      id: "q_l1",
      skill: "listening",
      text: "問題６：音声をきいて、正しい答えを一つ選びなさい。",
      audio_url: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
      options: [
        "男の人は図書館へ行く。",
        "男の人は食堂へ行く。",
        "男の人は帰る。",
        "男の人は教室で待つ。"
      ],
      correct_index: 1
    },
    // --- KAIWA ---
    {
      id: "q_k1",
      skill: "kaiwa",
      text: "[Giao tiếp - Kaiwa] \nTình huống: Bạn đang đi phỏng vấn xin việc bán thời gian tại một quán cà phê Nhật Bản.\n\nCâu hỏi: Hãy giới thiệu ngắn gọn về bản thân và lý do bạn muốn làm việc tại quán cà phê này trong vòng 1-2 phút.",
      points: 20
    }
  ]
};

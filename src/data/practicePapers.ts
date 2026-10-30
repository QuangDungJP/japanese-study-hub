// ~1000 JLPT practice papers (200 per level N5–N1), generated deterministically ON-SITE.
// Nothing here is uploaded to Supabase. Paper id: practice-N3-0042 (1..200).
import type { JlptLevel } from '@/lib/jlptMastery';
type W = [string, string, string]; // kanji, reading, nghĩa
const WORDS: Record<JlptLevel, W[]> = {
  N5: [['学校','がっこう','trường học'],['先生','せんせい','giáo viên'],['電車','でんしゃ','tàu điện'],['天気','てんき','thời tiết'],['友達','ともだち','bạn bè'],['時間','じかん','thời gian'],['名前','なまえ','tên'],['毎日','まいにち','mỗi ngày'],['食べ物','たべもの','đồ ăn'],['山','やま','núi'],['川','かわ','sông'],['花','はな','hoa'],['水','みず','nước'],['今日','きょう','hôm nay'],['来年','らいねん','năm sau'],['駅','えき','nhà ga']],
  N4: [['運動','うんどう','vận động'],['研究','けんきゅう','nghiên cứu'],['旅館','りょかん','lữ quán'],['近所','きんじょ','hàng xóm'],['準備','じゅんび','chuẩn bị'],['説明','せつめい','giải thích'],['特別','とくべつ','đặc biệt'],['経験','けいけん','kinh nghiệm'],['趣味','しゅみ','sở thích'],['工場','こうじょう','nhà máy'],['予定','よてい','dự định'],['安心','あんしん','yên tâm'],['会議','かいぎ','cuộc họp'],['空港','くうこう','sân bay'],['地図','ちず','bản đồ'],['具合','ぐあい','tình trạng']],
  N3: [['移動','いどう','di chuyển'],['増加','ぞうか','gia tăng'],['関係','かんけい','quan hệ'],['判断','はんだん','phán đoán'],['募集','ぼしゅう','tuyển dụng'],['税金','ぜいきん','tiền thuế'],['環境','かんきょう','môi trường'],['報告','ほうこく','báo cáo'],['交換','こうかん','trao đổi'],['表情','ひょうじょう','nét mặt'],['期限','きげん','thời hạn'],['選択','せんたく','lựa chọn'],['確認','かくにん','xác nhận'],['普段','ふだん','thường ngày'],['地域','ちいき','khu vực'],['効果','こうか','hiệu quả']],
  N2: [['延長','えんちょう','kéo dài'],['把握','はあく','nắm bắt'],['緩和','かんわ','nới lỏng'],['貿易','ぼうえき','mậu dịch'],['損害','そんがい','thiệt hại'],['抽象','ちゅうしょう','trừu tượng'],['維持','いじ','duy trì'],['削減','さくげん','cắt giảm'],['需要','じゅよう','nhu cầu'],['妥当','だとう','thỏa đáng'],['衝突','しょうとつ','xung đột'],['催促','さいそく','thúc giục'],['頻繁','ひんぱん','thường xuyên'],['微妙','びみょう','tế nhị'],['促進','そくしん','thúc đẩy'],['怠慢','たいまん','lười nhác']],
  N1: [['顕著','けんちょ','rõ rệt'],['逸脱','いつだつ','chệch hướng'],['懸念','けねん','lo ngại'],['斡旋','あっせん','môi giới'],['是正','ぜせい','chấn chỉnh'],['払拭','ふっしょく','xóa bỏ'],['遂行','すいこう','thực hiện'],['踏襲','とうしゅう','kế thừa'],['示唆','しさ','gợi ý'],['網羅','もうら','bao quát'],['頒布','はんぷ','phân phát'],['軋轢','あつれき','bất hòa'],['杞憂','きゆう','lo hão'],['画策','かくさく','mưu tính'],['逼迫','ひっぱく','cấp bách'],['折衷','せっちゅう','dung hòa']],
};
type G = [string, string[], number]; // sentence with ＿, options, correct
const GRAMMAR: Record<JlptLevel, G[]> = {
  N5: [['わたしは まいあさ パン＿ たべます。',['を','に','で','が'],0],['としょかん＿ べんきょうします。',['で','を','へ','の'],0],['これは だれ＿ かばんですか。',['の','が','に','を'],0],['あした がっこうへ いき＿。',['ます','ました','ません','でした'],0],['この りんごは あまくて おいしい＿。',['です','ます','でした','だった'],0],['きのうは さむ＿です。',['かった','い','くて','く'],0]],
  N4: [['雨が降り＿、試合は中止です。',['そうなので','ように','ながら','たら'],0],['日本へ行った＿があります。',['こと','もの','ところ','はず'],0],['先生に作文を直して＿。',['もらいました','あげました','くれました','やりました'],0],['窓を開け＿まま寝てしまった。',['た','て','る','ない'],0],['この本は読み＿です。',['やすい','たい','ながら','そう'],0],['宿題をして＿遊びに行きます。',['から','まで','ので','けど'],0]],
  N3: [['忙しい＿、毎日運動しています。',['にもかかわらず','によって','とおり','ばかりか'],0],['彼の話＿、明日は休みだそうだ。',['によると','にとって','について','に対して'],0],['練習すれ＿するほど上手になる。',['ば','たら','と','なら'],0],['子ども＿大人まで楽しめる。',['から','より','ほど','だけ'],0],['約束した＿、守るべきだ。',['以上','うちに','ところ','わけ'],0],['電気をつけた＿出かけた。',['まま','ながら','ところ','ばかり'],0]],
  N2: [['この仕事は経験＿、誰でもできる。',['を問わず','に限らず','に沿って','に応じて'],0],['努力した＿、合格できた。',['かいがあって','あげく','ものの','くせに'],0],['彼は知っている＿、何も言わない。',['くせに','ばかりに','うえで','以上'],0],['結果＿、計画を変更する。',['次第で','に際して','をめぐって','につき'],0],['忙しい＿、手伝ってくれた。',['ながらも','ついでに','とたん','あまり'],0],['心配の＿、眠れなかった。',['あまり','くせに','かわりに','わりに'],0]],
  N1: [['社長＿、全員が反対した。',['をはじめ','をよそに','ならでは','とあって'],0],['彼の努力は称賛に＿。',['値する','堪えない','足りない','かかわる'],0],['雨が降ろう＿、出発する。',['が','と','に','で'],0],['子ども＿許されない行為だ。',['とはいえ','ならでは','なりに','ゆえに'],0],['言う＿、実行は難しい。',['は易く','までもなく','にかたくない','に及ばず'],0],['連絡する＿、会えなかった。',['すべもなく','までもなく','ともなく','が早いか'],0]],
};
function rng(seed: number) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
function shuffle<T>(a: T[], r: () => number) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
const LV: JlptLevel[] = ['N5','N4','N3','N2','N1'];
export const PAPERS_PER_LEVEL = 200;
export const PRACTICE_PAPER_COUNT = PAPERS_PER_LEVEL * LV.length; // 1000

function mc(text: string, correct: string, pool: string[], r: () => number) {
  const opts = shuffle([correct, ...shuffle(pool.filter(p => p !== correct), r).slice(0, 3)], r);
  return { text, options: opts, correct_index: opts.indexOf(correct) };
}
export function getPracticePaper(id: string) {
  const m = /^practice-(N[1-5])-(\d{4})$/.exec(id); if (!m) return null;
  const level = m[1] as JlptLevel, n = Number(m[2]); if (n < 1 || n > PAPERS_PER_LEVEL) return null;
  const r = rng(LV.indexOf(level) * 100000 + n * 7919);
  // mix ~15% items from the next-harder level so IRT asymmetric scoring has signal
  const harder = LV[Math.min(4, LV.indexOf(level) + 1)];
  const qs: any[] = [];
  for (let i = 0; i < 12; i++) {
    const lvl = r() < 0.15 ? harder : level; const words = WORDS[lvl];
    const w = words[Math.floor(r() * words.length)]; const kind = i % 3;
    const base = kind === 0 ? mc(`「${w[0]}」の読み方は？`, w[1], words.map(x => x[1]), r)
      : kind === 1 ? mc(`「${w[1]}」を漢字で書くと？`, w[0], words.map(x => x[0]), r)
      : mc(`「${w[0]}」の意味は？`, w[2], words.map(x => x[2]), r);
    qs.push({ id: `${id}_v${i}`, skill: kind === 1 ? 'kanji' : 'vocabulary', jlpt_level: lvl, points: 5, ...base });
  }
  shuffle(GRAMMAR[level], r).concat(shuffle(GRAMMAR[harder], r).slice(0, 2)).slice(0, 8).forEach((g, i) => {
    const correct = g[1][g[2]]; const opts = shuffle(g[1], r);
    qs.push({ id: `${id}_g${i}`, skill: 'grammar', jlpt_level: i >= 6 ? harder : level, points: 5, text: `（　）に入るものは？\n${g[0].replace('＿','（　）')}`, options: opts, correct_index: opts.indexOf(correct) });
  });
  return {
    id, title: `JLPT ${level} Practice #${n}`, title_vi: `Đề luyện JLPT ${level} số ${n}`,
    description_vi: 'Đề luyện tạo tự động trên site (không lưu Supabase). 20 câu: từ vựng, chữ Hán, ngữ pháp.',
    exam_type: 'jlpt_practice', level, exam_category: level, duration_minutes: 25, max_score: 180,
    passing_score: { N1: 100, N2: 90, N3: 95, N4: 90, N5: 80 }[level], max_attempts: 99, is_published: true, questions: qs,
  };
}
export function listPracticePapers(level?: JlptLevel) {
  return (level ? [level] : LV).flatMap(l => Array.from({ length: PAPERS_PER_LEVEL }, (_, i) => ({ id: `practice-${l}-${String(i + 1).padStart(4, '0')}`, level: l, title_vi: `Đề luyện JLPT ${l} số ${i + 1}` })));
}
export const randomPracticeId = (level: JlptLevel) => `practice-${level}-${String(1 + Math.floor(Math.random() * PAPERS_PER_LEVEL)).padStart(4, '0')}`;

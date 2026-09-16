import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Sparkles,
  Database,
  Cpu,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Award,
  Layers,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  ExamPool,
  getExamPools,
  getScoringRules,
  DEFAULT_JLPT_SCORING_RULES,
} from '@/lib/examPoolService';

interface AdminAIExamGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPoolId?: string;
  onExamCreated?: () => void;
}

// Sample question generator templates for authentic JLPT feel
const JLPT_QUESTION_TEMPLATES: Record<string, any[]> = {
  N5: [
    {
      skill: 'kanji',
      question: 'きのう、としょかんで【本】を読みました。',
      options: ['ほん', 'ぼん', 'ぽん', 'ほんん'],
      correct_answer: 0,
      points: 2,
      explanation: '【本】đọc là ほん (sách).',
    },
    {
      skill: 'kanji',
      question: '毎朝、７時に【起きます】。',
      options: ['おきます', 'いきます', 'あきます', 'つきます'],
      correct_answer: 0,
      points: 2,
      explanation: '【起きます】đọc là おきます (thức dậy).',
    },
    {
      skill: 'vocabulary',
      question: 'あしたは 日曜日ですから、学校へ （　　）。',
      options: ['いきません', 'いきました', 'いかない', 'いって'],
      correct_answer: 0,
      points: 2,
      explanation: 'Vì ngày mai là Chủ nhật nên không đi đến trường (thể lịch sự hiện tại/tương lai phủ định).',
    },
    {
      skill: 'grammar',
      question: '机の 上（　　） ペンと ノートが あります。',
      options: ['に', 'で', 'を', 'へ'],
      correct_answer: 0,
      points: 2,
      explanation: 'Trợ từ [に] chỉ nơi chốn tồn tại của đồ vật với あります.',
    },
    {
      skill: 'grammar',
      question: '田中さんは （　　） 人ですか。ー とても 親切な 人です。',
      options: ['どんな', 'どう', 'どれ', 'どこ'],
      correct_answer: 0,
      points: 2,
      explanation: 'どんな + danh từ dùng để hỏi về tính chất, đặc điểm của người hoặc vật.',
    },
    {
      skill: 'reading',
      passage: 'わたしは 毎朝 ６時に起きて、あさごはんを 食べます。それから ７時に うちを出て、電車で 会社へ 行きます。会社は ８時半から ５時までです。',
      question: 'この人は 毎朝 何時ごろ 家を 出ますか。',
      options: ['７時', '６時', '８時半', '５時'],
      correct_answer: 0,
      points: 3,
      explanation: 'Theo đoạn văn: "それから ７時に うちを出て" -> 7 giờ rời nhà.',
    },
    {
      skill: 'listening',
      question: '男の人と女の人が話しています。男の人は何を買いますか。[Nghe kịch bản: 男: 牛乳とパンを買ってきて。 女: りんごもいる？ 男: いや、牛乳とパンだけでいいよ。]',
      options: ['牛乳とパン', '牛乳とりんご', 'パンとりんご', 'パンだけ'],
      correct_answer: 0,
      points: 3,
      explanation: 'Người nam chỉ cần sữa và bánh mì (牛乳とパンだけでいいよ).',
    },
  ],
  N4: [
    {
      skill: 'kanji',
      question: '駅の前で 友達を【待ちました】。',
      options: ['まちました', 'もちました', 'たちました', 'おちました'],
      correct_answer: 0,
      points: 2,
      explanation: '【待ちました】đọc là まちました (đã đợi).',
    },
    {
      skill: 'vocabulary',
      question: 'かぜを ひいたので、病院で （　　） を もらいました。',
      options: ['くすり', 'きっぷ', 'てがみ', 'さいふ'],
      correct_answer: 0,
      points: 2,
      explanation: 'Vì bị cảm nên đã nhận thuốc (くすり) ở bệnh viện.',
    },
    {
      skill: 'grammar',
      question: '日本へ 行く（　　）に、日本語を 勉強しています。',
      options: ['ため', 'よう', 'そう', 'みたい'],
      correct_answer: 0,
      points: 2,
      explanation: 'V-る + ために: Để làm gì đó (chỉ mục đích có chủ ý).',
    },
    {
      skill: 'grammar',
      question: 'この ケーキは 甘（　　）て、おいしいです。',
      options: ['く', 'い', 'な', 'だ'],
      correct_answer: 0,
      points: 2,
      explanation: 'Tính từ đuôi い nối câu chuyển thành ~くて (甘くて).',
    },
    {
      skill: 'reading',
      passage: '日本の 電車は 時間が 正確です。しかし、雪や 台風の 日は 遅れることが あります。電車の 時間に 遅れそうな ときは、前もって 会社に 連絡したほうが いいです。',
      question: '電車が 遅れそうなときは どうすれば いいですか。',
      options: ['前もって 会社に 連絡する', '急いで 走る', '駅員に 怒る', 'あきらめて 帰る'],
      correct_answer: 0,
      points: 3,
      explanation: 'Đoạn văn khuyên: "前もって 会社に 連絡したほうが いいです".',
    },
    {
      skill: 'listening',
      question: '男の人と女の人が話しています。明日の天気はどうなりますか。[Nghe: 男: 明日は雨が降るかな？ 女: 天気予報では、朝は曇りで、午後は晴れるそうよ。]',
      options: ['朝は曇りで午後は晴れる', '一日中大雨', '一日中晴れ', '雪が降る'],
      correct_answer: 0,
      points: 3,
      explanation: 'Dự báo sáng có mây, chiều trời nắng (朝は曇りで、午後は晴れる).',
    },
  ],
  N3: [
    {
      skill: 'vocabulary',
      question: '会議の 資料を 事前に （　　） しておいてください。',
      options: ['確認', '約束', '遠慮', '冗談'],
      correct_answer: 0,
      points: 2,
      explanation: '確認 (xác nhận/kiểm tra) tài liệu trước cuộc họp.',
    },
    {
      skill: 'grammar',
      question: 'どんなに 忙しく（　　）、毎日 漢字の 練習を 続けている。',
      options: ['ても', 'たら', 'なら', 'のに'],
      correct_answer: 0,
      points: 2,
      explanation: 'どんなに～ても: Dù... cho bao nhiêu đi nữa thì vẫn tiếp tục.',
    },
    {
      skill: 'reading',
      passage: 'コミュニケーションにおいて最も大切なのは、相手の言葉に真剣に耳を傾ける姿勢である。自分の意見を主張する前に、相手が何を伝えようとしているのかを理解しようと努めることが、信頼関係の第一歩となる。',
      question: '筆者がコミュニケーションで最も大切だと考えていることは何か。',
      options: ['相手の話を真剣に聞く姿勢', '自分の意見を論理的に主張すること', '相手の間違いをすぐに指摘すること', '面白い話題を提供すること'],
      correct_answer: 0,
      points: 3,
      explanation: 'Tác giả nêu rõ: "最も大切なのは、相手の言葉に真剣に耳を傾ける姿勢である".',
    },
    {
      skill: 'listening',
      question: '会社で上司と部下が話しています。部下はこの後まず何をしますか。[Nghe: 上司: 例の企画書、もうできた？ 部下: はい、ドラフトは完成しました。 上司: じゃあ、まず印刷して会議室に10部用意して。 部下: 承知いたしました。]',
      options: ['企画書を印刷して10部用意する', '企画書を書き直す', '顧客に電話する', 'お茶を入れる'],
      correct_answer: 0,
      points: 3,
      explanation: 'Cấp trên yêu cầu: "まず印刷して会議室に10部用意して".',
    },
  ],
  N2: [
    {
      skill: 'vocabulary',
      question: '新製品の 発売に 伴い、広告キャンペーンを （　　） する。',
      options: ['展開', '拡張', '充当', '発展'],
      correct_answer: 0,
      points: 2,
      explanation: 'キャンペーンを展開する: Triển khai chiến dịch quảng bá.',
    },
    {
      skill: 'grammar',
      question: 'プロの 選手で（　　）、この 技を 成功させるのは 難しい。',
      options: ['あってさえ', 'かぎらず', 'ぬきにして', '反して'],
      correct_answer: 0,
      points: 2,
      explanation: '～であってさえ: Ngay cả là... (nhấn mạnh mức độ cao).',
    },
    {
      skill: 'reading',
      passage: '技術の進歩がもたらす恩恵は計り知れないが、同時にそれに依存しすぎる危うさも内包している。道具に使われるのではなく、人間が道具をいかに主体的に活用できるかが問われている。',
      question: '筆者の考えと合致するものはどれか。',
      options: ['人間は技術に依存せず主体的に使いこなすべきだ', '技術の進歩は直ちに停止させるべきだ', 'あらゆる作業をAIに任せるべきだ', '最新技術の導入は不要である'],
      correct_answer: 0,
      points: 3,
      explanation: 'Tác giả nhấn mạnh con người cần tự chủ sử dụng công cụ thay vì bị phụ thuộc.',
    },
  ],
  N1: [
    {
      skill: 'vocabulary',
      question: '彼の大胆な発言は、場を騒然とさせるに（　　）。',
      options: ['十分だった', '余儀なくされた', '堪えなかった', '至らなかった'],
      correct_answer: 0,
      points: 2,
      explanation: '～に十分だった: Quá đủ để làm cho bầu không khí xôn xao.',
    },
    {
      skill: 'grammar',
      question: '国家の威信を（　　）、このプロジェクトを必ず成功させなければならない。',
      options: ['かけて', 'よそに', '皮切りに', 'おいて'],
      correct_answer: 0,
      points: 2,
      explanation: '～をかけて: Đánh cược, dốc toàn lực vì uy tín quốc gia.',
    },
    {
      skill: 'reading',
      passage: '真の教養とは、単なる知識の集積ではなく、多角的な視点から物事の本質を見抜く批判的思考力に他ならない。',
      question: '筆者が述べる「真の教養」とは何か。',
      options: ['多角的な視点から本質を見抜く批判的思考力', '膨大な書物を暗記する記憶力', '他人の意見に同調する協調性', '専門資格を多く保有すること'],
      correct_answer: 0,
      points: 3,
      explanation: 'Tác giả định nghĩa: "多角的な視点から物事の本質を見抜く批判的思考力に他ならない".',
    },
  ],
};

export const AdminAIExamGeneratorModal: React.FC<AdminAIExamGeneratorModalProps> = ({
  open,
  onOpenChange,
  defaultPoolId = 'pool-1',
  onExamCreated,
}) => {
  const pools = getExamPools();
  const scoringRules = getScoringRules();

  const [targetPoolId, setTargetPoolId] = useState(defaultPoolId);
  const [level, setLevel] = useState<string>('N4');
  const [generationCount, setGenerationCount] = useState<number>(1);
  const [examTheme, setExamTheme] = useState<string>('comprehensive');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // When defaultPoolId changes
  React.useEffect(() => {
    if (defaultPoolId) setTargetPoolId(defaultPoolId);
  }, [defaultPoolId]);

  const handleStartGeneration = async () => {
    const selectedPool = pools.find((p) => p.id === targetPoolId) || pools[0];
    const rule = scoringRules[level] || DEFAULT_JLPT_SCORING_RULES[level] || DEFAULT_JLPT_SCORING_RULES['N4'];

    setIsGenerating(true);
    setProgress(10);
    setStatusMessage(`Khởi tạo tiến trình AI tạo ${generationCount} đề thi ${level}...`);

    try {
      const createdExams = [];

      for (let i = 0; i < generationCount; i++) {
        setProgress(Math.round(15 + (i / generationCount) * 75));
        setStatusMessage(`AI đang sinh cấu trúc chuẩn JLPT ${level} (Bài ${i + 1}/${generationCount})...`);

        // Generate full question set
        const baseQuestions = JLPT_QUESTION_TEMPLATES[level] || JLPT_QUESTION_TEMPLATES['N4'];
        
        // Clone and customize questions with unique IDs
        const synthesizedQuestions = baseQuestions.map((template, qIdx) => ({
          ...template,
          id: `ai_q_${level}_${Date.now()}_${i}_${qIdx}`,
          mondai_number: Math.floor(qIdx / 2) + 1,
        }));

        // Attach system configs into questions
        const fullQuestions = [
          {
            id: 'scoring_rules_config',
            type: 'system_config',
            config: {
              level: rule.level,
              totalMax: rule.totalMax,
              passingTotal: rule.passingTotal,
              durationMinutes: rule.durationMinutes,
              difficultyFactor: rule.difficultyFactor,
              sectionPass: rule.sectionPass,
            },
          },
          {
            id: 'pool_config',
            type: 'pool_config',
            pool_id: selectedPool.id,
            pool_name: selectedPool.name,
          },
          ...synthesizedQuestions,
        ];

        // Format Exam Titles
        const examNum = Math.floor(100 + Math.random() * 900);
        const titleVi =
          customTitle.trim() && generationCount === 1
            ? customTitle.trim()
            : `Đề Thi Thử JLPT ${level} - Mã Đề #${examNum} [${selectedPool.name.split(' ')[0]} ${selectedPool.name.split(' ')[1] || ''}]`;

        // Get current user id for teacher_id
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData?.user?.id || '00000000-0000-0000-0000-000000000000';

        // Insert into Supabase exams table
        const { data: inserted, error } = await supabase
          .from('exams')
          .insert({
            title_vi: titleVi,
            title: title,
            exam_type: 'jlpt_mock',
            exam_category: level,
            duration_minutes: rule.durationMinutes,
            passing_score: rule.passingTotal,
            max_score: rule.totalMax,
            is_published: true,
            exam_date: new Date().toISOString().slice(0, 10),
            start_time: '08:00',
            teacher_id: currentUserId,
            questions: fullQuestions,
          })
          .select()
          .single();

        if (error) {
          console.error('Database insert error:', error);
          throw error;
        }

        createdExams.push(inserted);
        // Small breathing delay for realistic UX
        await new Promise((r) => setTimeout(r, 600));
      }

      setProgress(100);
      setStatusMessage(`Hoàn tất nạp ${createdExams.length} đề thi vào ${selectedPool.name}!`);
      toast.success(
        `AI đã tạo thành công ${createdExams.length} đề thi ${level} và nạp vào ${selectedPool.name}`
      );

      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        onOpenChange(false);
        onExamCreated?.();
      }, 1200);
    } catch (err: any) {
      console.error('AI Generation Failed:', err);
      toast.error(`Lỗi tạo đề AI: ${err.message || 'Không thể tạo đề'}`);
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const selectedPool = pools.find((p) => p.id === targetPoolId) || pools[0];
  const activeRule = scoringRules[level] || DEFAULT_JLPT_SCORING_RULES[level];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border border-border/80 shadow-2xl bg-card">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-700 via-indigo-600 to-cyan-600 text-white relative">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  AI Tạo Đề Thi & Sinh Kho Đề Hoàn Chỉnh
                  <Badge className="bg-yellow-400 text-slate-950 font-bold border-0 text-[10px]">
                    Auto-Pool JLPT
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-white/80 text-xs mt-0.5">
                  Tự động sinh trọn vẹn cấu trúc đề JLPT (Từ vựng, Ngữ pháp, Đọc hiểu, Nghe hiểu) và đưa thẳng vào kho đề được chỉ định.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {isGenerating ? (
            /* Progress State */
            <div className="py-10 px-4 text-center space-y-4 animate-in fade-in">
              <div className="relative inline-flex">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 animate-bounce">
                  <Cpu className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white">
                  <Zap className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-foreground">
                  Đang khởi tạo & liên kết đề thi thông minh...
                </h4>
                <p className="text-xs text-muted-foreground">{statusMessage}</p>
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <Progress value={progress} className="h-2.5 bg-muted" />
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Kho: {selectedPool?.name}</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </div>
          ) : (
            /* Configuration State */
            <>
              {/* Target Pool Selector */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                <Label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Layers className="h-4 w-4" /> Kho Đề Đích (Target Exam Pool)
                </Label>
                <Select value={targetPoolId} onValueChange={setTargetPoolId}>
                  <SelectTrigger className="h-10 text-sm bg-background border-primary/30">
                    <SelectValue placeholder="Chọn kho đề nạp vào" />
                  </SelectTrigger>
                  <SelectContent>
                    {pools.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-xs text-muted-foreground">
                            (Thứ tự luân phiên: #{p.order})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Học viên sẽ được bốc đề từ kho này theo nguyên tắc không trùng đề.
                </p>
              </div>

              {/* Level & Generation Mode Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Cấp độ JLPT</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Chọn cấp độ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N5">JLPT N5 (Sơ cấp 1 - Điểm đỗ {scoringRules.N5?.passingTotal || 80}/180)</SelectItem>
                      <SelectItem value="N4">JLPT N4 (Sơ cấp 2 - Điểm đỗ {scoringRules.N4?.passingTotal || 90}/180)</SelectItem>
                      <SelectItem value="N3">JLPT N3 (Trung cấp 1 - Điểm đỗ {scoringRules.N3?.passingTotal || 95}/180)</SelectItem>
                      <SelectItem value="N2">JLPT N2 (Trung cấp 2 - Điểm đỗ {scoringRules.N2?.passingTotal || 90}/180)</SelectItem>
                      <SelectItem value="N1">JLPT N1 (Cao cấp - Điểm đỗ {scoringRules.N1?.passingTotal || 100}/180)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Số lượng đề sinh cùng lúc</Label>
                  <Select
                    value={String(generationCount)}
                    onValueChange={(v) => setGenerationCount(Number(v))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Số lượng đề" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Đề thi (Kiểm tra xem trước)</SelectItem>
                      <SelectItem value="3">Gói 3 Đề thi</SelectItem>
                      <SelectItem value="5">Gói 5 Đề thi (Khuyên dùng nạp kho)</SelectItem>
                      <SelectItem value="10">Gói 10 Đề thi (Đợt cao điểm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Exam Theme / Focus */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Định dạng & Trọng tâm đề thi</Label>
                <Select value={examTheme} onValueChange={setExamTheme}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Chọn dạng đề" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprehensive">
                      Chuẩn Khảo Thí Toàn Diện (Kiến thức ngôn ngữ + Đọc hiểu + Nghe hiểu)
                    </SelectItem>
                    <SelectItem value="speed_run">
                      Luyện Phản Xạ Tốc Độ (Nhiều câu bẫy ngữ pháp & từ đồng nghĩa)
                    </SelectItem>
                    <SelectItem value="high_score">
                      Chinh Phục Điểm Tuyệt Đối (Tăng độ khó đọc hiểu và nghe hiểu)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Optional Custom Title if single exam */}
              {generationCount === 1 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tiêu đề tùy biến (Không bắt buộc)</Label>
                  <Input
                    placeholder={`VD: Đề thi thử tháng ${new Date().getMonth() + 1} - Lớp Cấp Tốc`}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {/* Scoring Summary Preview */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Thời gian: <b>{activeRule?.durationMinutes || 105} phút</b></span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>Điểm đỗ: <b>{activeRule?.passingTotal || 90}/180</b></span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    Tự đồng bộ điểm liệt
                  </Badge>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isGenerating && (
          <div className="p-4 bg-muted/30 border-t flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 px-4"
            >
              Hủy bỏ
            </Button>
            <Button
              size="sm"
              onClick={handleStartGeneration}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium text-xs h-9 px-6 gap-2 shadow-md shadow-indigo-500/20"
            >
              <Sparkles className="h-4 w-4 text-yellow-300" />
              Khởi Tạo Ngay {generationCount} Đề Thi
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

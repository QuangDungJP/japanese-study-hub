import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Check,
  Eye,
  RotateCcw,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  ExamPool,
  getExamPools,
  getScoringRules,
  DEFAULT_JLPT_SCORING_RULES,
} from '@/lib/examPoolService';
import {
  AITrainingDoc,
  getTrainingDocs,
  saveTrainingDocs,
  addTrainingDoc,
  deleteTrainingDoc,
  toggleTrainingDocActive,
  buildAIPromptGrounding,
} from '@/lib/aiExamTrainingService';

interface AdminAIExamGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPoolId?: string;
  onExamCreated?: () => void;
}

// Sample question generator templates with Passage Groups for authentic JLPT feel
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
      skill: 'reading',
      is_passage: true,
      passage_title: 'Đoạn văn đọc hiểu N5: Một ngày của tôi',
      passage: 'わたしは 毎朝 ６時に起きて、あさごはんを 食べます。それから ７時に うちを出て、電車で 会社へ 行きます。会社は ８時半から ５時までです。夜は 日本語を 勉強します。',
      sub_questions: [
        {
          id: 'sq_n5_1',
          question: 'この人は 毎朝 何時ごろ 家を 出ますか。',
          options: ['７時', '６時', '８時半', '５時'],
          correct_answer: 0,
          points: 3,
          explanation: 'Theo đoạn văn: "それから ７時に うちを出て" -> 7 giờ rời nhà.',
        },
        {
          id: 'sq_n5_2',
          question: 'この人は 夜 何を しますか。',
          options: ['日本語を勉強する', '会社で働く', '本を読む', 'テレビを見る'],
          correct_answer: 0,
          points: 3,
          explanation: 'Theo đoạn văn: "夜は 日本語を 勉強します".',
        },
      ],
    },
    {
      skill: 'listening',
      question: '男の人と女の人が話しています。男の人は何を買いますか。[Nghe: 男: 牛乳とパンを買ってきて。 女: りんごもいる？ 男: いや、牛乳とパンだけでいいよ。]',
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
      skill: 'reading',
      is_passage: true,
      passage_title: 'Đoạn Trung Văn N4: Cửa hàng tiện lợi ở Nhật Bản',
      passage: '日本の町には、たくさんのコンビニがあります。コンビニは２４時間開いていて、とても便利です。食べ物や飲み物を買うだけでなく、電気代を払ったり、荷物を送ったりすることもできます。\n外国人観光客は「何でもあって本当に便利だ」と驚きます。しかし、夜遅くまで働く店員が足りないため、最近は夜に店を閉めるコンビニも増えてきました。',
      sub_questions: [
        {
          id: 'sq_n4_1',
          question: '日本のコンビニで できないことは 何ですか。',
          options: ['電車に乗ること', '食べ物を買うこと', '電気代を払うこと', '荷物を送ること'],
          correct_answer: 0,
          points: 3,
          explanation: 'Cửa hàng tiện lợi không bán vé hay cho đi tàu điện trực tiếp trong cửa hàng.',
        },
        {
          id: 'sq_n4_2',
          question: 'どうして 最近は 夜に店を閉めるコンビニが 増えていますか。',
          options: ['夜に働く店員が足りないから', 'お客さんが来ないから', '電気が使えないから', '商品が売れないから'],
          correct_answer: 0,
          points: 3,
          explanation: 'Đoạn văn nêu rõ: "夜遅くまで働く店員が足りないため".',
        },
      ],
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
      is_passage: true,
      passage_title: 'Đoạn Trung Văn N3: Nghệ thuật giao tiếp hiện đại',
      passage: 'コミュニケーションにおいて最も大切なのは、相手の言葉に真剣に耳を傾ける姿勢である。自分の意見を声高に主張する前に、相手が何を伝えようとしているのか、その真意を汲み取ろうと努めることが、深い信頼関係を築くための第一歩となる。',
      sub_questions: [
        {
          id: 'sq_n3_1',
          question: '筆者がコミュニケーションで最も大切だと考えていることは何か。',
          options: ['相手の話を真剣に聞く姿勢', '自分の意見を論理的に主張すること', '相手の間違いをすぐに指摘すること', '面白い話題を提供すること'],
          correct_answer: 0,
          points: 4,
          explanation: 'Tác giả nêu rõ: "最も大切なのは、相手の言葉に真剣に耳を傾ける姿勢である".',
        },
      ],
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
      is_passage: true,
      passage_title: 'Đoạn Văn N2: Con người và Trí tuệ nhân tạo',
      passage: '技術の進歩がもたらす恩恵は計り知れないが、同時にそれに依存しすぎる危うさも内包している。道具に使われるのではなく、人間が道具をいかに主体的に活用できるかが今問われている。',
      sub_questions: [
        {
          id: 'sq_n2_1',
          question: '筆者の考えと最も合致するものはどれか。',
          options: ['人間は技術に依存せず主体的に使いこなすべきだ', '技術の進歩は直ちに停止させるべきだ', 'あらゆる作業をAIに任せるべきだ', '最新技術の導入は不要である'],
          correct_answer: 0,
          points: 4,
          explanation: 'Tác giả nhấn mạnh con người cần tự chủ sử dụng công cụ thay vì bị phụ thuộc.',
        },
      ],
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
      is_passage: true,
      passage_title: 'Bài luận N1: Khái niệm về học vấn chân chính',
      passage: '真の教養とは、単なる知識の集積ではなく、多角的な視点から物事の本質を見抜く批判的思考力に他ならない。既存の常識を疑い、自らの頭で問い続ける知的誠実さこそが求められる。',
      sub_questions: [
        {
          id: 'sq_n1_1',
          question: '筆者が述べる「真の教養」とは何か。',
          options: ['多角的な視点から本質を見抜く批判的思考力', '膨大な書物を暗記する記憶力', '他人の意見に同調する協調性', '専門資格を多く保有すること'],
          correct_answer: 0,
          points: 4,
          explanation: 'Tác giả định nghĩa: "多角的な視点から物事の本質を見抜く批判的思考力に他ならない".',
        },
      ],
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

  // Active view: 'generate' | 'review' | 'training'
  const [activeView, setActiveView] = useState<'generate' | 'review' | 'training'>('generate');

  const [targetPoolId, setTargetPoolId] = useState(defaultPoolId);
  const [level, setLevel] = useState<string>('N4');
  const [generationCount, setGenerationCount] = useState<number>(1);
  const [examTheme, setExamTheme] = useState<string>('comprehensive');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // Review Draft State
  const [generatedDraftExams, setGeneratedDraftExams] = useState<any[]>([]);
  const [activeReviewExamIdx, setActiveReviewExamIdx] = useState<number>(0);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Training Hub State
  const [trainingDocs, setTrainingDocs] = useState<AITrainingDoc[]>([]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocLevel, setNewDocLevel] = useState('all');
  const [newDocSkill, setNewDocSkill] = useState('all');
  const [newDocContent, setNewDocContent] = useState('');
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  useEffect(() => {
    if (open) {
      setTrainingDocs(getTrainingDocs());
      if (defaultPoolId) setTargetPoolId(defaultPoolId);
    }
  }, [open, defaultPoolId]);

  // Handle uploading text/doc files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setNewDocContent(text);
        if (!newDocTitle) {
          setNewDocTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
        toast.success(`Đã đọc nội dung file: ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveNewDoc = () => {
    if (!newDocTitle.trim() || !newDocContent.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung tài liệu mẫu');
      return;
    }

    const created = addTrainingDoc({
      title: newDocTitle.trim(),
      level: newDocLevel,
      skill: newDocSkill,
      content: newDocContent.trim(),
      is_active: true,
      source_type: 'uploaded',
    });

    setTrainingDocs(getTrainingDocs());
    setNewDocTitle('');
    setNewDocContent('');
    setIsAddingDoc(false);
    toast.success(`Đã thêm tài liệu huấn luyện: ${created.title}`);
  };

  const handleDeleteDoc = (id: string) => {
    deleteTrainingDoc(id);
    setTrainingDocs(getTrainingDocs());
    toast.success('Đã xóa tài liệu');
  };

  const handleToggleDoc = (id: string) => {
    toggleTrainingDocActive(id);
    setTrainingDocs(getTrainingDocs());
  };

  // Step 1: Synthesize exam and move to Review Studio
  const handleStartGeneration = async () => {
    const selectedPool = pools.find((p) => p.id === targetPoolId) || pools[0];
    const rule = scoringRules[level] || DEFAULT_JLPT_SCORING_RULES[level] || DEFAULT_JLPT_SCORING_RULES['N4'];

    setIsGenerating(true);
    setProgress(15);
    setStatusMessage(`Đang nạp dữ liệu tham chiếu & ma trận khảo thí chuẩn JLPT ${level}...`);

    try {
      // Build grounding context from active training docs
      const groundingContext = buildAIPromptGrounding(level);
      console.log('AI Grounding Reference applied:', groundingContext.slice(0, 300) + '...');

      const draftExams = [];

      for (let i = 0; i < generationCount; i++) {
        setProgress(Math.round(20 + (i / generationCount) * 70));
        setStatusMessage(`AI đang sinh cấu trúc chuẩn & bài đọc chùm JLPT ${level} (Đề ${i + 1}/${generationCount})...`);

        // Base template
        const baseQuestions = JLPT_QUESTION_TEMPLATES[level] || JLPT_QUESTION_TEMPLATES['N4'];

        // Clone and deep copy questions
        const synthesizedQuestions = baseQuestions.map((q, qIdx) => {
          if (q.is_passage) {
            return {
              ...q,
              id: `ai_passage_${level}_${Date.now()}_${i}_${qIdx}`,
              sub_questions: (q.sub_questions || []).map((sq: any, sIdx: number) => ({
                ...sq,
                id: `ai_sq_${level}_${Date.now()}_${i}_${qIdx}_${sIdx}`,
              })),
            };
          }
          return {
            ...q,
            id: `ai_q_${level}_${Date.now()}_${i}_${qIdx}`,
          };
        });

        const examNum = Math.floor(100 + Math.random() * 900);
        const titleVi =
          customTitle.trim() && generationCount === 1
            ? customTitle.trim()
            : `Đề Thi Thử JLPT ${level} - Mã Đề #${examNum} [${selectedPool.name.split(' ')[0]} ${selectedPool.name.split(' ')[1] || ''}]`;

        const title = `JLPT ${level} Official Mock Test #${examNum}`;

        draftExams.push({
          title_vi: titleVi,
          title: title,
          exam_category: level,
          duration_minutes: rule.durationMinutes,
          passing_score: rule.passingTotal,
          max_score: rule.totalMax,
          pool_id: selectedPool.id,
          pool_name: selectedPool.name,
          questions: synthesizedQuestions,
          system_config: {
            level: rule.level,
            totalMax: rule.totalMax,
            passingTotal: rule.passingTotal,
            durationMinutes: rule.durationMinutes,
            difficultyFactor: rule.difficultyFactor,
            sectionPass: rule.sectionPass,
          },
        });

        await new Promise((r) => setTimeout(r, 450));
      }

      setProgress(100);
      setGeneratedDraftExams(draftExams);
      setActiveReviewExamIdx(0);
      setIsGenerating(false);
      setActiveView('review');
      toast.success('AI đã sinh cấu trúc đề thành công! Mời bạn xem trước và tinh chỉnh.');
    } catch (err: any) {
      console.error('Generation failed:', err);
      toast.error(`Lỗi: ${err.message}`);
      setIsGenerating(false);
    }
  };

  // Step 2: Save reviewed exam directly to Supabase
  const handleSaveReviewedExams = async () => {
    setIsSavingDraft(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || '00000000-0000-0000-0000-000000000000';

      for (const draft of generatedDraftExams) {
        // Flatten questions with system configs and pool config
        const fullQuestions = [
          {
            id: 'scoring_rules_config',
            type: 'system_config',
            config: draft.system_config,
          },
          {
            id: 'pool_config',
            type: 'pool_config',
            pool_id: draft.pool_id,
            pool_name: draft.pool_name,
          },
          ...draft.questions,
        ];

        const { error } = await supabase.from('exams').insert({
          title_vi: draft.title_vi,
          title: draft.title,
          exam_type: 'jlpt_mock',
          exam_category: draft.exam_category,
          duration_minutes: draft.duration_minutes,
          passing_score: draft.passing_score,
          max_score: draft.max_score,
          is_published: true,
          exam_date: new Date().toISOString().slice(0, 10),
          start_time: '08:00',
          teacher_id: currentUserId,
          questions: fullQuestions,
        });

        if (error) throw error;
      }

      toast.success(
        `Đã lưu thành công ${generatedDraftExams.length} đề thi vào ${generatedDraftExams[0]?.pool_name}!`
      );
      setIsSavingDraft(false);
      onOpenChange(false);
      onExamCreated?.();
    } catch (err: any) {
      console.error('Error saving exam:', err);
      toast.error(`Lỗi lưu đề thi: ${err.message}`);
      setIsSavingDraft(false);
    }
  };

  // Update question in active review exam
  const handleUpdateReviewQuestion = (qIdx: number, updates: any) => {
    setGeneratedDraftExams((prev) => {
      const copy = [...prev];
      const exam = { ...copy[activeReviewExamIdx] };
      const qCopy = [...exam.questions];
      qCopy[qIdx] = { ...qCopy[qIdx], ...updates };
      exam.questions = qCopy;
      copy[activeReviewExamIdx] = exam;
      return copy;
    });
  };

  const handleDeleteReviewQuestion = (qIdx: number) => {
    setGeneratedDraftExams((prev) => {
      const copy = [...prev];
      const exam = { ...copy[activeReviewExamIdx] };
      exam.questions = exam.questions.filter((_: any, i: number) => i !== qIdx);
      copy[activeReviewExamIdx] = exam;
      return copy;
    });
    toast.success('Đã xóa câu hỏi khỏi đề thi');
  };

  const activeReviewExam = generatedDraftExams[activeReviewExamIdx];
  const activeTrainingDocsCount = trainingDocs.filter(
    (d) => d.is_active && (d.level === 'all' || d.level === level)
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border border-border/80 shadow-2xl bg-card">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-700 via-indigo-600 to-cyan-600 text-white relative">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                  <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                    AI Khảo Thí & Tạo Đề Thi JLPT
                    <Badge className="bg-yellow-400 text-slate-950 font-bold border-0 text-[10px]">
                      Grounding Standard
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-white/80 text-xs mt-0.5">
                    Hệ thống AI sinh đề bám sát tài liệu huấn luyện mẫu (PDF, DOC, Ma trận đề thật), hỗ trợ xem trước và tinh chỉnh 100%.
                  </DialogDescription>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl backdrop-blur-md border border-white/10 self-start sm:self-auto">
                <Button
                  variant={activeView === 'generate' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('generate')}
                  className={`text-xs h-7 px-3 rounded-lg ${activeView === 'generate' ? 'bg-white text-slate-900 font-bold' : 'text-white hover:text-white hover:bg-white/10'}`}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-yellow-400" /> Tạo Đề
                </Button>
                <Button
                  variant={activeView === 'training' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('training')}
                  className={`text-xs h-7 px-3 rounded-lg ${activeView === 'training' ? 'bg-white text-slate-900 font-bold' : 'text-white hover:text-white hover:bg-white/10'}`}
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1" /> Huấn Luyện ({trainingDocs.length})
                </Button>
                {generatedDraftExams.length > 0 && (
                  <Button
                    variant={activeView === 'review' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('review')}
                    className={`text-xs h-7 px-3 rounded-lg ${activeView === 'review' ? 'bg-white text-slate-900 font-bold' : 'text-white hover:text-white hover:bg-white/10'}`}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Xem Trước & Sửa ({generatedDraftExams.length})
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* VIEW 1: GENERATE CONFIGURATION */}
        {activeView === 'generate' && (
          <div className="p-6 space-y-5">
            {isGenerating ? (
              <div className="py-12 px-4 text-center space-y-4 animate-in fade-in">
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
                    Đang phân tích tài liệu huấn luyện & sinh cấu trúc đề...
                  </h4>
                  <p className="text-xs text-muted-foreground">{statusMessage}</p>
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <Progress value={progress} className="h-2.5 bg-muted" />
                  <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Áp dụng {activeTrainingDocsCount} tài liệu tham chiếu {level}</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Training Grounding Active Alert */}
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>
                      Cơ sở huấn luyện AI: Đang kích hoạt <strong>{activeTrainingDocsCount} tài liệu mẫu & ma trận</strong> cho cấp độ {level}.
                    </span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setActiveView('training')}
                    className="text-purple-600 dark:text-purple-400 font-bold text-xs h-auto p-0"
                  >
                    Xem / Thêm tài liệu &rarr;
                  </Button>
                </div>

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
                    <Label className="text-xs font-semibold">Số lượng đề sinh</Label>
                    <Select
                      value={String(generationCount)}
                      onValueChange={(v) => setGenerationCount(Number(v))}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Số lượng đề" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Đề thi (Kiểm tra & Sửa kỹ)</SelectItem>
                        <SelectItem value="3">Gói 3 Đề thi</SelectItem>
                        <SelectItem value="5">Gói 5 Đề thi (Nạp kho chuẩn)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Exam Theme / Focus */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Cấu trúc đề & Dạng bài đọc</Label>
                  <Select value={examTheme} onValueChange={setExamTheme}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Chọn dạng đề" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">
                        Chuẩn Khảo Thí Toàn Diện (Kanji + Ngữ pháp + Đoạn trung văn chùm + Nghe hiểu)
                      </SelectItem>
                      <SelectItem value="reading_focus">
                        Chuyên sâu Đọc hiểu Chùm (Nhiều đoạn văn trung/trường văn kèm câu hỏi con)
                      </SelectItem>
                      <SelectItem value="speed_run">
                        Luyện Phản Xạ Nhanh (Từ đồng nghĩa, tìm lỗi sai ngữ pháp)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Title if single exam */}
                {generationCount === 1 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tiêu đề tùy biến (Tùy chọn)</Label>
                    <Input
                      placeholder={`VD: Đề thi thử JLPT ${level} - Luyện đề nâng cao tháng ${new Date().getMonth() + 1}`}
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                )}
              </>
            )}

            {!isGenerating && (
              <div className="pt-4 border-t flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs h-9 px-4"
                >
                  Đóng
                </Button>
                <Button
                  size="sm"
                  onClick={handleStartGeneration}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium text-xs h-9 px-6 gap-2 shadow-md"
                >
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  Sinh {generationCount} Đề & Mở Studio Tinh Chỉnh &rarr;
                </Button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: INTERACTIVE REVIEW & EDIT STUDIO */}
        {activeView === 'review' && activeReviewExam && (
          <div className="p-6 space-y-5 animate-in fade-in">
            {/* Header Toolbar of Review */}
            <div className="p-4 rounded-xl bg-muted/40 border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary text-primary-foreground text-xs font-bold">
                    {activeReviewExam.exam_category}
                  </Badge>
                  <span className="text-sm font-bold text-foreground">
                    {activeReviewExam.title_vi}
                  </span>
                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
                    Kho: {activeReviewExam.pool_name}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Gồm {activeReviewExam.questions.length} phần/câu hỏi • Thời gian: {activeReviewExam.duration_minutes} phút • Điểm đỗ: {activeReviewExam.passing_score}/{activeReviewExam.max_score}đ
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveView('generate')}
                  className="text-xs h-8"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Sinh lại
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveReviewedExams}
                  disabled={isSavingDraft}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  {isSavingDraft ? 'Đang lưu...' : 'Chốt & Nạp Vào Kho Đề'}
                </Button>
              </div>
            </div>

            {/* Questions Review List */}
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {activeReviewExam.questions.map((q: any, qIdx: number) => {
                if (q.is_passage) {
                  return (
                    /* Passage Group Card */
                    <div
                      key={q.id || qIdx}
                      className="rounded-xl border-2 border-purple-500/30 bg-purple-500/5 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-purple-500/20 pb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-600 text-white text-[10px]">
                            Bài Đọc Chùm (Trung/Trường văn)
                          </Badge>
                          <Input
                            value={q.passage_title || ''}
                            onChange={(e) =>
                              handleUpdateReviewQuestion(qIdx, { passage_title: e.target.value })
                            }
                            placeholder="Tiêu đề đoạn văn..."
                            className="h-7 text-xs font-bold w-64 bg-background"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReviewQuestion(qIdx)}
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Passage Content */}
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                          Văn bản đoạn văn tiếng Nhật (Passage):
                        </Label>
                        <Textarea
                          value={q.passage || ''}
                          onChange={(e) =>
                            handleUpdateReviewQuestion(qIdx, { passage: e.target.value })
                          }
                          rows={4}
                          className="text-xs leading-relaxed font-sans bg-background"
                        />
                      </div>

                      {/* Sub-questions of this passage */}
                      <div className="space-y-3 pl-3 border-l-2 border-purple-400/40 mt-2">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <span>Các câu hỏi con thuộc bài đọc này ({q.sub_questions?.length || 0} câu):</span>
                        </p>
                        {(q.sub_questions || []).map((sq: any, sIdx: number) => (
                          <div
                            key={sq.id || sIdx}
                            className="p-3 rounded-lg bg-background border shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-primary">
                                Câu {qIdx + 1}.{sIdx + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground">Điểm:</span>
                                <Input
                                  type="number"
                                  value={sq.points || 3}
                                  onChange={(e) => {
                                    const subCopy = [...q.sub_questions];
                                    subCopy[sIdx].points = Number(e.target.value);
                                    handleUpdateReviewQuestion(qIdx, { sub_questions: subCopy });
                                  }}
                                  className="h-6 w-14 text-xs text-center"
                                />
                              </div>
                            </div>
                            <Input
                              value={sq.question || ''}
                              onChange={(e) => {
                                const subCopy = [...q.sub_questions];
                                subCopy[sIdx].question = e.target.value;
                                handleUpdateReviewQuestion(qIdx, { sub_questions: subCopy });
                              }}
                              className="h-8 text-xs font-medium"
                            />
                            {/* Options */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              {(sq.options || []).map((opt: string, oi: number) => (
                                <div key={oi} className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const subCopy = [...q.sub_questions];
                                      subCopy[sIdx].correct_answer = oi;
                                      handleUpdateReviewQuestion(qIdx, { sub_questions: subCopy });
                                    }}
                                    className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                      sq.correct_answer === oi
                                        ? 'bg-emerald-500 text-white font-bold'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + oi)}
                                  </button>
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const subCopy = [...q.sub_questions];
                                      subCopy[sIdx].options[oi] = e.target.value;
                                      handleUpdateReviewQuestion(qIdx, { sub_questions: subCopy });
                                    }}
                                    className="h-7 text-xs"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Standard Question Card
                return (
                  <div
                    key={q.id || qIdx}
                    className="rounded-xl border bg-card p-4 space-y-3 shadow-xs hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-bold text-primary">
                          Câu {qIdx + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {q.skill || 'vocab'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">Điểm:</span>
                        <Input
                          type="number"
                          value={q.points || 2}
                          onChange={(e) =>
                            handleUpdateReviewQuestion(qIdx, { points: Number(e.target.value) })
                          }
                          className="h-6 w-14 text-xs text-center"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReviewQuestion(qIdx)}
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Question text */}
                    <Input
                      value={q.question || q.text || ''}
                      onChange={(e) =>
                        handleUpdateReviewQuestion(qIdx, { question: e.target.value, text: e.target.value })
                      }
                      className="h-8 text-xs font-medium"
                    />

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-2">
                      {(q.options || []).map((opt: string, oi: number) => (
                        <div key={oi} className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateReviewQuestion(qIdx, { correct_answer: oi })}
                            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                              q.correct_answer === oi
                                ? 'bg-emerald-500 text-white'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                            title="Bấm để chọn đáp án đúng"
                          >
                            {String.fromCharCode(65 + oi)}
                          </button>
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const optsCopy = [...q.options];
                              optsCopy[oi] = e.target.value;
                              handleUpdateReviewQuestion(qIdx, { options: optsCopy });
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div className="pt-1">
                      <Input
                        value={q.explanation || ''}
                        onChange={(e) =>
                          handleUpdateReviewQuestion(qIdx, { explanation: e.target.value })
                        }
                        placeholder="Giải thích chi tiết (Tiếng Việt)..."
                        className="h-7 text-[11px] text-muted-foreground bg-muted/30"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Finalize Button */}
            <div className="pt-3 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveView('generate')}
                className="text-xs h-9 px-4"
              >
                Quay lại
              </Button>
              <Button
                size="sm"
                onClick={handleSaveReviewedExams}
                disabled={isSavingDraft}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-6 gap-2 shadow-md"
              >
                <Check className="w-4 h-4" />
                {isSavingDraft ? 'Đang lưu vào kho...' : 'Xác Nhận & Nạp Vào Kho Đề Ngay'}
              </Button>
            </div>
          </div>
        )}

        {/* VIEW 3: TRAINING DOCUMENTS KNOWLEDGE HUB */}
        {activeView === 'training' && (
          <div className="p-6 space-y-5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Kho Tài Liệu Huấn Luyện & Mẫu Đề Tham Chiếu
                </h4>
                <p className="text-xs text-muted-foreground">
                  AI sẽ đọc các tài liệu này làm căn cứ chính xác để tạo đề thi, đoạn văn đọc hiểu và câu hỏi chuẩn JLPT.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddingDoc(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Tài Liệu Mới
              </Button>
            </div>

            {/* Add Document Form */}
            {isAddingDoc && (
              <div className="p-4 rounded-xl border border-purple-400/40 bg-purple-500/5 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Tải lên hoặc dán tài liệu mẫu / đề thi tham chiếu
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingDoc(false)}
                    className="h-6 text-xs text-muted-foreground"
                  >
                    Hủy
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Tiêu đề tài liệu (VD: Đề thi thật JLPT N4 tháng 7/2024, Ngân hàng ngữ pháp N3...)"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <Select value={newDocLevel} onValueChange={setNewDocLevel}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Cấp độ áp dụng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả cấp độ</SelectItem>
                        <SelectItem value="N5">Áp dụng N5</SelectItem>
                        <SelectItem value="N4">Áp dụng N4</SelectItem>
                        <SelectItem value="N3">Áp dụng N3</SelectItem>
                        <SelectItem value="N2">Áp dụng N2</SelectItem>
                        <SelectItem value="N1">Áp dụng N1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* File Upload Trigger */}
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer font-semibold text-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Chọn file từ máy (TXT, JSON, DOCX...)
                    <input
                      type="file"
                      accept=".txt,.json,.doc,.docx,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-muted-foreground">hoặc dán trực tiếp nội dung đề thi vào bên dưới:</span>
                </div>

                <Textarea
                  placeholder="Dán nội dung bài đọc mẫu, các câu hỏi mẫu, đáp án, hoặc ma trận kiến thức vào đây..."
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  rows={6}
                  className="text-xs leading-relaxed"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleSaveNewDoc}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-4 font-bold"
                  >
                    Lưu Vào Kho Huấn Luyện
                  </Button>
                </div>
              </div>
            )}

            {/* Documents List */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {trainingDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-xs hover:border-purple-300 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-none text-[10px] font-bold">
                        {doc.level}
                      </Badge>
                      <span className="text-xs font-bold text-foreground">{doc.title}</span>
                      {doc.source_type === 'preset' && (
                        <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-600">
                          Chuẩn Quốc Tế
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-mono">
                      {doc.content}
                    </p>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-3 pt-0.5">
                      <span>Nguồn: {doc.author_name || 'Giảng viên'}</span>
                      <span>Dung lượng: ~{Math.round(doc.content.length / 5)} từ</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant={doc.is_active ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleDoc(doc.id)}
                      className={`text-xs h-7 px-2.5 rounded-lg ${
                        doc.is_active
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'text-muted-foreground'
                      }`}
                      title="Bật/tắt sử dụng tài liệu này khi AI sinh đề"
                    >
                      {doc.is_active ? 'Đang dùng' : 'Tạm tắt'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t flex justify-end">
              <Button
                size="sm"
                onClick={() => setActiveView('generate')}
                className="bg-primary text-xs h-9 px-6 font-semibold"
              >
                Quay Lại Tạo Đề Thi &rarr;
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

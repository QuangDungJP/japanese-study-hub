import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Trophy,
  FileText,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Globe,
  ExternalLink,
  Clock,
  CheckCircle2,
  Eye,
  Copy,
  Search,
  Filter,
  AlertTriangle,
  BookOpen,
  Layers,
  MoreVertical,
  RefreshCw,
  SlidersHorizontal,
  Send,
  Database,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageLoadingScreen from '@/components/shared/PageLoadingScreen';
import AdminExamEditor from '@/components/admin/AdminExamEditor';
import { useNavigate } from 'react-router-dom';
import { AdminScoringConfigModal } from '@/components/admin/AdminScoringConfigModal';
import { AdminExamPoolsModal } from '@/components/admin/AdminExamPoolsModal';
import { AdminAIExamGeneratorModal } from '@/components/admin/AdminAIExamGeneratorModal';
import {
  getExamPools,
  getExamPoolId,
  assignExamToPool,
  ExamPool,
} from '@/lib/examPoolService';

const LEVEL_DEFAULTS: Record<string, { duration: number; maxScore: number; passingScore: number; color: string; badgeColor: string }> = {
  N1: { duration: 165, maxScore: 180, passingScore: 100, color: 'border-rose-500/30 text-rose-600 bg-rose-500/10', badgeColor: 'bg-rose-500 text-white' },
  N2: { duration: 155, maxScore: 180, passingScore: 90, color: 'border-purple-500/30 text-purple-600 bg-purple-500/10', badgeColor: 'bg-purple-600 text-white' },
  N3: { duration: 140, maxScore: 180, passingScore: 95, color: 'border-blue-500/30 text-blue-600 bg-blue-500/10', badgeColor: 'bg-blue-600 text-white' },
  N4: { duration: 115, maxScore: 180, passingScore: 90, color: 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10', badgeColor: 'bg-emerald-600 text-white' },
  N5: { duration: 105, maxScore: 180, passingScore: 80, color: 'border-amber-500/30 text-amber-600 bg-amber-500/10', badgeColor: 'bg-amber-500 text-white' },
};

export default function AdminMockExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPoolFilter, setSelectedPoolFilter] = useState<string>('all');

  // Scoring, Pools & AI Generator Modals state
  const [scoringModalOpen, setScoringModalOpen] = useState(false);
  const [poolsModalOpen, setPoolsModalOpen] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [aiGeneratorPoolId, setAiGeneratorPoolId] = useState('pool-1');
  const [pools, setPools] = useState<ExamPool[]>(getExamPools());

  // Modal Dialogs state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title_vi: '',
    level: 'N4',
    duration_minutes: 115,
    max_score: 180,
    passing_score: 90,
    is_published: false,
  });

  const [externalModalOpen, setExternalModalOpen] = useState(false);
  const [externalForm, setExternalForm] = useState({
    title_vi: '',
    level: 'N4',
    url: '',
    is_published: true,
  });

  const [deleteConfirmExam, setDeleteConfirmExam] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('exam_type', 'jlpt_mock')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExams(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Update default stats when level changes in Create Modal
  const handleLevelChange = (lvl: string) => {
    const config = LEVEL_DEFAULTS[lvl] || LEVEL_DEFAULTS.N4;
    setCreateForm(prev => ({
      ...prev,
      level: lvl,
      duration_minutes: config.duration,
      max_score: config.maxScore,
      passing_score: config.passingScore,
    }));
  };

  // Submit Create New JLPT Exam
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title_vi.trim()) {
      toast({ title: 'Vui lòng nhập tên đề thi', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.from('exams').insert({
        title_vi: createForm.title_vi.trim(),
        title: createForm.title_vi.trim(),
        exam_type: 'jlpt_mock',
        exam_category: createForm.level,
        is_published: createForm.is_published,
        duration_minutes: Number(createForm.duration_minutes) || 120,
        max_score: Number(createForm.max_score) || 180,
        passing_score: Number(createForm.passing_score) || 90,
        questions: [],
      }).select().single();

      if (error) throw error;
      toast({ title: 'Tạo đề thi thành công', description: 'Mở trình soạn thảo để nhập câu hỏi.' });
      setCreateModalOpen(false);
      setCreateForm({
        title_vi: '',
        level: 'N4',
        duration_minutes: 115,
        max_score: 180,
        passing_score: 90,
        is_published: false,
      });
      await fetchExams();
      if (data) {
        setEditingExam(data);
      }
    } catch (err: any) {
      toast({ title: 'Lỗi tạo đề thi', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // Submit Create External Link Exam
  const handleExternalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalForm.title_vi.trim() || !externalForm.url.trim()) {
      toast({ title: 'Vui lòng nhập đầy đủ tên đề thi và đường dẫn URL', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from('exams').insert({
        title_vi: externalForm.title_vi.trim(),
        title: externalForm.title_vi.trim(),
        exam_type: 'jlpt_mock',
        exam_category: externalForm.level,
        is_published: externalForm.is_published,
        duration_minutes: 0,
        max_score: 0,
        passing_score: 0,
        questions: [{ type: 'external_link', url: externalForm.url.trim() }],
      });

      if (error) throw error;
      toast({ title: 'Đã thêm đề thi link ngoài' });
      setExternalModalOpen(false);
      setExternalForm({ title_vi: '', level: 'N4', url: '', is_published: true });
      fetchExams();
    } catch (err: any) {
      toast({ title: 'Lỗi tạo đề', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // Toggle publish status
  const handleTogglePublish = async (exam: any) => {
    const nextStatus = !exam.is_published;
    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_published: nextStatus })
        .eq('id', exam.id);

      if (error) throw error;
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, is_published: nextStatus } : e));
      toast({
        title: nextStatus ? 'Đã xuất bản đề thi' : 'Đã chuyển thành bản nháp',
        description: nextStatus ? 'Học viên có thể nhìn thấy và thi ngay trong Phòng thi ảo.' : 'Đề thi đã ẩn khỏi phòng thi học viên.',
      });
    } catch (err: any) {
      toast({ title: 'Lỗi cập nhật trạng thái', description: err.message, variant: 'destructive' });
    }
  };

  // Clone Exam
  const handleCloneExam = async (exam: any) => {
    try {
      const { error } = await supabase.from('exams').insert({
        title_vi: `${exam.title_vi} (Bản sao)`,
        title: `${exam.title || exam.title_vi} (Copy)`,
        exam_type: 'jlpt_mock',
        exam_category: exam.exam_category || exam.level || 'N4',
        is_published: false,
        duration_minutes: exam.duration_minutes || 120,
        max_score: exam.max_score || 180,
        passing_score: exam.passing_score || 90,
        questions: exam.questions || [],
      });

      if (error) throw error;
      toast({ title: 'Đã nhân bản đề thi', description: 'Bản sao mới được lưu ở trạng thái Bản nháp.' });
      fetchExams();
    } catch (err: any) {
      toast({ title: 'Lỗi nhân bản đề thi', description: err.message, variant: 'destructive' });
    }
  };

  // Delete Exam
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmExam) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('exams').delete().eq('id', deleteConfirmExam.id);
      if (error) throw error;
      toast({ title: 'Đã xóa đề thi vĩnh viễn' });
      setDeleteConfirmExam(null);
      fetchExams();
    } catch (e: any) {
      toast({ title: 'Lỗi xóa đề thi', description: e.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // Seed sample exam
  const handleSeedExam = async () => {
    setLoading(true);
    try {
      const sampleQuestions = [
        {
          id: crypto.randomUUID(), type: 'multiple_choice', skill: 'vocabulary', text: 'Chữ Hán 食べる đọc là gì?',
          options: ['たべる', 'のむ', 'いく', 'くる'], correct_index: 0, points: 5,
        },
        {
          id: crypto.randomUUID(), type: 'multiple_choice', skill: 'vocabulary', text: "Từ nào có nghĩa là 'Trường học'?",
          options: ['がっこう', 'としょかん', 'びょういん', 'えき'], correct_index: 0, points: 5,
        },
        {
          id: crypto.randomUUID(), type: 'multiple_choice', skill: 'reading', text: 'Đọc đoạn văn: わたしは 毎朝 ６時に おきます。あさごはんを たべてから がっこうへ いきます。... (Câu hỏi: Người này dậy lúc mấy giờ?)',
          options: ['5 giờ sáng', '6 giờ sáng', '7 giờ sáng', '8 giờ sáng'], correct_index: 1, points: 10,
        },
        {
          id: crypto.randomUUID(), type: 'multiple_choice', skill: 'listening', text: 'Nghe đoạn hội thoại mẫu và chọn đáp án chính xác nhất:',
          audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          options: ['Đáp án A: Đồng ý đi xem phim', 'Đáp án B: Từ chối vì bận làm bài', 'Đáp án C: Hẹn gặp vào chủ nhật', 'Đáp án D: Đang ở thư viện'], correct_index: 2, points: 10,
        },
        {
          id: crypto.randomUUID(), type: 'audio_record', skill: 'kaiwa', text: '[Phần thi Nói] Hãy giới thiệu ngắn gọn về sở thích và mục tiêu học tiếng Nhật của bạn trong 60 giây.',
          points: 10,
        },
      ];

      const { error } = await supabase.from('exams').insert({
        title_vi: `Đề Thi Thử Mẫu JLPT N4 Chuẩn Quốc Tế (${new Date().toLocaleDateString('vi-VN')})`,
        title: 'JLPT N4 Mock Test Standard',
        exam_type: 'jlpt_mock',
        exam_category: 'N4',
        is_published: true,
        duration_minutes: 115,
        max_score: 180,
        passing_score: 90,
        questions: sampleQuestions,
      });

      if (error) throw error;
      toast({ title: 'Đã tạo đề thi mẫu N4', description: 'Đề mẫu đã sẵn sàng để học viên trải nghiệm trong phòng thi ảo.' });
      fetchExams();
    } catch (err: any) {
      toast({ title: 'Lỗi tạo đề mẫu', description: err.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const total = exams.length;
    const published = exams.filter(e => e.is_published).length;
    const draft = total - published;
    const external = exams.filter(e => e.questions?.[0]?.type === 'external_link').length;
    const internal = total - external;
    return { total, published, draft, external, internal };
  }, [exams]);

  // Filtered List
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const title = (exam.title_vi || exam.title || '').toLowerCase();
      const matchesSearch = !searchQuery.trim() || title.includes(searchQuery.trim().toLowerCase());

      const lvl = (exam.exam_category || exam.level || '').toUpperCase();
      const matchesLevel = selectedLevel === 'all' || lvl === selectedLevel.toUpperCase();

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'published' && exam.is_published) ||
        (selectedStatus === 'draft' && !exam.is_published);

      const isExternal = exam.questions?.[0]?.type === 'external_link';
      const matchesType =
        selectedType === 'all' ||
        (selectedType === 'internal' && !isExternal) ||
        (selectedType === 'external' && isExternal);

      const examPoolId = getExamPoolId(exam);
      const matchesPool =
        selectedPoolFilter === 'all' || examPoolId === selectedPoolFilter;

      return matchesSearch && matchesLevel && matchesStatus && matchesType && matchesPool;
    });
  }, [exams, searchQuery, selectedLevel, selectedStatus, selectedType, selectedPoolFilter]);

  if (loading) return <PageLoadingScreen text="Đang tải danh sách đề thi thử JLPT..." />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full max-w-full overflow-x-hidden">
      {/* Hero Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-rose-950 via-purple-950 to-slate-900 border border-white/10 p-6 sm:p-8 shadow-2xl text-white overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-md border border-white/20 text-rose-200">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              Phòng Thi Ảo JLPT · Hệ Thống Khảo Thí Trực Tuyến
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Quản Lý Đề Thi Thử JLPT ⛩️
            </h1>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
              Thiết lập bộ đề thi thử chuẩn cấu trúc đề thi JLPT N5 đến N1. Cấu hình thang điểm và điểm liệt quốc tế, AI tự sinh trọn bộ đề thi theo từng Kho Đề để chống trùng đề cho học viên.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            <Button
              onClick={() => {
                setAiGeneratorPoolId('pool-1');
                setAiGeneratorOpen(true);
              }}
              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold gap-2 rounded-xl shadow-lg shadow-purple-950/40 w-full sm:w-auto h-11"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" /> AI Tạo Đề Thi
            </Button>
            <Button
              onClick={() => setScoringModalOpen(true)}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold gap-2 rounded-xl backdrop-blur-md w-full sm:w-auto h-11"
            >
              <Settings className="w-4 h-4 text-amber-300" /> Thang Điểm JLPT
            </Button>
            <Button
              onClick={() => setPoolsModalOpen(true)}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold gap-2 rounded-xl backdrop-blur-md w-full sm:w-auto h-11"
            >
              <Layers className="w-4 h-4 text-purple-300" /> Quản Lý Kho Đề
            </Button>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold gap-2 rounded-xl shadow-lg shadow-rose-950/40 w-full sm:w-auto h-11"
            >
              <Plus className="w-4 h-4" /> Tạo Đề Mới
            </Button>
            <Button
              onClick={() => setExternalModalOpen(true)}
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10 font-medium gap-1.5 rounded-xl w-full sm:w-auto h-11 text-xs"
            >
              <Globe className="w-3.5 h-3.5 text-blue-300" /> Link Ngoài
            </Button>
            <Button
              onClick={handleSeedExam}
              variant="ghost"
              className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 font-medium gap-1.5 rounded-xl w-full sm:w-auto h-11 text-xs border border-emerald-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Đề Mẫu N4
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng số đề thi</p>
              <p className="text-2xl sm:text-3xl font-black text-foreground mt-0.5">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đã xuất bản</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-0.5">{stats.published}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bản nháp</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-0.5">{stats.draft}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Link ngoài</p>
              <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-0.5">{stats.external}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="rounded-2xl border shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm kiếm theo tên đề thi, mã đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              {/* Pool Filter */}
              <Select value={selectedPoolFilter} onValueChange={setSelectedPoolFilter}>
                <SelectTrigger className="w-full sm:w-[175px] h-11 rounded-xl text-xs font-semibold">
                  <Database className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
                  <SelectValue placeholder="Kho đề" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả kho đề</SelectItem>
                  {pools.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[155px] h-11 rounded-xl text-xs font-semibold">
                  <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="published">✓ Đã xuất bản</SelectItem>
                  <SelectItem value="draft">⏳ Bản nháp</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-[165px] h-11 rounded-xl text-xs font-semibold">
                  <Layers className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Loại đề thi" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả loại đề</SelectItem>
                  <SelectItem value="internal">⚡ Đề tương tác hệ thống</SelectItem>
                  <SelectItem value="external">🌐 Link ngoài (Azota/Google)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={fetchExams}
                className="h-11 w-11 rounded-xl shrink-0"
                title="Tải lại danh sách"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Level Pills Strip */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <span className="text-xs font-bold text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Cấp độ:
            </span>
            {['all', 'N1', 'N2', 'N3', 'N4', 'N5'].map((lvl) => {
              const active = selectedLevel === lvl;
              const count = lvl === 'all'
                ? exams.length
                : exams.filter(e => (e.exam_category || e.level || '').toUpperCase() === lvl).length;

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 flex items-center gap-1.5 border ${
                    active
                      ? 'bg-foreground text-background border-foreground shadow-sm'
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground border-transparent'
                  }`}
                >
                  {lvl === 'all' ? 'Tất cả' : lvl}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    active ? 'bg-background/20 text-background' : 'bg-background text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 bg-card/50">
          <CardContent className="py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <FileText className="w-8 h-8 opacity-40" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-foreground">Không tìm thấy đề thi thử nào</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Không có đề thi nào phù hợp với bộ lọc tìm kiếm hiện tại. Hãy thử chọn cấp độ khác hoặc tạo mới.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLevel('all');
                  setSelectedStatus('all');
                  setSelectedType('all');
                }}
                className="rounded-xl"
              >
                Xóa bộ lọc
              </Button>
              <Button
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="rounded-xl bg-primary text-primary-foreground font-bold gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tạo đề thi ngay
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredExams.map((exam) => {
            const isExternal = exam.questions?.[0]?.type === 'external_link';
            const externalUrl = isExternal ? exam.questions[0]?.url : null;
            const lvl = (exam.exam_category || exam.level || 'N4').toUpperCase();
            const levelConfig = LEVEL_DEFAULTS[lvl] || LEVEL_DEFAULTS.N4;
            const questionCount = Array.isArray(exam.questions) ? exam.questions.filter((q: any) => q.type !== 'system_config').length : 0;
            const examPoolId = getExamPoolId(exam);
            const currentPool = pools.find((p) => p.id === examPoolId) || pools[0];

            return (
              <Card
                key={exam.id}
                className="rounded-2xl border bg-card hover:border-primary/40 hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header & Badge Strip */}
                <div className="p-5 pb-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${levelConfig.color}`}>
                        {lvl}
                      </span>
                      {currentPool && (
                        <Badge variant="outline" className="text-[10px] font-medium bg-muted/60 text-muted-foreground border-border/80 gap-1 py-0.5">
                          <Database className="w-2.5 h-2.5 text-purple-500" />
                          {currentPool.name.split('(')[0].trim()}
                        </Badge>
                      )}
                      {isExternal ? (
                        <Badge variant="outline" className="text-[11px] font-semibold text-blue-600 bg-blue-500/10 border-blue-200 gap-1">
                          <Globe className="w-3 h-3" /> Link ngoài
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] font-semibold text-purple-600 bg-purple-500/10 border-purple-200 gap-1">
                          <Sparkles className="w-3 h-3" /> Phòng thi ảo
                        </Badge>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePublish(exam)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        exam.is_published
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-300/60 hover:bg-emerald-500/25'
                          : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                      }`}
                      title="Nhấn để Bật / Tắt trạng thái xuất bản"
                    >
                      <span className={`w-2 h-2 rounded-full ${exam.is_published ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
                      {exam.is_published ? 'Đã xuất bản' : 'Bản nháp'}
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {exam.title_vi || exam.title}
                    </h3>
                  </div>

                  {/* Metrics Strip */}
                  <div className="pt-1 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground">
                    {!isExternal ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{exam.duration_minutes || 0} phút</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-primary" />
                          <span>Chuẩn: <strong>{exam.passing_score || 90}</strong>/{exam.max_score || 180} đ</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          <span>{questionCount} câu hỏi</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-blue-600 font-medium truncate max-w-full">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{externalUrl || 'Liên kết ngoài'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-3 border-t bg-muted/20 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2 flex-1">
                    {isExternal ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(externalUrl, '_blank')}
                        className="flex-1 rounded-xl font-bold text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 h-9"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Mở Link Thi
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setEditingExam(exam)}
                          className="flex-1 rounded-xl font-bold text-xs gap-1.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                        >
                          <Settings className="w-3.5 h-3.5" /> Cấu hình đề
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/learn/mock-exams/${exam.id}`)}
                          className="rounded-xl font-bold text-xs gap-1 h-9 px-2.5"
                          title="Thi thử thử nghiệm như học viên"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl shrink-0">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-xl">
                      {!isExternal && (
                        <DropdownMenuItem onClick={() => navigate(`/learn/mock-exams/${exam.id}`)} className="gap-2 cursor-pointer font-medium text-xs">
                          <Eye className="w-4 h-4 text-primary" /> Xem giao diện học viên
                        </DropdownMenuItem>
                      )}
                      {!isExternal && (
                        <DropdownMenuItem onClick={() => setEditingExam(exam)} className="gap-2 cursor-pointer font-medium text-xs">
                          <Settings className="w-4 h-4 text-muted-foreground" /> Soạn câu hỏi & thang điểm
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleTogglePublish(exam)} className="gap-2 cursor-pointer font-medium text-xs">
                        <Send className="w-4 h-4 text-emerald-600" />
                        {exam.is_published ? 'Chuyển sang Bản nháp' : 'Xuất bản công khai'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCloneExam(exam)} className="gap-2 cursor-pointer font-medium text-xs">
                        <Copy className="w-4 h-4 text-blue-600" /> Nhân bản đề thi này
                      </DropdownMenuItem>

                      {/* Move to Pool submenu */}
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Phân vào Kho đề
                      </div>
                      {pools.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={async () => {
                            const ok = await assignExamToPool(exam.id, p.id, p.name);
                            if (ok) {
                              toast({ title: `Đã đưa vào ${p.name}` });
                              fetchExams();
                            }
                          }}
                          className={`text-xs gap-2 cursor-pointer ${
                            examPoolId === p.id ? 'font-bold text-purple-600 bg-purple-500/10' : ''
                          }`}
                        >
                          <Database className="w-3.5 h-3.5 text-purple-500" />
                          <span className="truncate">{p.name.split('(')[0].trim()}</span>
                          {examPoolId === p.id && (
                            <span className="ml-auto text-xs font-black text-purple-600">✓</span>
                          )}
                        </DropdownMenuItem>
                      ))}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteConfirmExam(exam)}
                        className="gap-2 cursor-pointer font-medium text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" /> Xóa vĩnh viễn đề thi
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* DIALOG: CREATE NEW EXAM */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-rose-600" /> Tạo Đề Thi Thử JLPT Mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cấu hình thông tin cơ bản cho bộ đề thi. Sau khi tạo, bạn có thể tự soạn câu hỏi hoặc sử dụng trợ lý AI để tạo nhanh.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Tên đề thi (Tiếng Việt) <span className="text-rose-500">*</span></Label>
              <Input
                placeholder="VD: Đề thi thử JLPT N4 - Đợt 1 Năm 2025"
                value={createForm.title_vi}
                onChange={(e) => setCreateForm({ ...createForm, title_vi: e.target.value })}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Cấp độ JLPT</Label>
                <Select value={createForm.level} onValueChange={handleLevelChange}>
                  <SelectTrigger className="h-10 rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="N5">JLPT N5 (Sơ cấp 1)</SelectItem>
                    <SelectItem value="N4">JLPT N4 (Sơ cấp 2)</SelectItem>
                    <SelectItem value="N3">JLPT N3 (Trung cấp 1)</SelectItem>
                    <SelectItem value="N2">JLPT N2 (Trung cấp 2)</SelectItem>
                    <SelectItem value="N1">JLPT N1 (Cao cấp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Thời gian thi (phút)</Label>
                <Input
                  type="number"
                  min="10"
                  max="300"
                  value={createForm.duration_minutes}
                  onChange={(e) => setCreateForm({ ...createForm, duration_minutes: Number(e.target.value) })}
                  className="h-10 rounded-xl font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Điểm tối đa</Label>
                <Input
                  type="number"
                  value={createForm.max_score}
                  onChange={(e) => setCreateForm({ ...createForm, max_score: Number(e.target.value) })}
                  className="h-10 rounded-xl font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Điểm đỗ chuẩn</Label>
                <Input
                  type="number"
                  value={createForm.passing_score}
                  onChange={(e) => setCreateForm({ ...createForm, passing_score: Number(e.target.value) })}
                  className="h-10 rounded-xl font-semibold"
                />
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Xuất bản ngay</p>
                <p className="text-[11px] text-muted-foreground">Hiển thị đề thi trong phòng thi của học viên ngay sau khi tạo</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateForm({ ...createForm, is_published: !createForm.is_published })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  createForm.is_published ? 'bg-primary justify-end' : 'bg-muted justify-start'
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md transition-transform" />
              </button>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button type="submit" disabled={creating} className="rounded-xl font-bold bg-primary text-primary-foreground gap-2">
                {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Tạo Đề Thi & Soạn Câu Hỏi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CREATE EXTERNAL LINK EXAM */}
      <Dialog open={externalModalOpen} onOpenChange={setExternalModalOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" /> Thêm Đề Thi Link Ngoài
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thêm đề thi trắc nghiệm được tạo trên Google Forms, Azota, Quizizz để học viên truy cập tập trung tại một nơi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExternalSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Tên đề thi <span className="text-rose-500">*</span></Label>
              <Input
                placeholder="VD: Đề thi thử JLPT N3 - Bài kiểm tra Azota T12"
                value={externalForm.title_vi}
                onChange={(e) => setExternalForm({ ...externalForm, title_vi: e.target.value })}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Cấp độ JLPT</Label>
              <Select value={externalForm.level} onValueChange={(lvl) => setExternalForm({ ...externalForm, level: lvl })}>
                <SelectTrigger className="h-10 rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="N5">JLPT N5</SelectItem>
                  <SelectItem value="N4">JLPT N4</SelectItem>
                  <SelectItem value="N3">JLPT N3</SelectItem>
                  <SelectItem value="N2">JLPT N2</SelectItem>
                  <SelectItem value="N1">JLPT N1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Đường dẫn URL bài thi (Google Form, Azota, v.v.) <span className="text-rose-500">*</span></Label>
              <Input
                type="url"
                placeholder="https://azota.vn/... hoặc https://forms.gle/..."
                value={externalForm.url}
                onChange={(e) => setExternalForm({ ...externalForm, url: e.target.value })}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setExternalModalOpen(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button type="submit" disabled={creating} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                Lưu Đề Thi Link Ngoài
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CONFIRM DELETE */}
      <Dialog open={!!deleteConfirmExam} onOpenChange={(open) => !open && setDeleteConfirmExam(null)}>
        <DialogContent className="max-w-md rounded-2xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 text-rose-600" /> Xác Nhận Xóa Đề Thi
            </DialogTitle>
            <DialogDescription className="text-xs">
              Hành động này không thể hoàn tác. Toàn bộ câu hỏi và lượt nộp bài của học viên cho đề thi này sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>

          {deleteConfirmExam && (
            <div className="p-3.5 rounded-xl bg-muted/60 border text-xs space-y-1 mt-2">
              <p className="font-bold text-foreground">{deleteConfirmExam.title_vi || deleteConfirmExam.title}</p>
              <p className="text-muted-foreground">Cấp độ: <strong>{deleteConfirmExam.exam_category || deleteConfirmExam.level}</strong></p>
            </div>
          )}

          <DialogFooter className="pt-4 gap-2">
            <Button type="button" variant="ghost" onClick={() => setDeleteConfirmExam(null)} className="rounded-xl">
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleDeleteConfirm}
              className="rounded-xl font-bold gap-2"
            >
              {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Xóa Vĩnh Viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FULL EXAM QUESTION EDITOR */}
      {editingExam && (
        <AdminExamEditor
          exam={editingExam}
          onClose={() => setEditingExam(null)}
          onSaved={() => {
            setEditingExam(null);
            fetchExams();
          }}
        />
      )}

      {/* MODAL: JLPT SCORING CONFIG */}
      <AdminScoringConfigModal
        open={scoringModalOpen}
        onOpenChange={setScoringModalOpen}
        onApplied={() => fetchExams()}
      />

      {/* MODAL: EXAM POOLS */}
      <AdminExamPoolsModal
        open={poolsModalOpen}
        onOpenChange={setPoolsModalOpen}
        exams={exams}
        onPoolsUpdated={() => {
          setPools(getExamPools());
          fetchExams();
        }}
        onOpenAIGenerator={(poolId) => {
          setAiGeneratorPoolId(poolId);
          setAiGeneratorOpen(true);
        }}
      />

      {/* MODAL: AI EXAM GENERATOR */}
      <AdminAIExamGeneratorModal
        open={aiGeneratorOpen}
        onOpenChange={setAiGeneratorOpen}
        defaultPoolId={aiGeneratorPoolId}
        onExamCreated={() => fetchExams()}
      />
    </div>
  );
}

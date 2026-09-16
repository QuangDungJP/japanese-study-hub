import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  SlidersHorizontal,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  Info,
  Clock,
  Trophy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getScoringRules,
  saveScoringRules,
  DEFAULT_JLPT_SCORING_RULES,
  JLPTLevelScoringRule,
} from '@/lib/examPoolService';
import { supabase } from '@/integrations/supabase/client';

interface AdminScoringConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied?: () => void;
}

export function AdminScoringConfigModal({
  open,
  onOpenChange,
  onApplied,
}: AdminScoringConfigModalProps) {
  const [rules, setRules] = useState<Record<string, JLPTLevelScoringRule>>(getScoringRules());
  const [activeTab, setActiveTab] = useState<string>('N4');
  const [saving, setSaving] = useState(false);
  const [batchApplying, setBatchApplying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setRules(getScoringRules());
    }
  }, [open]);

  const currentRule = rules[activeTab] || DEFAULT_JLPT_SCORING_RULES[activeTab] || DEFAULT_JLPT_SCORING_RULES.N4;

  const updateCurrentRule = (updates: Partial<JLPTLevelScoringRule>) => {
    setRules((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        ...updates,
      },
    }));
  };

  const updateCurrentSectionPass = (field: string, value: number) => {
    setRules((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        sectionPass: {
          ...prev[activeTab].sectionPass,
          [field]: value,
        },
      },
    }));
  };

  // Save to storage
  const handleSave = () => {
    saveScoringRules(rules);
    toast({
      title: 'Đã lưu cấu hình thang điểm',
      description: 'Quy tắc tính điểm chuẩn JLPT mới đã được lưu thành công.',
    });
    onApplied?.();
    onOpenChange(false);
  };

  // Reset to default
  const handleReset = () => {
    setRules(DEFAULT_JLPT_SCORING_RULES);
    saveScoringRules(DEFAULT_JLPT_SCORING_RULES);
    toast({
      title: 'Đã khôi phục chuẩn quốc tế',
      description: 'Toàn bộ điểm sàn và điểm liệt đã trở về cấu hình chuẩn của kỳ thi JLPT Nhật Bản.',
    });
  };

  // Batch apply to all exams in database for current level
  const handleBatchApplyToDatabase = async () => {
    setBatchApplying(true);
    try {
      // 1. Save local rule
      saveScoringRules(rules);

      // 2. Fetch all exams matching level
      const { data: exams, error } = await supabase
        .from('exams')
        .select('id, questions')
        .eq('exam_type', 'jlpt_mock')
        .eq('exam_category', activeTab);

      if (error) throw error;

      if (!exams || exams.length === 0) {
        toast({
          title: `Chưa có đề thi ${activeTab}`,
          description: `Đã lưu quy tắc thang điểm cho cấp độ ${activeTab}.`,
        });
        setBatchApplying(false);
        return;
      }

      // 3. Update each exam
      for (const exam of exams) {
        const existingQs = Array.isArray(exam.questions) ? exam.questions : [];
        const filteredQs = existingQs.filter((q: any) => q.type !== 'system_config');
        const systemConfigQ = {
          id: 'scoring_rules_config',
          type: 'system_config',
          config: {
            difficulty_factor: currentRule.difficultyFactor,
            section_pass: currentRule.sectionPass,
          },
        };

        await supabase
          .from('exams')
          .update({
            passing_score: currentRule.passingTotal,
            duration_minutes: currentRule.durationMinutes,
            questions: [...filteredQs, systemConfigQ],
          })
          .eq('id', exam.id);
      }

      toast({
        title: `Áp dụng thành công cho ${exams.length} đề thi ${activeTab}`,
        description: 'Tất cả các đề thi trong kho đã được đồng bộ điểm đỗ, điểm liệt và thời gian thi mới.',
      });
      onApplied?.();
    } catch (err: any) {
      toast({
        title: 'Lỗi đồng bộ đề thi',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setBatchApplying(false);
    }
  };

  const isN4N5 = activeTab === 'N4' || activeTab === 'N5';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto w-[95vw] sm:w-full rounded-3xl p-0">
        {/* Header with gradient */}
        <div className="p-6 pb-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-t-3xl relative overflow-hidden border-b border-white/10">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <DialogHeader className="relative z-10 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-md border border-white/20 text-purple-200 mb-2 w-fit">
              <SlidersHorizontal className="w-3.5 h-3.5 text-yellow-300" />
              Cấu Hình Thang Điểm & Điểm Liệt JLPT
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-white">
              Quy Tắc Chấm Điểm Chuẩn Khảo Thí ⛩️
            </DialogTitle>
            <DialogDescription className="text-white/70 text-xs sm:text-sm">
              Thiết lập điểm đỗ tổng, điểm liệt từng phần thi và hệ số dự đoán điểm thi thật.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Level Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto no-scrollbar pb-1 w-full">
              <TabsList className="grid grid-cols-5 w-full bg-muted/60 p-1.5 rounded-2xl">
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => (
                  <TabsTrigger
                    key={lvl}
                    value={lvl}
                    className="font-black text-xs sm:text-sm rounded-xl py-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all"
                  >
                    {lvl}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          {/* Level Info Banner */}
          <div className="p-4 rounded-2xl bg-muted/50 border flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-foreground">Quy chuẩn kỳ thi JLPT {activeTab}:</p>
              <p className="text-muted-foreground leading-relaxed">{currentRule.notes}</p>
            </div>
          </div>

          {/* General Scoring Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl border bg-card space-y-1.5 shadow-2xs">
              <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-primary" /> Tổng điểm tối đa
              </Label>
              <Input
                type="number"
                value={currentRule.totalMax}
                onChange={(e) => updateCurrentRule({ totalMax: Number(e.target.value) || 180 })}
                className="h-10 rounded-xl font-black text-lg"
              />
              <p className="text-[11px] text-muted-foreground">Chuẩn quốc tế: 180 điểm</p>
            </div>

            <div className="p-4 rounded-2xl border bg-card space-y-1.5 shadow-2xs">
              <Label className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Điểm đỗ (Pass total)
              </Label>
              <Input
                type="number"
                value={currentRule.passingTotal}
                onChange={(e) => updateCurrentRule({ passingTotal: Number(e.target.value) || 90 })}
                className="h-10 rounded-xl font-black text-lg text-emerald-600"
              />
              <p className="text-[11px] text-muted-foreground">Mức đạt chuẩn: {DEFAULT_JLPT_SCORING_RULES[activeTab]?.passingTotal} điểm</p>
            </div>

            <div className="p-4 rounded-2xl border bg-card space-y-1.5 shadow-2xs">
              <Label className="text-xs font-bold text-amber-600 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Thời gian làm bài
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={currentRule.durationMinutes}
                  onChange={(e) => updateCurrentRule({ durationMinutes: Number(e.target.value) || 120 })}
                  className="h-10 rounded-xl font-black text-lg text-amber-600"
                />
                <span className="text-xs font-bold text-muted-foreground shrink-0">phút</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Mặc định: {DEFAULT_JLPT_SCORING_RULES[activeTab]?.durationMinutes} phút</p>
            </div>
          </div>

          {/* Section Passing Floors (Điểm Liệt) */}
          <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> Điểm sàn từng phần (Điểm liệt - Không được dưới)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nếu học viên đạt đủ tổng điểm đỗ nhưng có bất kỳ phần thi nào dưới điểm sàn, kết quả vẫn sẽ bị tính là <strong>TRƯỢT</strong>.
                </p>
              </div>
            </div>

            {isN4N5 ? (
              // N4 & N5: 2 Sections
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-3.5 rounded-xl border bg-muted/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground">1. Kiến thức NN & Đọc hiểu</span>
                    <Badge variant="outline" className="text-[11px] font-bold">Thang: 120đ</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground shrink-0">Điểm liệt:</Label>
                    <Input
                      type="number"
                      value={currentRule.sectionPass.combined ?? 38}
                      onChange={(e) => updateCurrentSectionPass('combined', Number(e.target.value) || 38)}
                      className="h-9 font-black text-rose-600 text-sm rounded-xl max-w-[120px]"
                    />
                    <span className="text-xs text-muted-foreground">/ 120 (Chuẩn: 38)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-muted/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground">2. Nghe hiểu (Choukai)</span>
                    <Badge variant="outline" className="text-[11px] font-bold">Thang: 60đ</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground shrink-0">Điểm liệt:</Label>
                    <Input
                      type="number"
                      value={currentRule.sectionPass.listening ?? 19}
                      onChange={(e) => updateCurrentSectionPass('listening', Number(e.target.value) || 19)}
                      className="h-9 font-black text-rose-600 text-sm rounded-xl max-w-[120px]"
                    />
                    <span className="text-xs text-muted-foreground">/ 60 (Chuẩn: 19)</span>
                  </div>
                </div>
              </div>
            ) : (
              // N1, N2, N3: 3 Sections
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground truncate">1. Kiến thức ngôn ngữ</span>
                    <Badge variant="outline" className="text-[10px] font-bold">60đ</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={currentRule.sectionPass.language ?? 19}
                      onChange={(e) => updateCurrentSectionPass('language', Number(e.target.value) || 19)}
                      className="h-9 font-black text-rose-600 text-sm rounded-xl"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">/ 60 (Sàn 19)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground truncate">2. Đọc hiểu (Dokkai)</span>
                    <Badge variant="outline" className="text-[10px] font-bold">60đ</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={currentRule.sectionPass.reading ?? 19}
                      onChange={(e) => updateCurrentSectionPass('reading', Number(e.target.value) || 19)}
                      className="h-9 font-black text-rose-600 text-sm rounded-xl"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">/ 60 (Sàn 19)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground truncate">3. Nghe hiểu (Choukai)</span>
                    <Badge variant="outline" className="text-[10px] font-bold">60đ</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={currentRule.sectionPass.listening ?? 19}
                      onChange={(e) => updateCurrentSectionPass('listening', Number(e.target.value) || 19)}
                      className="h-9 font-black text-rose-600 text-sm rounded-xl"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">/ 60 (Sàn 19)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Difficulty & Real Score Prediction Slider */}
          <div className="rounded-2xl border bg-card p-5 space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Hệ số độ khó (Dự đoán điểm thi thật)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Dùng để quy đổi điểm bài thi thử thành điểm dự đoán trong kỳ thi JLPT thật của học viên.
                </p>
              </div>
              <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-700 dark:text-amber-400 font-black text-sm shrink-0 w-fit">
                x{currentRule.difficultyFactor.toFixed(2)}
              </div>
            </div>

            <Slider
              value={[currentRule.difficultyFactor]}
              min={0.8}
              max={1.25}
              step={0.01}
              onValueChange={([val]) => updateCurrentRule({ difficultyFactor: val })}
              className="py-2"
            />
            <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
              <span className="text-rose-600">Đề Khó (&lt; 1.0)</span>
              <span>Chuẩn hóa (1.00)</span>
              <span className="text-emerald-600">Đề Dễ (&gt; 1.0)</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 sm:p-5 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs font-bold gap-1.5 rounded-xl w-full sm:w-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Khôi phục mặc định
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={batchApplying}
              onClick={handleBatchApplyToDatabase}
              className="text-xs font-bold gap-1.5 rounded-xl border border-primary/20 w-full sm:w-auto text-primary"
              title={`Áp dụng thang điểm này vào toàn bộ đề ${activeTab} hiện có`}
            >
              <Zap className={`w-3.5 h-3.5 ${batchApplying ? 'animate-spin' : ''}`} />
              Đồng bộ tất cả đề {activeTab}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="text-xs font-bold gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full sm:w-auto"
            >
              <Save className="w-3.5 h-3.5" /> Lưu cấu hình
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdminScoringConfigModal;

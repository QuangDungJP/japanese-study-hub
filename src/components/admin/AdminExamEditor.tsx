import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, GripVertical, Save, FileAudio, BookOpen, MessageCircle, Info, Cpu, Sparkles, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Slider } from '@/components/ui/slider';
import AIGeneratorModal from './AIGeneratorModal';

interface Question {
  id: string;
  type: string;
  skill: string;
  text: string;
  options?: string[];
  correct_index?: number;
  points?: number;
  audio_url?: string;
  image_url?: string;
  is_passage?: boolean;
  sub_questions?: Question[];
}

export default function AdminExamEditor({ exam, onClose, onSaved }: { exam: any, onClose: () => void, onSaved: () => void }) {
  const [editingExam, setEditingExam] = useState<any>(JSON.parse(JSON.stringify(exam)));
  const [saving, setSaving] = useState(false);
  const [aiModalSkill, setAiModalSkill] = useState<string | null>(null);
  
  // Extract or initialize scoring config
  const configQ = (editingExam.questions || []).find((q: any) => q.type === 'system_config');
  const [scoringConfig, setScoringConfig] = useState<any>(configQ?.config || {
    difficulty_factor: 1.05,
    section_pass: { language: 19, reading: 19, listening: 19, combined: 38 }
  });

  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const questionsWithoutConfig = (editingExam.questions || []).filter((q: any) => q.type !== 'system_config');
      const finalQuestions = [...questionsWithoutConfig, { id: 'scoring_rules_config', type: 'system_config', config: scoringConfig }];

      const { error } = await supabase
        .from('exams')
        .update({
          title_vi: editingExam.title_vi,
          exam_category: editingExam.exam_category || editingExam.level,
          duration_minutes: editingExam.duration_minutes,
          passing_score: editingExam.passing_score,
          is_published: editingExam.is_published,
          questions: finalQuestions,
          max_attempts: editingExam.max_attempts || 0
        })
        .eq('id', editingExam.id);
        
      if (error) throw error;
      toast({ title: "Lưu thành công" });
      onSaved();
    } catch (err: any) {
      toast({ title: "Lỗi lưu đề", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = (skill: string, isPassage: boolean = false) => {
    const newQ: Question = {
      id: crypto.randomUUID(),
      type: skill === 'kaiwa' ? 'audio_record' : 'multiple_choice',
      skill: skill,
      text: isPassage ? "Nội dung đoạn văn..." : "Nội dung câu hỏi mới...",
      points: 5,
      is_passage: isPassage,
      sub_questions: isPassage ? [] : undefined
    };
    if (skill !== 'kaiwa' && !isPassage) {
      newQ.options = ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"];
      newQ.correct_index = 0;
    }
    setEditingExam({ ...editingExam, questions: [...(editingExam.questions || []), newQ] });
  };

  const updateQuestion = (id: string, updates: any) => {
    setEditingExam({
      ...editingExam,
      questions: editingExam.questions.map((q: any) => q.id === id ? { ...q, ...updates } : q)
    });
  };

  const deleteQuestion = (id: string) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    setEditingExam({
      ...editingExam,
      questions: editingExam.questions.filter((q: any) => q.id !== id)
    });
  };

  const appendGeneratedQuestions = (newQuestions: Question[]) => {
    setEditingExam({
      ...editingExam,
      questions: [...(editingExam.questions || []), ...newQuestions]
    });
  };

  const questionsBySkill = (skill: string) => (editingExam.questions || []).filter((q: any) => q.skill === skill);

  const addSubQuestion = (qId: string) => {
    const parent = editingExam.questions.find((q: any) => q.id === qId);
    if (!parent) return;
    const newSub: Question = {
      id: crypto.randomUUID(),
      type: 'multiple_choice',
      skill: parent.skill,
      text: "Câu hỏi phụ...",
      options: ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"],
      correct_index: 0,
      points: 5
    };
    updateQuestion(qId, { sub_questions: [...(parent.sub_questions || []), newSub] });
  };

  const updateSubQuestion = (qId: string, subId: string, updates: any) => {
    const parent = editingExam.questions.find((q: any) => q.id === qId);
    if (!parent) return;
    const newSubs = (parent.sub_questions || []).map((sq: any) => sq.id === subId ? { ...sq, ...updates } : sq);
    updateQuestion(qId, { sub_questions: newSubs });
  };

  const deleteSubQuestion = (qId: string, subId: string) => {
    if (!confirm('Xóa câu hỏi phụ này?')) return;
    const parent = editingExam.questions.find((q: any) => q.id === qId);
    if (!parent) return;
    const newSubs = (parent.sub_questions || []).filter((sq: any) => sq.id !== subId);
    updateQuestion(qId, { sub_questions: newSubs });
  };

  const renderQuestionEditor = (q: any, idx: number) => {
    return (
      <Card key={q.id} className="mb-4 border-2">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-sm">Câu {idx + 1} {q.is_passage ? '(Đoạn văn)' : ''}</h4>
            <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4"/></Button>
          </div>
          
          <div className="space-y-2">
            <Label>{q.is_passage ? 'Nội dung đoạn văn' : 'Đề bài / Prompt'}</Label>
            <Textarea value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value })} rows={q.is_passage ? 6 : 3} />
          </div>

          <div className="space-y-2">
            <Label>Link Ảnh Minh Họa (Tùy chọn)</Label>
            <Input placeholder="https://..." value={q.image_url || ''} onChange={(e) => updateQuestion(q.id, { image_url: e.target.value })} />
            {q.image_url && (
              <div className="mt-2 relative inline-block">
                <img src={q.image_url} alt="preview" className="max-h-32 rounded-md border shadow-sm object-contain" />
              </div>
            )}
          </div>

          {q.skill === 'listening' && (
            <div className="space-y-2">
              <Label>Link Audio MP3</Label>
              <Input placeholder="https://..." value={q.audio_url || ''} onChange={(e) => updateQuestion(q.id, { audio_url: e.target.value })} />
            </div>
          )}

          {q.skill === 'kaiwa' ? (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Đây là câu hỏi Kaiwa (Giao tiếp). Học viên sẽ được yêu cầu ghi âm câu trả lời.</p>
            </div>
          ) : q.is_passage ? (
            <div className="space-y-4 mt-6 border-t pt-4">
              <div className="flex justify-between items-center">
                <h5 className="font-bold text-sm">Các câu hỏi phụ</h5>
                <Button size="sm" variant="outline" onClick={() => addSubQuestion(q.id)}><Plus className="w-4 h-4 mr-1"/> Thêm câu hỏi phụ</Button>
              </div>
              <div className="space-y-4">
                {(q.sub_questions || []).map((sq: any, sIdx: number) => (
                  <Card key={sq.id} className="border bg-slate-50 dark:bg-slate-900">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <Label className="font-bold text-xs uppercase">Câu {idx + 1}.{sIdx + 1}</Label>
                        <Button variant="ghost" size="sm" onClick={() => deleteSubQuestion(q.id, sq.id)} className="h-6 w-6 p-0 text-red-500 hover:bg-red-100"><Trash2 className="w-3 h-3"/></Button>
                      </div>
                      <Input placeholder="Nội dung câu hỏi phụ..." value={sq.text} onChange={e => updateSubQuestion(q.id, sq.id, { text: e.target.value })} />
                      <div className="space-y-2">
                        {(sq.options || []).map((opt: string, oIdx: number) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input type="radio" name={`correct_${sq.id}`} checked={sq.correct_index === oIdx} onChange={() => updateSubQuestion(q.id, sq.id, { correct_index: oIdx })} className="w-4 h-4" />
                            <Input value={opt} onChange={(e) => {
                              const newOpts = [...(sq.options || [])];
                              newOpts[oIdx] = e.target.value;
                              updateSubQuestion(q.id, sq.id, { options: newOpts });
                            }} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Các đáp án (Đánh dấu Check vào đáp án đúng)</Label>
              <div className="space-y-2 mt-2">
                {(q.options || []).map((opt: string, oIdx: number) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input type="radio" name={`correct_${q.id}`} checked={q.correct_index === oIdx} onChange={() => updateQuestion(q.id, { correct_index: oIdx })} className="w-4 h-4" />
                    <Input value={opt} onChange={(e) => {
                      const newOpts = [...(q.options || [])];
                      newOpts[oIdx] = e.target.value;
                      updateQuestion(q.id, { options: newOpts });
                    }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Chỉnh sửa đề thi</DialogTitle>
          <DialogDescription>Chỉnh sửa thông tin chung và danh sách câu hỏi.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="space-y-2 col-span-2">
            <Label>Tên đề thi</Label>
            <Input value={editingExam.title_vi} onChange={e => setEditingExam({...editingExam, title_vi: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Cấp độ</Label>
            <Input value={editingExam.exam_category || editingExam.level || ''} onChange={e => setEditingExam({...editingExam, exam_category: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Thời gian (phút)</Label>
            <Input type="number" value={editingExam.duration_minutes} onChange={e => setEditingExam({...editingExam, duration_minutes: parseInt(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <Label>Điểm đỗ</Label>
            <Input type="number" value={editingExam.passing_score} onChange={e => setEditingExam({...editingExam, passing_score: parseInt(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <Label>Giới hạn lượt thi (0 = vô hạn)</Label>
            <Input type="number" value={editingExam.max_attempts || 0} onChange={e => setEditingExam({...editingExam, max_attempts: parseInt(e.target.value)})} />
          </div>
          <div className="space-y-2 flex items-center gap-2 pt-8">
            <input type="checkbox" id="published" checked={editingExam.is_published} onChange={e => setEditingExam({...editingExam, is_published: e.target.checked})} className="w-4 h-4" />
            <Label htmlFor="published">Đã xuất bản</Label>
          </div>
        </div>

        <Card className="mb-6 bg-slate-50 dark:bg-slate-900/50 border-amber-200 dark:border-amber-900/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Cpu className="w-32 h-32" /></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex-1 space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Hệ số độ khó (Dự đoán điểm thi thật)
                </h3>
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-red-500">Đề Khó (&lt; 1.0)</span>
                    <span className="text-blue-500 text-lg">{scoringConfig.difficulty_factor.toFixed(2)}</span>
                    <span className="text-emerald-500">Đề Dễ (&gt; 1.0)</span>
                  </div>
                  <Slider 
                    min={0.5} 
                    max={1.5} 
                    step={0.01} 
                    value={[scoringConfig.difficulty_factor]} 
                    onValueChange={(val) => setScoringConfig({...scoringConfig, difficulty_factor: val[0]})}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Hệ số này dùng để giả lập điểm thi thật dựa trên độ khó của đề thi thử.
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-w-[250px]">
                <p className="text-xs font-bold uppercase text-zinc-500 mb-2">Mô phỏng dự đoán thi thật</p>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-zinc-500 mb-1">Thi thử được</p>
                    <p className="font-bold">120 đ</p>
                  </div>
                  <div className="text-zinc-300">➜</div>
                  <div className="text-center">
                    <p className="text-[10px] text-amber-600 dark:text-amber-500 mb-1 font-bold">Thi thật (Dự đoán)</p>
                    <p className="font-black text-xl text-amber-600 dark:text-amber-500">{Math.round(120 * scoringConfig.difficulty_factor)} đ</p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="font-bold flex items-center gap-2 mb-4 text-base">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">!</span>
              Cấu hình Điểm Liệt (Tối thiểu cần đạt)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(editingExam.level === 'N1' || editingExam.level === 'N2' || editingExam.level === 'N3') ? (
                <>
                  <div className="space-y-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                      <Label className="font-bold">Từ vựng/Ngữ pháp</Label>
                      <span className="text-sm font-bold">{scoringConfig.section_pass.language}/60</span>
                    </div>
                    <Slider min={0} max={60} step={1} value={[scoringConfig.section_pass.language]} onValueChange={val => setScoringConfig({...scoringConfig, section_pass: {...scoringConfig.section_pass, language: val[0]}})} />
                  </div>
                  <div className="space-y-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                      <Label className="font-bold">Đọc hiểu</Label>
                      <span className="text-sm font-bold">{scoringConfig.section_pass.reading}/60</span>
                    </div>
                    <Slider min={0} max={60} step={1} value={[scoringConfig.section_pass.reading]} onValueChange={val => setScoringConfig({...scoringConfig, section_pass: {...scoringConfig.section_pass, reading: val[0]}})} />
                  </div>
                </>
              ) : (
                <div className="space-y-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold">Từ vựng + Đọc hiểu</Label>
                    <span className="text-sm font-bold">{scoringConfig.section_pass.combined}/120</span>
                  </div>
                  <Slider min={0} max={120} step={1} value={[scoringConfig.section_pass.combined]} onValueChange={val => setScoringConfig({...scoringConfig, section_pass: {...scoringConfig.section_pass, combined: val[0]}})} />
                </div>
              )}
              
              <div className="space-y-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <Label className="font-bold">Nghe hiểu</Label>
                  <span className="text-sm font-bold">{scoringConfig.section_pass.listening}/60</span>
                </div>
                <Slider min={0} max={60} step={1} value={[scoringConfig.section_pass.listening]} onValueChange={val => setScoringConfig({...scoringConfig, section_pass: {...scoringConfig.section_pass, listening: val[0]}})} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="vocabulary">
          <TabsList className="mb-4">
            <TabsTrigger value="vocabulary">Từ vựng & Chữ Hán</TabsTrigger>
            <TabsTrigger value="reading">Đọc hiểu & Ngữ pháp</TabsTrigger>
            <TabsTrigger value="listening">Nghe hiểu</TabsTrigger>
            <TabsTrigger value="kaiwa" className="font-bold text-primary">Kaiwa (Giao tiếp)</TabsTrigger>
          </TabsList>

          {['vocabulary', 'reading', 'listening', 'kaiwa'].map(skill => (
            <TabsContent key={skill} value={skill} className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold uppercase tracking-wider text-sm text-muted-foreground">{skill}</h3>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 bg-purple-50/50"
                    onClick={() => setAiModalSkill(skill)}
                  >
                    <BrainCircuit className="w-4 h-4 mr-1"/> AI Tạo tự động
                  </Button>
                  {(skill === 'reading' || skill === 'listening') && (
                    <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => addQuestion(skill, true)}>
                      <BookOpen className="w-4 h-4 mr-1"/> Thêm đoạn văn
                    </Button>
                  )}
                  <Button size="sm" onClick={() => addQuestion(skill, false)}>
                    <Plus className="w-4 h-4 mr-1"/> Thêm câu {skill}
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {questionsBySkill(skill).map((q: any, i: number) => renderQuestionEditor(q, i))}
                {questionsBySkill(skill).length === 0 && (
                  <div className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground">Chưa có câu hỏi nào</div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter className="mt-6 border-t pt-4">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : <><Save className="w-4 h-4 mr-2" /> Lưu Đề Thi</>}
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {aiModalSkill && (
        <AIGeneratorModal 
          isOpen={true} 
          onClose={() => setAiModalSkill(null)} 
          defaultSkill={aiModalSkill}
          onGenerate={appendGeneratedQuestions}
        />
      )}
    </Dialog>
  );
}

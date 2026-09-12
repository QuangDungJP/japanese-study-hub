import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, GripVertical, Save, FileAudio, BookOpen, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  type: string;
  skill: string;
  text: string;
  options?: string[];
  correct_index?: number;
  points?: number;
  audio_url?: string;
}

export default function AdminExamEditor({ exam, onClose, onSaved }: { exam: any, onClose: () => void, onSaved: () => void }) {
  const [editingExam, setEditingExam] = useState<any>(JSON.parse(JSON.stringify(exam)));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          title_vi: editingExam.title_vi,
          level: editingExam.level,
          duration_minutes: editingExam.duration_minutes,
          passing_score: editingExam.passing_score,
          is_published: editingExam.is_published,
          questions: editingExam.questions,
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

  const addQuestion = (skill: string) => {
    const newQ: Question = {
      id: crypto.randomUUID(),
      type: skill === 'kaiwa' ? 'audio_record' : 'multiple_choice',
      skill: skill,
      text: "Nội dung câu hỏi mới...",
      points: 5,
    };
    if (skill !== 'kaiwa') {
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

  const questionsBySkill = (skill: string) => (editingExam.questions || []).filter((q: any) => q.skill === skill);

  const renderQuestionEditor = (q: any, idx: number) => {
    return (
      <Card key={q.id} className="mb-4 border-2">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-sm">Câu {idx + 1}</h4>
            <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4"/></Button>
          </div>
          
          <div className="space-y-2">
            <Label>Đề bài / Prompt</Label>
            <Textarea value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value })} rows={3} />
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

          {q.skill !== 'kaiwa' ? (
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
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Đây là câu hỏi Kaiwa (Giao tiếp). Học viên sẽ được yêu cầu ghi âm câu trả lời.</p>
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
            <Input value={editingExam.level} onChange={e => setEditingExam({...editingExam, level: e.target.value})} />
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
                <Button size="sm" onClick={() => addQuestion(skill)}><Plus className="w-4 h-4 mr-1"/> Thêm câu {skill}</Button>
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
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, CheckCircle2, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export default function QuestionBankModal({ open, onClose, onSelect }: { open: boolean, onClose: () => void, onSelect: (questions: any[]) => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterSkill, setFilterSkill] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) fetchQuestions();
  }, [open, filterSkill, filterDifficulty]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let query = supabase.from('question_bank').select('*').order('created_at', { ascending: false });
      if (filterSkill !== 'all') query = query.eq('skill', filterSkill);
      if (filterDifficulty !== 'all') query = query.eq('difficulty', filterDifficulty);
      
      const { data, error } = await query;
      if (error) throw error;
      setQuestions(data || []);
    } catch (err: any) {
      toast({ title: 'Lỗi tải ngân hàng câu hỏi', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleAdd = () => {
    const selected = questions.filter(q => selectedIds.has(q.id)).map(q => ({
      ...q,
      id: crypto.randomUUID(), // generate new ID for exam to avoid conflicts
      bank_id: q.id // keep reference
    }));
    onSelect(selected);
    setSelectedIds(new Set());
    onClose();
  };

  const filteredQuestions = questions.filter(q => q.text.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ngân hàng câu hỏi</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 items-end mb-4">
          <div className="flex-1 space-y-2">
            <Label>Tìm kiếm</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input placeholder="Tìm nội dung câu hỏi..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="w-40 space-y-2">
            <Label>Kỹ năng</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors" value={filterSkill} onChange={e => setFilterSkill(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="vocabulary">Từ vựng (Vocabulary)</option>
              <option value="grammar">Ngữ pháp (Grammar)</option>
              <option value="reading">Đọc hiểu (Reading)</option>
              <option value="listening">Nghe hiểu (Listening)</option>
            </select>
          </div>
          <div className="w-40 space-y-2">
            <Label>Độ khó</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors" value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Không tìm thấy câu hỏi nào.</div>
          ) : (
            filteredQuestions.map(q => (
              <Card key={q.id} className={`cursor-pointer transition-colors ${selectedIds.has(q.id) ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`} onClick={() => toggleSelect(q.id)}>
                <CardContent className="p-4 flex gap-4">
                  <div className="mt-1">
                    <input type="checkbox" checked={selectedIds.has(q.id)} readOnly className="w-5 h-5 accent-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline">{q.skill}</Badge>
                      <Badge className={q.difficulty === 'hard' ? 'bg-red-500' : q.difficulty === 'easy' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {q.difficulty === 'hard' ? 'Khó' : q.difficulty === 'easy' ? 'Dễ' : 'Trung bình'}
                      </Badge>
                      <Badge variant="secondary">{q.points || 5} điểm</Badge>
                      {q.is_passage && <Badge variant="outline">Đoạn văn ({q.sub_questions?.length || 0} câu phụ)</Badge>}
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{q.text}</p>
                    {!q.is_passage && q.options && (
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
                        {q.options.map((opt: string, i: number) => (
                          <div key={i} className={i === q.correct_index ? 'text-green-600 font-bold' : ''}>
                            {i + 1}. {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleAdd} disabled={selectedIds.size === 0}>
            Thêm {selectedIds.size} câu đã chọn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

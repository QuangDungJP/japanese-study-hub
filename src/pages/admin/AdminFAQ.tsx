import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, HelpCircle } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

const AdminFAQ = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', is_active: true });

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as FAQ[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (faq: typeof form & { id?: string }) => {
      if (faq.id) {
        const { error } = await supabase.from('faqs').update({
          question: faq.question,
          answer: faq.answer,
          is_active: faq.is_active,
        }).eq('id', faq.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('faqs').insert({
          question: faq.question,
          answer: faq.answer,
          is_active: faq.is_active,
          order_index: faqs.length,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success(editingFaq ? 'Đã cập nhật câu hỏi' : 'Đã thêm câu hỏi mới');
      resetForm();
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('Đã xóa câu hỏi');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newIndex }: { id: string; newIndex: number }) => {
      const { error } = await supabase.from('faqs').update({ order_index: newIndex }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-faqs'] }),
  });

  const resetForm = () => {
    setForm({ question: '', answer: '', is_active: true });
    setEditingFaq(null);
    setDialogOpen(false);
  };

  const openEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setForm({ question: faq.question, answer: faq.answer, is_active: faq.is_active });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error('Vui lòng điền đầy đủ câu hỏi và trả lời');
      return;
    }
    saveMutation.mutate({ ...form, id: editingFaq?.id });
  };

  const moveFaq = (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= faqs.length) return;
    reorderMutation.mutate({ id: faqs[index].id, newIndex: faqs[swapIndex].order_index });
    reorderMutation.mutate({ id: faqs[swapIndex].id, newIndex: faqs[index].order_index });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Hỏi & Đáp</h1>
          <p className="text-muted-foreground mt-1">Quản lý các câu hỏi thường gặp hiển thị trên trang chủ và trang FAQ</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Thêm câu hỏi</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFaq ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Câu hỏi</Label>
                <Input
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="Nhập câu hỏi..."
                />
              </div>
              <div>
                <Label>Trả lời</Label>
                <Textarea
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="Nhập câu trả lời..."
                  rows={5}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <Label>Hiển thị</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Hủy</Button>
                <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : faqs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HelpCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={faq.id} className={!faq.is_active ? 'opacity-50' : ''}>
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => moveFaq(index, 'up')}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <button
                    onClick={() => moveFaq(index, 'down')}
                    disabled={index === faqs.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{faq.question}</h3>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{faq.answer}</p>
                  {!faq.is_active && (
                    <span className="text-xs text-destructive font-medium mt-2 inline-block">Đã ẩn</span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="icon" variant="outline" onClick={() => openEdit(faq)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
                        deleteMutation.mutate(faq.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFAQ;

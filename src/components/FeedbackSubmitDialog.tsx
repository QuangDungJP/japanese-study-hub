import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send, Loader2, MessageSquarePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  trigger?: React.ReactNode;
  className?: string;
}

export default function FeedbackSubmitDialog({ trigger, className }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: '',
    email: '',
    course: '',
    rating: 5,
    content: '',
  });

  const reset = () =>
    setForm({ name: '', role: '', email: '', course: '', rating: 5, content: '' });

  const submit = async () => {
    if (!form.name.trim() || !form.content.trim()) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng nhập tên và cảm nhận.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('contact_submissions').insert({
      data: { form_type: 'feedback', ...form },
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Gửi thất bại', description: error.message, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Cảm ơn bạn đã gửi cảm nhận! 💛',
      description: 'Feedback sẽ hiển thị trên trang sau khi được kiểm duyệt.',
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="hero" size="lg" className={className}>
            <MessageSquarePlus className="w-4 h-4 mr-2" /> Gửi cảm nhận của bạn
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chia sẻ cảm nhận của bạn</DialogTitle>
          <DialogDescription>
            Câu chuyện của bạn sẽ là động lực cho các học viên khác. Feedback sẽ xuất hiện công khai sau khi được duyệt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Họ và tên *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Vai trò / Khoá</label>
              <Input
                placeholder="VD: Học viên N3"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Email (tuỳ chọn)</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Khoá học</label>
              <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Đánh giá</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, rating: n })}
                  className="p-1"
                  aria-label={`${n} sao`}
                >
                  <Star
                    className={cn(
                      'w-6 h-6 transition-all',
                      n <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40',
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Cảm nhận của bạn *</label>
            <Textarea
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Chia sẻ về trải nghiệm học của bạn..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={submit} disabled={submitting} variant="hero">
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Gửi cảm nhận
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
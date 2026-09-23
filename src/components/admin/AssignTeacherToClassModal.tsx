import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AssignTeacherToClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string | null;
  teacherName: string | null;
}

export default function AssignTeacherToClassModal({ open, onOpenChange, teacherId, teacherName }: AssignTeacherToClassModalProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchClasses();
      setSelectedClassId('');
    }
  }, [open]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách lớp học.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!teacherId || !selectedClassId) return;
    setAssigning(true);
    try {
      // Check if already assigned
      const { data: existing } = await supabase
        .from('class_teachers')
        .select('id')
        .eq('class_id', selectedClassId)
        .eq('teacher_id', teacherId)
        .single();

      if (existing) {
        toast({
          title: 'Thông báo',
          description: 'Giáo viên này đã được gán vào lớp này từ trước.',
        });
        onOpenChange(false);
        return;
      }

      const { error } = await supabase.from('class_teachers').insert({
        class_id: selectedClassId,
        teacher_id: teacherId,
      });

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: `Đã gán giáo viên vào lớp học.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể gán giáo viên.',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Gán Giáo viên vào Lớp</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Chọn lớp học để gán giáo viên <strong>{teacherName}</strong> làm giảng viên (co-teacher).
          </p>
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-full h-11 rounded-xl">
                  <SelectValue placeholder="-- Chọn lớp học --" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            Hủy
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedClassId || assigning} 
            className="rounded-xl bg-primary hover:bg-primary/90"
          >
            {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {assigning ? 'Đang xử lý...' : 'Xác nhận Gán'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

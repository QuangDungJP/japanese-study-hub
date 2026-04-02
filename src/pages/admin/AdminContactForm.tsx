import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Edit, Eye, Mail, Phone, MessageSquare, FileText } from 'lucide-react';
import { format } from 'date-fns';

type FormField = {
  id: string;
  label: string;
  label_vi: string;
  field_type: string;
  placeholder: string | null;
  placeholder_vi: string | null;
  is_required: boolean | null;
  options: any;
  order_index: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
};

type Submission = {
  id: string;
  data: any;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

const fieldTypes = [
  { value: 'text', label: 'Văn bản ngắn' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Số điện thoại' },
  { value: 'textarea', label: 'Văn bản dài' },
  { value: 'select', label: 'Danh sách chọn' },
];

const AdminContactForm = () => {
  const queryClient = useQueryClient();
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [fieldForm, setFieldForm] = useState({
    label: '', label_vi: '', field_type: 'text', placeholder: '', placeholder_vi: '',
    is_required: false, options: [] as string[], order_index: 0,
  });
  const [newOption, setNewOption] = useState('');

  const { data: fields = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ['contact-form-fields'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_form_fields')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data as FormField[];
    },
  });

  const { data: submissions = [], isLoading: subsLoading } = useQuery({
    queryKey: ['contact-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Submission[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (form: typeof fieldForm & { id?: string }) => {
      const payload = {
        label: form.label,
        label_vi: form.label_vi,
        field_type: form.field_type,
        placeholder: form.placeholder || null,
        placeholder_vi: form.placeholder_vi || null,
        is_required: form.is_required,
        options: form.options,
        order_index: form.order_index,
      };
      if (form.id) {
        const { error } = await supabase.from('contact_form_fields').update(payload).eq('id', form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contact_form_fields').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-form-fields'] });
      toast.success('Đã lưu trường thành công');
      setFieldDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Lỗi khi lưu'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_form_fields').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-form-fields'] });
      toast.success('Đã xóa trường');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('contact_form_fields').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-form-fields'] }),
  });

  const updateSubStatusMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      const { error } = await supabase.from('contact_submissions').update({ status, admin_notes }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast.success('Đã cập nhật');
    },
  });

  const resetForm = () => {
    setFieldForm({ label: '', label_vi: '', field_type: 'text', placeholder: '', placeholder_vi: '', is_required: false, options: [], order_index: fields.length });
    setEditingField(null);
  };

  const openEdit = (field: FormField) => {
    setEditingField(field);
    setFieldForm({
      label: field.label, label_vi: field.label_vi, field_type: field.field_type,
      placeholder: field.placeholder || '', placeholder_vi: field.placeholder_vi || '',
      is_required: field.is_required ?? false,
      options: Array.isArray(field.options) ? field.options : [],
      order_index: field.order_index ?? 0,
    });
    setFieldDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = { new: 'Mới', read: 'Đã xem', replied: 'Đã trả lời' };
    const variant = status === 'new' ? 'default' : status === 'replied' ? 'secondary' : 'outline';
    return <Badge variant={variant as any}>{map[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Form liên hệ</h1>
          <p className="text-muted-foreground">Quản lý trường và xem phản hồi từ người dùng</p>
        </div>
      </div>

      <Tabs defaultValue="fields">
        <TabsList>
          <TabsTrigger value="fields">Cấu hình trường</TabsTrigger>
          <TabsTrigger value="submissions">
            Phản hồi {submissions.filter(s => s.status === 'new').length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full">
                {submissions.filter(s => s.status === 'new').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={fieldDialogOpen} onOpenChange={(o) => { setFieldDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Thêm trường</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingField ? 'Sửa trường' : 'Thêm trường mới'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Label (EN)</Label>
                      <Input value={fieldForm.label} onChange={e => setFieldForm(f => ({ ...f, label: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Label (VI)</Label>
                      <Input value={fieldForm.label_vi} onChange={e => setFieldForm(f => ({ ...f, label_vi: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Loại trường</Label>
                    <Select value={fieldForm.field_type} onValueChange={v => setFieldForm(f => ({ ...f, field_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Placeholder (EN)</Label>
                      <Input value={fieldForm.placeholder} onChange={e => setFieldForm(f => ({ ...f, placeholder: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Placeholder (VI)</Label>
                      <Input value={fieldForm.placeholder_vi} onChange={e => setFieldForm(f => ({ ...f, placeholder_vi: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={fieldForm.is_required} onCheckedChange={v => setFieldForm(f => ({ ...f, is_required: v }))} />
                    <Label>Bắt buộc</Label>
                  </div>
                  <div>
                    <Label>Thứ tự hiển thị</Label>
                    <Input type="number" value={fieldForm.order_index} onChange={e => setFieldForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))} />
                  </div>
                  {fieldForm.field_type === 'select' && (
                    <div>
                      <Label>Tùy chọn</Label>
                      <div className="flex gap-2 mb-2">
                        <Input value={newOption} onChange={e => setNewOption(e.target.value)} placeholder="Thêm tùy chọn..." />
                        <Button size="sm" onClick={() => { if (newOption.trim()) { setFieldForm(f => ({ ...f, options: [...f.options, newOption.trim()] })); setNewOption(''); } }}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {fieldForm.options.map((opt, i) => (
                          <Badge key={i} variant="secondary" className="gap-1">
                            {opt}
                            <button onClick={() => setFieldForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }))}>×</button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button className="w-full" onClick={() => saveMutation.mutate({ ...fieldForm, id: editingField?.id })} disabled={!fieldForm.label || !fieldForm.label_vi}>
                    {editingField ? 'Cập nhật' : 'Tạo trường'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {fieldsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : fields.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Chưa có trường nào. Bấm "Thêm trường" để bắt đầu.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {fields.map(field => (
                <Card key={field.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{field.label_vi} <span className="text-muted-foreground text-sm">({field.label})</span></p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{fieldTypes.find(t => t.value === field.field_type)?.label || field.field_type}</Badge>
                          {field.is_required && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                          <Badge variant="secondary">#{field.order_index}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={field.is_active ?? true} onCheckedChange={v => toggleMutation.mutate({ id: field.id, is_active: v })} />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(field)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(field.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          {subsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : submissions.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Chưa có phản hồi nào.</CardContent></Card>
          ) : (
            submissions.map(sub => (
              <Card key={sub.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(sub.status)}
                      <span className="text-sm text-muted-foreground">{format(new Date(sub.created_at), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                    <div className="flex gap-2">
                      {sub.status === 'new' && (
                        <Button size="sm" variant="outline" onClick={() => updateSubStatusMutation.mutate({ id: sub.id, status: 'read' })}>
                          <Eye className="w-3 h-3 mr-1" />Đánh dấu đã xem
                        </Button>
                      )}
                      {sub.status !== 'replied' && (
                        <Button size="sm" variant="outline" onClick={() => updateSubStatusMutation.mutate({ id: sub.id, status: 'replied' })}>
                          <MessageSquare className="w-3 h-3 mr-1" />Đã trả lời
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(sub.data as Record<string, string>).map(([key, value]) => (
                      <div key={key} className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground font-medium">{key}</p>
                        <p className="text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminContactForm;

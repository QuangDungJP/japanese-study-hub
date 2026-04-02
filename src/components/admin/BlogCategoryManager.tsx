import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Tags } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface BlogCategory {
  id: string;
  value: string;
  label: string;
  created_at: string;
}

export const useBlogCategories = () => {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('label');
      if (error) throw error;
      return data as BlogCategory[];
    },
  });
};

const BlogCategoryManager = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const { data: categories = [] } = useBlogCategories();

  const addMutation = useMutation({
    mutationFn: async (label: string) => {
      const value = label.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
      const { error } = await supabase.from('blog_categories').insert({ value, label });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      setNewLabel('');
      toast({ title: 'Đã thêm danh mục!' });
    },
    onError: (err: any) => toast({ title: 'Lỗi', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast({ title: 'Đã xóa danh mục!' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Tags className="w-4 h-4 mr-2" />Quản lý danh mục</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quản lý danh mục Blog</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Tên danh mục mới..."
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newLabel.trim()) addMutation.mutate(newLabel.trim()); }}
            />
            <Button onClick={() => newLabel.trim() && addMutation.mutate(newLabel.trim())} disabled={!newLabel.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{cat.label}</Badge>
                  <span className="text-xs text-muted-foreground">{cat.value}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                  if (confirm(`Xóa danh mục "${cat.label}"?`)) deleteMutation.mutate(cat.id);
                }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogCategoryManager;

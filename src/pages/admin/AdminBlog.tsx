import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, FileText, Search } from 'lucide-react';
import MediaUploader from '@/components/shared/MediaUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import BlogCategoryManager, { useBlogCategories } from '@/components/admin/BlogCategoryManager';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  title_vi: string;
  slug: string;
  excerpt: string | null;
  excerpt_vi: string | null;
  content: string | null;
  content_vi: string | null;
  thumbnail_url: string | null;
  author_id: string | null;
  category: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const emptyPost: Partial<BlogPost> = {
  title: '', title_vi: '', slug: '', excerpt: '', excerpt_vi: '',
  content: '', content_vi: '', thumbnail_url: '', category: 'general',
  tags: [], is_published: false,
};

const AdminBlog = () => {
  const queryClient = useQueryClient();
  const [editPost, setEditPost] = useState<Partial<BlogPost> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const { data: categories = [] } = useBlogCategories();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      const payload = {
        title: post.title!,
        title_vi: post.title_vi!,
        slug: post.slug!,
        excerpt: post.excerpt || null,
        excerpt_vi: post.excerpt_vi || null,
        content: post.content || null,
        content_vi: post.content_vi || null,
        thumbnail_url: post.thumbnail_url || null,
        category: post.category || 'general',
        tags: post.tags || [],
        is_published: post.is_published || false,
        published_at: post.is_published ? (post.published_at || new Date().toISOString()) : null,
      };
      if (post.id) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', post.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('blog_posts').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      setIsDialogOpen(false);
      setEditPost(null);
      toast({ title: 'Đã lưu bài viết thành công!' });
    },
    onError: (err: any) => {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast({ title: 'Đã xóa bài viết!' });
    },
  });

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const openCreate = () => { setEditPost({ ...emptyPost }); setIsDialogOpen(true); };
  const openEdit = (post: BlogPost) => { setEditPost({ ...post }); setIsDialogOpen(true); };

  const filteredPosts = posts.filter(p => {
    const matchSearch = p.title_vi.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const getCategoryLabel = (value: string | null) =>
    categories.find(c => c.value === value)?.label || value || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý Blog</h1>
          <p className="text-muted-foreground">Tạo và quản lý bài viết cho trang blog</p>
        </div>
        <div className="flex gap-2">
          <BlogCategoryManager />
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Tạo bài viết</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm bài viết..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filteredPosts.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Chưa có bài viết nào</p></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map(post => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {post.thumbnail_url && (
                    <img src={post.thumbnail_url} alt="" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground truncate">{post.title_vi}</h3>
                        <p className="text-sm text-muted-foreground truncate">{post.title}</p>
                      </div>
                      <Badge variant={post.is_published ? 'default' : 'secondary'}>
                        {post.is_published ? 'Đã đăng' : 'Nháp'}
                      </Badge>
                    </div>
                    {post.excerpt_vi && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt_vi}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{getCategoryLabel(post.category)}</span>
                      <span>{format(new Date(post.created_at), 'dd/MM/yyyy')}</span>
                      <span>{post.view_count} lượt xem</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(post)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                      if (confirm('Xóa bài viết này?')) deleteMutation.mutate(post.id);
                    }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={v => { setIsDialogOpen(v); if (!v) setEditPost(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPost?.id ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</DialogTitle>
          </DialogHeader>
          {editPost && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tiêu đề (Tiếng Việt)</Label>
                  <Input value={editPost.title_vi || ''} onChange={e => {
                    const title_vi = e.target.value;
                    setEditPost(p => ({ ...p!, title_vi, slug: p?.id ? p.slug : generateSlug(title_vi) }));
                  }} />
                </div>
                <div className="space-y-2">
                  <Label>Title (English)</Label>
                  <Input value={editPost.title || ''} onChange={e => setEditPost(p => ({ ...p!, title: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input value={editPost.slug || ''} onChange={e => setEditPost(p => ({ ...p!, slug: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tóm tắt (Tiếng Việt)</Label>
                  <Input value={editPost.excerpt_vi || ''} onChange={e => setEditPost(p => ({ ...p!, excerpt_vi: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Excerpt (English)</Label>
                  <Input value={editPost.excerpt || ''} onChange={e => setEditPost(p => ({ ...p!, excerpt: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nội dung (Tiếng Việt)</Label>
                <RichTextEditor
                  value={editPost.content_vi || ''}
                  onChange={v => setEditPost(p => ({ ...p!, content_vi: v }))}
                  placeholder="Viết nội dung bài viết..."
                  minHeight="250px"
                />
              </div>

              <div className="space-y-2">
                <Label>Content (English)</Label>
                <RichTextEditor
                  value={editPost.content || ''}
                  onChange={v => setEditPost(p => ({ ...p!, content: v }))}
                  placeholder="Write blog content..."
                  minHeight="250px"
                />
              </div>

              <div className="space-y-2">
                <Label>Ảnh bìa</Label>
                <MediaUploader
                  value={editPost.thumbnail_url || ''}
                  onChange={url => setEditPost(p => ({ ...p!, thumbnail_url: url }))}
                  bucket="website-assets"
                  folder="blog"
                  accept="image"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  <Select value={editPost.category || 'general'} onValueChange={v => setEditPost(p => ({ ...p!, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tags (phân cách bằng dấu phẩy)</Label>
                  <Input
                    value={(editPost.tags || []).join(', ')}
                    onChange={e => setEditPost(p => ({ ...p!, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
                    placeholder="jlpt, n5, ngữ pháp"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={editPost.is_published || false} onCheckedChange={v => setEditPost(p => ({ ...p!, is_published: v }))} />
                <Label>Xuất bản</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditPost(null); }}>Hủy</Button>
                <Button onClick={() => saveMutation.mutate(editPost)} disabled={!editPost.title_vi || !editPost.title || !editPost.slug || saveMutation.isPending}>
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu bài viết'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;

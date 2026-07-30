import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, FileText, Search, Pin, Home, Sparkles, Check, MoveUp, MoveDown, Eye } from 'lucide-react';
import MediaUploader from '@/components/shared/MediaUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import BlogCategoryManager, { useBlogCategories } from '@/components/admin/BlogCategoryManager';
import { useBlogHomeSettings, useSaveBlogHomeSettings } from '@/hooks/useBlogHomeSettings';
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
  const [isHomeConfigOpen, setIsHomeConfigOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const { data: categories = [] } = useBlogCategories();

  const { data: homeSettings } = useBlogHomeSettings();
  const saveHomeSettings = useSaveBlogHomeSettings();

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

  const homeIds = homeSettings?.home_ids || [];
  const pinnedIds = homeSettings?.pinned_ids || [];
  const homeCount = homeSettings?.home_count || 3;

  const toggleHomePost = (postId: string) => {
    const updated = homeIds.includes(postId)
      ? homeIds.filter(id => id !== postId)
      : [...homeIds, postId];

    saveHomeSettings.mutate({
      pinned_ids: pinnedIds,
      home_ids: updated,
      home_count: homeCount,
    }, {
      onSuccess: () => {
        toast({
          title: updated.includes(postId) ? 'Đã thêm vào Trang chủ ✦' : 'Đã bỏ khỏi Trang chủ',
          description: 'Thay đổi đã được cập nhật lên trang chủ khách hàng.',
        });
      }
    });
  };

  const togglePinPost = (postId: string) => {
    const updated = pinnedIds.includes(postId)
      ? pinnedIds.filter(id => id !== postId)
      : [...pinnedIds, postId];

    saveHomeSettings.mutate({
      pinned_ids: updated,
      home_ids: homeIds,
      home_count: homeCount,
    }, {
      onSuccess: () => {
        toast({
          title: updated.includes(postId) ? 'Đã ghim bài viết 📌' : 'Đã bỏ ghim bài viết',
        });
      }
    });
  };

  const setHomeCount = (count: number) => {
    saveHomeSettings.mutate({
      pinned_ids: pinnedIds,
      home_ids: homeIds,
      home_count: count,
    }, {
      onSuccess: () => {
        toast({ title: `Đã cài đặt hiển thị ${count} bài trên Trang chủ` });
      }
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      const title_vi = post.title_vi || '';
      const title = post.title || title_vi;
      const slug = post.slug || generateSlug(title_vi);
      const payload = {
        title,
        title_vi,
        slug,
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

  const selectedHomePosts = posts.filter(p => homeIds.includes(p.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Blog bài viết</h1>
          <p className="text-muted-foreground mt-1">Tạo bài viết và tùy chọn bài hiển thị trên Trang chủ</p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Button 
            variant="outline"
            className="gap-2 font-semibold border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => setIsHomeConfigOpen(true)}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Cấu hình 3 bài Trang chủ ({homeIds.length})
          </Button>
          <BlogCategoryManager />
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Tạo bài viết
          </Button>
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
            <SelectItem value="all">Tất cả danh mục</SelectItem>
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
          {filteredPosts.map(post => {
            const isSelectedForHome = homeIds.includes(post.id);
            const isPinned = pinnedIds.includes(post.id);

            return (
              <Card key={post.id} className={`hover:shadow-md transition-all border ${isSelectedForHome ? 'border-amber-500/50 bg-amber-50/10 dark:bg-amber-500/5' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {post.thumbnail_url ? (
                      <img src={post.thumbnail_url} alt="" className="w-full sm:w-28 h-28 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-full sm:w-28 h-28 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">📰</div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-foreground text-base truncate">{post.title_vi}</h3>
                            {isPinned && (
                              <Badge className="bg-amber-500 text-white border-0 text-[10px] gap-1">
                                <Pin className="w-3 h-3 fill-white" /> Bài ghim
                              </Badge>
                            )}
                            {isSelectedForHome && (
                              <Badge className="bg-emerald-600 text-white border-0 text-[10px] gap-1">
                                <Home className="w-3 h-3" /> Trang chủ
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{post.title}</p>
                        </div>
                        <Badge variant={post.is_published ? 'default' : 'secondary'} className="text-xs">
                          {post.is_published ? 'Đã đăng' : 'Nháp'}
                        </Badge>
                      </div>

                      {post.excerpt_vi && <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{post.excerpt_vi}</p>}

                      <div className="flex items-center justify-between pt-2 gap-4 text-xs text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[10px]">{getCategoryLabel(post.category)}</Badge>
                          <span>📅 {format(new Date(post.created_at), 'dd/MM/yyyy')}</span>
                          <span>👁️ {post.view_count} lượt xem</span>
                        </div>

                        {/* Quick Homepage & Pin Switches */}
                        <div className="flex items-center gap-4 bg-background/80 p-1.5 rounded-lg border border-border">
                          <div className="flex items-center gap-1.5">
                            <Switch
                              id={`home-${post.id}`}
                              checked={isSelectedForHome}
                              onCheckedChange={() => toggleHomePost(post.id)}
                            />
                            <Label htmlFor={`home-${post.id}`} className="text-[11px] font-semibold cursor-pointer flex items-center gap-1">
                              <Home className="w-3 h-3 text-amber-500" /> Hiện Trang chủ
                            </Label>
                          </div>

                          <div className="flex items-center gap-1.5 border-l pl-3">
                            <Switch
                              id={`pin-${post.id}`}
                              checked={isPinned}
                              onCheckedChange={() => togglePinPost(post.id)}
                            />
                            <Label htmlFor={`pin-${post.id}`} className="text-[11px] font-semibold cursor-pointer flex items-center gap-1">
                              <Pin className="w-3 h-3 text-primary" /> Ghim
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-start sm:self-center">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(post)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                        if (confirm('Xóa bài viết này?')) deleteMutation.mutate(post.id);
                      }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Homepage Blog Config Modal */}
      <Dialog open={isHomeConfigOpen} onOpenChange={setIsHomeConfigOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Cấu hình 3 Bài viết Hiển thị Trang chủ
            </DialogTitle>
            <DialogDescription>
              Chọn bài viết và thứ tự ghim hiển thị nổi bật trên khối Blog của Trang chủ khách hàng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div>
                <p className="font-bold text-sm text-foreground">Số lượng bài hiển thị trên Trang chủ</p>
                <p className="text-xs text-muted-foreground">Mặc định hiển thị 3 bài viết tuyển chọn đầu tiên</p>
              </div>
              <Select value={String(homeCount)} onValueChange={v => setHomeCount(Number(v))}>
                <SelectTrigger className="w-28 font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 bài viết</SelectItem>
                  <SelectItem value="6">6 bài viết</SelectItem>
                  <SelectItem value="9">9 bài viết</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currently Selected Homepage Posts */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-foreground flex items-center justify-between">
                <span>Danh sách bài đã chọn ({selectedHomePosts.length})</span>
                <span className="text-xs text-muted-foreground font-normal">Bài đầu tiên sẽ là Bài Hero kích thước lớn</span>
              </h4>

              {selectedHomePosts.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-xl text-muted-foreground text-xs">
                  Chưa chọn bài viết nào. Hãy tích chọn switch "Hiện Trang chủ" ở danh sách bên dưới.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedHomePosts.map((post, index) => (
                    <div key={post.id} className="p-3 rounded-xl border bg-card flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="hero" className="w-6 h-6 rounded-full p-0 flex items-center justify-center font-bold text-xs shrink-0">
                          {index + 1}
                        </Badge>
                        {post.thumbnail_url && (
                          <img src={post.thumbnail_url} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{post.title_vi}</p>
                          <p className="text-muted-foreground text-[11px]">{index === 0 ? '🔥 Bài Hero chính (Khung to)' : `Card phụ thứ ${index + 1}`}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive h-7 text-xs"
                        onClick={() => toggleHomePost(post.id)}
                      >
                        Bỏ chọn
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Select from all posts */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-foreground">Tất cả bài viết sẵn có</h4>
              <div className="rounded-xl border divide-y divide-border max-h-60 overflow-y-auto">
                {posts.filter(p => p.is_published).map(p => {
                  const isSelected = homeIds.includes(p.id);
                  return (
                    <div key={p.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-foreground truncate">{p.title_vi}</span>
                        {isSelected && <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">Đã chọn</Badge>}
                      </div>
                      <Button
                        size="sm"
                        variant={isSelected ? "outline" : "default"}
                        className="h-7 text-xs"
                        onClick={() => toggleHomePost(p.id)}
                      >
                        {isSelected ? 'Bỏ chọn' : 'Thêm vào Trang chủ'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <Label>Title EN / JP (Không bắt buộc)</Label>
                  <Input value={editPost.title || ''} placeholder="Tự động lấy theo Tiếng Việt nếu bỏ trống" onChange={e => setEditPost(p => ({ ...p!, title: e.target.value }))} />
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
                <Button onClick={() => saveMutation.mutate(editPost)} disabled={!editPost.title_vi || saveMutation.isPending}>
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

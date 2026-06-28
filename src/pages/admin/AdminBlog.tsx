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
import { Plus, Pencil, Trash2, FileText, Search, Pin, PinOff, Home, HomeIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBlogHomeSettings, useSaveBlogHomeSettings } from '@/hooks/useBlogHomeSettings';
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
  const [sortBy, setSortBy] = useState<'pinned' | 'newest' | 'oldest'>('pinned');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { data: categories = [] } = useBlogCategories();
  const { data: homeSettings } = useBlogHomeSettings();
  const saveHome = useSaveBlogHomeSettings();

  const pinnedSet = new Set(homeSettings?.pinned_ids || []);
  const homeSet = new Set(homeSettings?.home_ids || []);
  const homeCount = homeSettings?.home_count ?? 6;

  const togglePin = (id: string) => {
    if (!homeSettings) return;
    const next = pinnedSet.has(id)
      ? homeSettings.pinned_ids.filter(p => p !== id)
      : [id, ...homeSettings.pinned_ids];
    saveHome.mutate({ ...homeSettings, pinned_ids: next }, {
      onSuccess: () => toast({ title: pinnedSet.has(id) ? 'Đã bỏ ghim' : 'Đã ghim bài viết ⭐' }),
    });
  };

  const toggleHome = (id: string) => {
    if (!homeSettings) return;
    const next = homeSet.has(id)
      ? homeSettings.home_ids.filter(p => p !== id)
      : [...homeSettings.home_ids, id];
    saveHome.mutate({ ...homeSettings, home_ids: next }, {
      onSuccess: () => toast({ title: homeSet.has(id) ? 'Đã ẩn khỏi trang chủ' : 'Đã đưa lên trang chủ 🏠' }),
    });
  };

  const updateHomeCount = (n: number) => {
    if (!homeSettings) return;
    saveHome.mutate({ ...homeSettings, home_count: Math.max(1, Math.min(12, n)) });
  };

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

  const generateSlug = (title: string) => {
    const map: Record<string, string> = {
      à:'a',á:'a',ạ:'a',ả:'a',ã:'a',â:'a',ầ:'a',ấ:'a',ậ:'a',ẩ:'a',ẫ:'a',ă:'a',ằ:'a',ắ:'a',ặ:'a',ẳ:'a',ẵ:'a',
      è:'e',é:'e',ẹ:'e',ẻ:'e',ẽ:'e',ê:'e',ề:'e',ế:'e',ệ:'e',ể:'e',ễ:'e',
      ì:'i',í:'i',ị:'i',ỉ:'i',ĩ:'i',
      ò:'o',ó:'o',ọ:'o',ỏ:'o',õ:'o',ô:'o',ồ:'o',ố:'o',ộ:'o',ổ:'o',ỗ:'o',ơ:'o',ờ:'o',ớ:'o',ợ:'o',ở:'o',ỡ:'o',
      ù:'u',ú:'u',ụ:'u',ủ:'u',ũ:'u',ư:'u',ừ:'u',ứ:'u',ự:'u',ử:'u',ữ:'u',
      ỳ:'y',ý:'y',ỵ:'y',ỷ:'y',ỹ:'y',
      đ:'d',
    };
    return title
      .toLowerCase()
      .split('')
      .map(c => map[c] ?? c)
      .join('')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const openCreate = () => { setEditPost({ ...emptyPost }); setIsDialogOpen(true); };
  const openEdit = (post: BlogPost) => { setEditPost({ ...post }); setIsDialogOpen(true); };

  const filteredPosts = posts
    .filter(p => {
      const matchSearch = p.title_vi.toLowerCase().includes(search.toLowerCase()) ||
        p.title.toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory === 'all' || p.category === filterCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      if (sortBy === 'oldest') return dateA - dateB;
      if (sortBy === 'newest') return dateB - dateA;

      const ap = pinnedSet.has(a.id) ? homeSettings?.pinned_ids.indexOf(a.id) ?? 0 : Number.MAX_SAFE_INTEGER;
      const bp = pinnedSet.has(b.id) ? homeSettings?.pinned_ids.indexOf(b.id) ?? 0 : Number.MAX_SAFE_INTEGER;
      if (ap !== bp) return ap - bp;
      return dateB - dateA;
    });

  const totalItems = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedPosts = filteredPosts.slice(start, end);

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
      <div className="flex gap-3 flex-wrap items-end">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm bài viết..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: 'pinned' | 'newest' | 'oldest') => { setSortBy(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pinned">Ghim trước</SelectItem>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="oldest">Cũ nhất</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(itemsPerPage)} onValueChange={v => { setItemsPerPage(Number(v)); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[10, 50, 100, 150].map(n => <SelectItem key={n} value={String(n)}>{n} / trang</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Homepage controls banner */}
      <Card className="bg-gradient-to-r from-japanese/5 via-primary/5 to-accent/5 border-japanese/20">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-japanese/15 flex items-center justify-center">
              <HomeIcon className="w-5 h-5 text-japanese" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Bài viết trên trang chủ</h3>
              <p className="text-xs text-muted-foreground">
                Đang ghim: <strong>{pinnedSet.size}</strong> &middot; Hiển thị trang chủ: <strong>{homeSet.size || 'mới nhất'}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Số bài trên trang chủ:</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={homeCount}
              onChange={e => updateHomeCount(parseInt(e.target.value) || 6)}
              className="w-20 h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Posts list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : paginatedPosts.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Chưa có bài viết nào</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {paginatedPosts.map(post => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex gap-3 items-start">
                  {post.thumbnail_url && (
                    <img src={post.thumbnail_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground text-sm truncate">{post.title_vi}</h3>
                          {pinnedSet.has(post.id) && (
                            <Badge className="bg-accent text-accent-foreground gap-1 text-[10px] h-5">
                              <Pin className="w-3 h-3" /> Ghim
                            </Badge>
                          )}
                          {homeSet.has(post.id) && (
                            <Badge variant="outline" className="border-japanese text-japanese gap-1 text-[10px] h-5">
                              <Home className="w-3 h-3" /> Trang chủ
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{post.title}</p>
                      </div>
                      <Badge variant={post.is_published ? 'default' : 'secondary'} className="text-[10px] h-5">
                        {post.is_published ? 'Đã đăng' : 'Nháp'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="truncate max-w-[120px]">{getCategoryLabel(post.category)}</span>
                      <span>{format(new Date(post.created_at), 'dd/MM/yyyy')}</span>
                      <span>{post.view_count} lượt xem</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${pinnedSet.has(post.id) ? 'text-accent' : ''}`}
                      title={pinnedSet.has(post.id) ? 'Bỏ ghim' : 'Ghim lên đầu'}
                      onClick={() => togglePin(post.id)}
                    >
                      {pinnedSet.has(post.id) ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${homeSet.has(post.id) ? 'text-japanese' : ''}`}
                      title={homeSet.has(post.id) ? 'Ẩn khỏi trang chủ' : 'Đưa lên trang chủ'}
                      onClick={() => toggleHome(post.id)}
                    >
                      <Home className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(post)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                      if (confirm('Xóa bài viết này?')) deleteMutation.mutate(post.id);
                    }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">
            Hiển thị <strong>{start + 1}</strong>–<strong>{Math.min(end, totalItems)}</strong> / <strong>{totalItems}</strong> bài viết
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Trước
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button
                  key={p}
                  variant={p === safePage ? 'default' : 'outline'}
                  size="sm"
                  className="min-w-[36px]"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              Sau <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
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

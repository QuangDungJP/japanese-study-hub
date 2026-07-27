import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Calendar, Eye, ArrowRight, ChevronLeft, ChevronRight, Newspaper, Sparkles, TrendingUp, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useBlogCategories } from '@/components/admin/BlogCategoryManager';
import ScrollReveal from '@/components/ScrollReveal';

const POSTS_PER_PAGE = 9;

const Blog = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const { data: categories = [] } = useBlogCategories();

  // Featured post: only fetch on first page with no filters
  const showFeatured = page === 1 && !search && category === 'all';
  const { data: featuredPost } = useQuery({
    queryKey: ['blog-featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: showFeatured,
  });

  // Server-side paginated query
  const { data, isLoading } = useQuery({
    queryKey: ['blog-posts', category, search, page, showFeatured, featuredPost?.id],
    queryFn: async () => {
      // Count query
      let countQuery = supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);
      if (showFeatured && featuredPost?.id) {
        countQuery = countQuery.neq('id', featuredPost.id);
      }
      if (category !== 'all') countQuery = countQuery.eq('category', category);
      if (search) countQuery = countQuery.or(`title_vi.ilike.%${search}%,title.ilike.%${search}%`);

      const { count } = await countQuery;

      // Data query with pagination
      const from = (page - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      let dataQuery = supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      
      if (showFeatured && featuredPost?.id) {
        dataQuery = dataQuery.neq('id', featuredPost.id);
      }
      if (category !== 'all') dataQuery = dataQuery.eq('category', category);
      if (search) dataQuery = dataQuery.or(`title_vi.ilike.%${search}%,title.ilike.%${search}%`);

      const { data: posts, error } = await dataQuery.range(from, to);
      if (error) throw error;

      return { posts: posts || [], total: count || 0 };
    },
    placeholderData: (prev) => prev,
  });

  // Category counts (lightweight query)
  const { data: allPosts = [] } = useQuery({
    queryKey: ['blog-category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('category')
        .eq('is_published', true);
      if (error) throw error;
      return data;
    },
  });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allPosts.length };
    allPosts.forEach(p => {
      const cat = p.category || 'general';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [allPosts]);

  const posts = data?.posts || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const getCategoryLabel = (value: string | null) =>
    categories.find(c => c.value === value)?.label || value || 'Chung';

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [];
    if (page <= 3) {
      pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
    } else if (page >= totalPages - 2) {
      pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="absolute top-20 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float animation-delay-200" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 border border-primary/20 backdrop-blur-md shadow-sm">
                <Newspaper className="w-4 h-4" />
                TNQDO Blog & Kiến thức
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-5 leading-tight tracking-tight">
                Khám phá <span className="text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">kiến thức</span> Tiếng Nhật
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                Chia sẻ kinh nghiệm luyện thi JLPT, ngữ pháp, từ vựng và văn hóa Nhật Bản từ đội ngũ chuyên gia
              </p>
            </div>
          </ScrollReveal>

          {/* Single-line Search & Funnel Filter Bar */}
          <ScrollReveal delay={100}>
            <div className="max-w-2xl mx-auto mt-8 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm bài viết, chủ đề tiếng Nhật..."
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="pl-12 pr-10 h-13 rounded-2xl border-border/80 bg-card/90 text-base shadow-sm focus:shadow-md transition-all backdrop-blur-md"
                />
                {search && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm font-bold p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Funnel Filter Dropdown */}
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full sm:w-60 h-13 rounded-2xl border-border/80 bg-card/90 px-4 font-bold text-sm shadow-sm gap-2 shrink-0 border">
                  <div className="flex items-center gap-2 truncate">
                    <SlidersHorizontal className="w-4 h-4 text-primary shrink-0" />
                    <SelectValue placeholder="Danh mục bài viết" />
                  </div>
                </SelectTrigger>
                <SelectContent align="end" className="max-h-80">
                  <SelectItem value="all" className="font-bold">
                    Tất cả danh mục ({categoryCounts.all || 0})
                  </SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label} ({categoryCounts[c.value] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Featured Pinned Post Section */}
      {showFeatured && featuredPost && (
        <section className="pb-12">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1.5 px-3 py-1.5 font-bold text-xs">
                    <Sparkles className="w-4 h-4" /> BÀI VIẾT NỔI BẬT ĐƯỢC GHIM
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline">Nội dung chọn lọc đặc biệt từ ban biên tập</span>
                </div>
              </div>
              <Link to={`/blog/${featuredPost.slug}`}>
                <div className="group relative rounded-3xl overflow-hidden bg-card border border-border/80 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    <div className="lg:col-span-7 aspect-video lg:aspect-auto lg:min-h-[400px] overflow-hidden bg-muted relative">
                      {featuredPost.thumbnail_url ? (
                        <img
                          src={featuredPost.thumbnail_url}
                          alt={featuredPost.title_vi}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                          <Newspaper className="w-16 h-16 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-primary text-primary-foreground font-bold shadow-lg px-3 py-1 text-xs">
                          📌 Ghim trang chủ
                        </Badge>
                      </div>
                    </div>
                    <div className="lg:col-span-5 p-6 md:p-10 flex flex-col justify-between bg-card">
                      <div className="space-y-4">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-semibold">
                          {getCategoryLabel(featuredPost.category)}
                        </Badge>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors leading-tight">
                          {featuredPost.title_vi}
                        </h2>
                        {featuredPost.excerpt_vi && (
                          <p className="text-muted-foreground line-clamp-3 text-sm md:text-base leading-relaxed font-normal">
                            {featuredPost.excerpt_vi}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-border/60 mt-6">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {featuredPost.published_at ? format(new Date(featuredPost.published_at), 'dd/MM/yyyy', { locale: vi }) : ''}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />{featuredPost.view_count} lượt xem
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-primary font-bold text-sm group-hover:translate-x-1 transition-transform">
                          Đọc ngay <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Posts Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {totalCount} bài viết {category !== 'all' && `trong "${getCategoryLabel(category)}"`}
              {totalPages > 1 && ` • Trang ${page}/${totalPages}`}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              Mới nhất
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Newspaper className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Không tìm thấy bài viết</h3>
              <p className="text-muted-foreground">Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, i) => (
                  <ScrollReveal key={post.id} delay={i * 80} direction="up">
                    <Link to={`/blog/${post.slug}`} className="block h-full">
                      <Card className="h-full overflow-hidden group border-border hover:border-primary/20 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 rounded-2xl bg-card">
                        <div className="relative aspect-video overflow-hidden bg-muted">
                          {post.thumbnail_url ? (
                            <img src={post.thumbnail_url} alt={post.title_vi} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                              <Newspaper className="w-12 h-12 text-primary/20" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="backdrop-blur-sm bg-card/80 text-xs font-medium">
                              {getCategoryLabel(post.category)}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-5 flex flex-col flex-1">
                          <h2 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors text-base leading-snug">
                            {post.title_vi}
                          </h2>
                          {post.excerpt_vi && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed flex-1">{post.excerpt_vi}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {post.published_at ? format(new Date(post.published_at), 'dd/MM/yy') : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />{post.view_count}
                              </span>
                            </div>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-primary" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-12">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    disabled={page <= 1}
                    onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {getPageNumbers().map((p, i) =>
                    p === 'ellipsis' ? (
                      <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="icon"
                        className={`rounded-xl ${p === page ? 'shadow-md' : ''}`}
                        onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      >
                        {p}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    disabled={page >= totalPages}
                    onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;

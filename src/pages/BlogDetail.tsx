import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Eye, Share2, Clock, Tag, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useBlogCategories } from '@/components/admin/BlogCategoryManager';
import { useToast } from '@/hooks/use-toast';
import ScrollReveal from '@/components/ScrollReveal';

const RelatedPosts = ({ category, currentId }: { category: string | null; currentId: string }) => {
  const { data: posts = [] } = useQuery({
    queryKey: ['related-posts', category, currentId],
    queryFn: async () => {
      const base = supabase
        .from('blog_posts')
        .select('id, title_vi, slug, thumbnail_url, excerpt_vi, published_at, view_count')
        .eq('is_published', true)
        .neq('id', currentId)
        .order('published_at', { ascending: false })
        .limit(3);
      if (category) {
        const { data, error } = await base.eq('category', category);
        if (error) throw error;
        if (data && data.length > 0) return data;
      }
      // Fallback: latest other posts regardless of category
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title_vi, slug, thumbnail_url, excerpt_vi, published_at, view_count')
        .eq('is_published', true)
        .neq('id', currentId)
        .order('published_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!currentId,
  });

  if (posts.length === 0) return null;

  return (
    <ScrollReveal delay={300}>
      <div className="mt-16 pt-10 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">Bài viết khác</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              {post.thumbnail_url ? (
                <div className="aspect-video overflow-hidden">
                  <img src={post.thumbnail_url} alt={post.title_vi} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Tag className="w-8 h-8 text-muted-foreground/40" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{post.title_vi}</h3>
                {post.excerpt_vi && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{post.excerpt_vi}</p>}
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(post.published_at), 'dd MMM yyyy', { locale: vi })}
                    </span>
                  )}
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.view_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
};

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: categories = [] } = useBlogCategories();
  const { toast } = useToast();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug!)
        .eq('is_published', true)
        .single();
      if (error) throw error;
      supabase.from('blog_posts').update({ view_count: (data.view_count || 0) + 1 }).eq('id', data.id).then();
      return data;
    },
    enabled: !!slug,
  });

  const getCategoryLabel = (value: string | null) =>
    categories.find(c => c.value === value)?.label || value || 'Chung';

  useEffect(() => {
    if (!post) return;
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const setNameMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    document.title = `${post.title_vi} | TNQDO Blog`;
    setMeta('og:title', post.title_vi);
    setMeta('og:description', post.excerpt_vi || post.title_vi);
    setMeta('og:type', 'article');
    setMeta('og:url', window.location.href);
    if (post.thumbnail_url) { setMeta('og:image', post.thumbnail_url); setMeta('og:image:width', '1200'); setMeta('og:image:height', '630'); }
    setNameMeta('twitter:card', 'summary_large_image');
    setNameMeta('twitter:title', post.title_vi);
    setNameMeta('twitter:description', post.excerpt_vi || post.title_vi);
    if (post.thumbnail_url) setNameMeta('twitter:image', post.thumbnail_url);
    return () => { document.title = 'TNQDO'; };
  }, [post]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: post?.title_vi, text: post?.excerpt_vi || '', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Đã sao chép link!' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 pb-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="animate-pulse space-y-6">
              <div className="h-6 bg-muted rounded w-32" />
              <div className="aspect-video bg-muted rounded-2xl" />
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-muted rounded" />)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy bài viết</h1>
          <Button asChild><Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" />Quay lại Blog</Link></Button>
        </div>
      </div>
    );
  }

  const wordCount = (post.content_vi || '').replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {post.thumbnail_url && (
        <section className="relative pt-20">
          <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
            <img src={post.thumbnail_url} alt={post.title_vi} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        </section>
      )}

      <article className={`pb-16 ${post.thumbnail_url ? '-mt-24 relative z-10' : 'pt-28'}`}>
        <div className="container mx-auto px-4 max-w-3xl">
          <ScrollReveal>
            <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Quay lại Blog
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <Badge className="rounded-lg">{getCategoryLabel(post.category)}</Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {post.published_at ? format(new Date(post.published_at), 'dd MMM yyyy', { locale: vi }) : ''}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />{post.view_count} lượt xem
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />{readingTime} phút đọc
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6 leading-tight tracking-tight">
              {post.title_vi}
            </h1>

            {post.excerpt_vi && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-6 border-l-4 border-primary/30 pl-4 italic">
                {post.excerpt_vi}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-6 border-b border-border">
              <div className="flex flex-wrap gap-2">
                {post.tags && (post.tags as string[]).length > 0 && (
                  (post.tags as string[]).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs rounded-lg">
                      <Tag className="w-3 h-3 mr-1" />#{tag}
                    </Badge>
                  ))
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleShare} className="rounded-xl">
                <Share2 className="w-4 h-4 mr-1.5" />Chia sẻ
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div
              className="prose prose-lg max-w-none text-foreground leading-relaxed
                prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-2xl prose-img:shadow-lg
                prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground
                prose-code:bg-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5
                prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: post.content_vi || '' }}
            />
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-12 p-6 md:p-8 rounded-2xl bg-card border border-border text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">Bạn thấy bài viết hữu ích?</h3>
              <p className="text-muted-foreground mb-4">Khám phá thêm nhiều bài viết hay trên Blog của TNQDO</p>
              <Button asChild className="rounded-xl">
                <Link to="/blog">Xem thêm bài viết <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
          </ScrollReveal>

          {/* Related Posts */}
          <RelatedPosts category={post.category} currentId={post.id} />
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default BlogDetail;

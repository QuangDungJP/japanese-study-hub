import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Pin, Calendar, Eye, BookOpen, Sparkles } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { useBlogHomeSettings } from "@/hooks/useBlogHomeSettings";
import { format } from "date-fns";

interface PostItem {
  id: string;
  title_vi: string;
  slug: string;
  excerpt_vi: string | null;
  thumbnail_url: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string;
  view_count: number | null;
}

const BlogHighlightsSection = () => {
  const { data: settings } = useBlogHomeSettings();

  const { data: posts = [] } = useQuery({
    queryKey: ["home-blog-posts", settings?.home_ids, settings?.pinned_ids, settings?.home_count],
    queryFn: async () => {
      const limit = settings?.home_count || 6;
      const homeIds = settings?.home_ids || [];
      const pinned = settings?.pinned_ids || [];
      const cols = "id,title_vi,slug,excerpt_vi,thumbnail_url,category,published_at,created_at,view_count";
      const map = new Map<string, PostItem>();

      // 1. Always fetch pinned (so they appear even outside home_ids/latest set)
      if (pinned.length > 0) {
        const { data } = await supabase
          .from("blog_posts").select(cols).eq("is_published", true).in("id", pinned);
        (data || []).forEach((p) => map.set(p.id, p as PostItem));
      }

      // 2. Fetch curated home_ids if set
      if (homeIds.length > 0) {
        const { data } = await supabase
          .from("blog_posts").select(cols).eq("is_published", true).in("id", homeIds);
        (data || []).forEach((p) => { if (!map.has(p.id)) map.set(p.id, p as PostItem); });
      }

      // 3. Fallback / top-up with latest published until we reach the limit
      if (map.size < limit) {
        const { data } = await supabase
          .from("blog_posts").select(cols).eq("is_published", true)
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(limit + map.size);
        (data || []).forEach((p) => { if (!map.has(p.id)) map.set(p.id, p as PostItem); });
      }

      const rows = Array.from(map.values());
      rows.sort((a, b) => {
        const ap = pinned.indexOf(a.id);
        const bp = pinned.indexOf(b.id);
        if (ap !== -1 && bp === -1) return -1;
        if (bp !== -1 && ap === -1) return 1;
        if (ap !== -1 && bp !== -1) return ap - bp;
        const ad = new Date(a.published_at || a.created_at).getTime();
        const bd = new Date(b.published_at || b.created_at).getTime();
        return bd - ad;
      });
      return rows.slice(0, limit);
    },
    enabled: !!settings,
  });

  if (!posts.length) return null;

  const [hero, ...rest] = posts;
  const pinnedSet = new Set(settings?.pinned_ids || []);

  return (
    <section key="blog" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-0 w-96 h-96 bg-japanese/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-japanese/10 text-japanese text-sm font-semibold mb-4 border border-japanese/20">
                <Sparkles className="w-4 h-4" /> Blog học tập
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Cẩm nang & Mẹo học Tiếng Nhật
              </h2>
              <p className="text-lg text-muted-foreground">
                Những bài viết được tuyển chọn từ giáo viên và biên tập viên của chúng tôi.
              </p>
            </div>
            <Button variant="outline" size="lg" className="rounded-2xl h-12 px-6 shrink-0" asChild>
              <Link to="/blog">
                Xem tất cả <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hero feature card */}
          <ScrollReveal direction="left" className="lg:col-span-2">
            <Link
              to={`/blog/${hero.slug}`}
              className="group relative block rounded-3xl overflow-hidden border border-border bg-card h-full min-h-[420px] hover:shadow-2xl transition-all duration-500"
            >
              <div className="absolute inset-0">
                {hero.thumbnail_url ? (
                  <img
                    src={hero.thumbnail_url}
                    alt={hero.title_vi}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-japanese/30 via-primary/20 to-accent/30 flex items-center justify-center">
                    <BookOpen className="w-24 h-24 text-japanese/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              </div>

              <div className="relative h-full flex flex-col justify-end p-8 md:p-10 text-white min-h-[420px]">
                <div className="flex items-center gap-2 mb-4">
                  {pinnedSet.has(hero.id) && (
                    <Badge className="bg-accent text-accent-foreground border-0 gap-1">
                      <Pin className="w-3 h-3" /> Nổi bật
                    </Badge>
                  )}
                  {hero.category && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/20 backdrop-blur-sm">
                      {hero.category}
                    </Badge>
                  )}
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3 group-hover:text-japanese-foreground transition-colors line-clamp-3">
                  {hero.title_vi}
                </h3>
                {hero.excerpt_vi && (
                  <p className="text-white/85 line-clamp-2 mb-5 text-base md:text-lg">{hero.excerpt_vi}</p>
                )}
                <div className="flex items-center gap-5 text-sm text-white/70">
                  {hero.published_at && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(hero.published_at), "dd/MM/yyyy")}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" /> {hero.view_count || 0} lượt xem
                  </span>
                  <span className="ml-auto flex items-center gap-1 font-semibold text-white group-hover:translate-x-1 transition-transform">
                    Đọc tiếp <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </ScrollReveal>

          {/* Side stacked cards */}
          <div className="flex flex-col gap-6">
            {rest.slice(0, 2).map((p, i) => (
              <ScrollReveal key={p.id} direction="right" delay={i * 100}>
                <Link
                  to={`/blog/${p.slug}`}
                  className="group flex gap-4 bg-card rounded-2xl border border-border overflow-hidden p-3 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-muted shrink-0">
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt={p.title_vi} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-japanese/20 to-primary/20 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-japanese/50" />
                      </div>
                    )}
                    {pinnedSet.has(p.id) && (
                      <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                        <Pin className="w-3 h-3 text-accent-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1 flex flex-col">
                    {p.category && (
                      <span className="text-[11px] uppercase tracking-wider text-japanese font-bold mb-1">{p.category}</span>
                    )}
                    <h4 className="font-bold text-foreground line-clamp-2 group-hover:text-japanese transition-colors">
                      {p.title_vi}
                    </h4>
                    <div className="mt-auto pt-2 text-xs text-muted-foreground flex items-center gap-3">
                      {p.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(p.published_at), "dd/MM")}
                        </span>
                      )}
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {p.view_count || 0}</span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Bottom grid of remaining posts */}
        {rest.length > 2 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {rest.slice(2).map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 80} direction="up">
                <Link
                  to={`/blog/${p.slug}`}
                  className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col h-full"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt={p.title_vi} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-japanese/20 to-primary/20 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-japanese/40" />
                      </div>
                    )}
                    {pinnedSet.has(p.id) && (
                      <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-0 gap-1">
                        <Pin className="w-3 h-3" /> Ghim
                      </Badge>
                    )}
                    {p.category && (
                      <Badge className="absolute top-3 right-3 bg-background/90 text-foreground border-0 backdrop-blur-sm">
                        {p.category}
                      </Badge>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-japanese transition-colors">
                      {p.title_vi}
                    </h3>
                    {p.excerpt_vi && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{p.excerpt_vi}</p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
                      {p.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(p.published_at), "dd/MM/yyyy")}
                        </span>
                      )}
                      <span className="text-japanese font-semibold flex items-center gap-1">
                        Đọc <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogHighlightsSection;

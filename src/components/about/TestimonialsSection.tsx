import { useMemo, useState, useRef, useEffect } from 'react';
import { useTestimonials, type Testimonial, type TestimonialSize } from '@/hooks/useTestimonials';
import { Star, Quote, Play, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ScrollReveal from '@/components/ScrollReveal';
import { cn } from '@/lib/utils';
import FeedbackSubmitDialog from '@/components/FeedbackSubmitDialog';

type Tab = 'all' | 'masonry' | 'carousel' | 'bento' | 'video';

const Stars = ({ rating = 5 }: { rating?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn('w-3.5 h-3.5', i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')}
      />
    ))}
  </div>
);

const Initials = (name: string) =>
  name
    .split(' ')
    .slice(-2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

/* ---------- MASONRY ---------- */
const MasonryGrid = ({ items }: { items: Testimonial[] }) => (
  <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
    {items.map((t, i) => (
      <ScrollReveal key={t.id} delay={i * 40}>
        <div className="mb-5 break-inside-avoid rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          {t.image_url && (
            <div className="relative overflow-hidden">
              <img
                src={t.image_url}
                alt={t.name}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                style={{
                  aspectRatio:
                    t.size === 'lg' ? '4/5'
                    : t.size === 'sm' ? '4/3'
                    : t.size === 'md' ? '1/1'
                    : (i % 3 === 0 ? '4/5' : i % 3 === 1 ? '4/3' : '1/1'),
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {t.course && (
                <Badge className="absolute top-3 left-3 bg-white/90 text-foreground backdrop-blur-sm border-0">
                  {t.course}
                </Badge>
              )}
            </div>
          )}
          <div className="p-5 space-y-3">
            <Quote className="w-6 h-6 text-primary/60" />
            <p className="text-sm leading-relaxed text-foreground/90">{t.content}</p>
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={t.avatar_url} />
                  <AvatarFallback>{Initials(t.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold leading-tight">{t.name}</p>
                  {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                </div>
              </div>
              <Stars rating={t.rating} />
            </div>
          </div>
        </div>
      </ScrollReveal>
    ))}
  </div>
);

/* ---------- CAROUSEL ---------- */
const Carousel = ({ items }: { items: Testimonial[] }) => {
  const [active, setActive] = useState(0);
  const total = items.length;
  const t = items[active];

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % Math.max(total, 1)), 7000);
    return () => clearInterval(id);
  }, [total]);

  if (!t) return null;

  return (
    <div className="relative">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center rounded-[40px] border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-10 shadow-xl">
        <div className="relative overflow-hidden rounded-3xl aspect-[4/5] order-2 md:order-1">
          {t.image_url ? (
            <img src={t.image_url} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-japanese/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <p className="text-lg font-bold">{t.name}</p>
            {t.role && <p className="text-sm text-white/80">{t.role}</p>}
          </div>
        </div>

        <div className="order-1 md:order-2 space-y-5">
          <Quote className="w-12 h-12 text-primary/70" />
          <p className="text-xl md:text-2xl leading-relaxed font-medium text-foreground">"{t.content}"</p>
          <div className="flex items-center gap-3">
            <Stars rating={t.rating} />
            {t.course && <Badge variant="secondary">{t.course}</Badge>}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    i === active ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                className="rounded-full"
                onClick={() => setActive((a) => (a - 1 + total) % total)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="rounded-full"
                onClick={() => setActive((a) => (a + 1) % total)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- BENTO ---------- */
const Bento = ({ items }: { items: Testimonial[] }) => {
  const list = items.slice(0, 6);
  // Asymmetric bento: card 0 big-tall, others varied
  const defaultSpans = [
    'md:col-span-2 md:row-span-2',
    'md:col-span-1 md:row-span-1',
    'md:col-span-1 md:row-span-2',
    'md:col-span-1 md:row-span-1',
    'md:col-span-2 md:row-span-1',
    'md:col-span-1 md:row-span-1',
  ];
  const sizeSpan = (s?: TestimonialSize) =>
    s === 'lg' ? 'md:col-span-2 md:row-span-2'
    : s === 'md' ? 'md:col-span-1 md:row-span-2'
    : s === 'sm' ? 'md:col-span-1 md:row-span-1'
    : undefined;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 md:auto-rows-[180px] gap-4">
      {list.map((t, i) => (
        <ScrollReveal key={t.id} delay={i * 50}>
          <div
            className={cn(
              'relative overflow-hidden rounded-3xl border border-border/60 group h-full',
              sizeSpan(t.size) || defaultSpans[i] || 'md:col-span-1 md:row-span-1',
              t.image_url ? 'text-white' : 'bg-gradient-to-br from-primary/10 to-japanese/10'
            )}
          >
            {t.image_url && (
              <>
                <img
                  src={t.image_url}
                  alt={t.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
              </>
            )}
            <div className="relative h-full p-5 flex flex-col justify-end">
              <Quote className={cn('w-6 h-6 mb-2', t.image_url ? 'text-white/70' : 'text-primary/70')} />
              <p
                className={cn(
                  'leading-snug font-medium',
                  i === 0 ? 'text-lg md:text-xl line-clamp-5' : 'text-sm line-clamp-3'
                )}
              >
                {t.content}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7 border border-white/40">
                    <AvatarImage src={t.avatar_url} />
                    <AvatarFallback className="text-xs">{Initials(t.name)}</AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <p className={cn('text-xs font-semibold', t.image_url ? 'text-white' : 'text-foreground')}>
                      {t.name}
                    </p>
                    {t.role && (
                      <p className={cn('text-[10px]', t.image_url ? 'text-white/70' : 'text-muted-foreground')}>
                        {t.role}
                      </p>
                    )}
                  </div>
                </div>
                <Stars rating={t.rating} />
              </div>
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
};

/* ---------- VIDEO ---------- */
const VideoGrid = ({ items }: { items: Testimonial[] }) => {
  const [active, setActive] = useState<Testimonial | null>(null);
  const videos = items.filter((t) => t.video_url);
  const display = videos.length ? videos : items.slice(0, 3);

  return (
    <>
      <div className="grid md:grid-cols-3 gap-5">
        {display.map((t, i) => (
          <ScrollReveal key={t.id} delay={i * 50}>
            <button
              onClick={() => t.video_url && setActive(t)}
              className="text-left w-full rounded-3xl overflow-hidden border border-border/60 bg-card group hover:shadow-xl transition-all"
            >
              <div className="relative aspect-video overflow-hidden">
                {t.image_url ? (
                  <img
                    src={t.image_url}
                    alt={t.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-japanese/30" />
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                {t.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 ml-1 text-primary fill-primary" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={t.avatar_url} />
                    <AvatarFallback>{Initials(t.name)}</AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold">{t.name}</p>
                    {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{t.content}</p>
              </div>
            </button>
          </ScrollReveal>
        ))}
      </div>

      {active && active.video_url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <iframe
              className="w-full h-full rounded-2xl"
              src={active.video_url}
              title={active.name}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            <button
              onClick={() => setActive(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white text-sm"
            >
              ✕ Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'bento', label: 'Nổi bật' },
  { key: 'masonry', label: 'Hình ảnh' },
  { key: 'carousel', label: 'Câu chuyện' },
  { key: 'video', label: 'Video' },
];

interface TestimonialsSectionProps {
  limit?: number;
  showTabs?: boolean;
  heading?: string;
  subheading?: string;
  /** When true (used on the homepage), only items with show_on_homepage !== false are kept. */
  homepageOnly?: boolean;
}

export default function TestimonialsSection({ limit, showTabs = true, heading, subheading, homepageOnly = false }: TestimonialsSectionProps = {}) {
  const { data: allItems = [] } = useTestimonials();
  const sourceItems = homepageOnly
    ? allItems.filter((t) => t.show_on_homepage !== false)
    : allItems;
  const items = typeof limit === 'number' ? sourceItems.slice(0, limit) : sourceItems;
  const [tab, setTab] = useState<Tab>('all');

  const filtered = useMemo(() => {
    if (tab === 'all') return items;
    if (tab === 'bento') return items.filter((t) => t.is_featured || t.layout === 'bento');
    return items.filter((t) => t.layout === tab);
  }, [tab, items]);

  const renderLayout = () => {
    if (items.length === 0) {
      return (
        <div className="text-center py-16 rounded-3xl border-2 border-dashed border-primary/20 bg-primary/5">
          <MessageSquare className="w-12 h-12 text-primary/40 mx-auto mb-3" />
          <p className="text-muted-foreground mb-5">
            Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!
          </p>
          <FeedbackSubmitDialog />
        </div>
      );
    }
    if (tab === 'carousel') return <Carousel items={filtered.length ? filtered : items} />;
    if (tab === 'video') return <VideoGrid items={filtered.length ? filtered : items} />;
    if (tab === 'bento') return <Bento items={filtered.length ? filtered : items} />;
    if (tab === 'masonry') return <MasonryGrid items={filtered.length ? filtered : items} />;

    // ALL: stacked showcase — carousel hero + bento + masonry tail
    return (
      <div className="space-y-12">
        <Carousel items={items.filter((t) => t.is_featured) .length ? items.filter((t) => t.is_featured) : items} />
        <Bento items={items} />
        <MasonryGrid items={items} />
        {items.some((t) => t.video_url) && <VideoGrid items={items} />}
      </div>
    );
  };

  return (
    <section id="feedback" className="py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-japanese/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-5">
              <MessageSquare className="w-4 h-4" />
              Học viên nói gì
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-foreground mb-5">
              {heading || (<>Hành trình <span className="text-primary">thay đổi</span> mỗi ngày</>)}
            </h2>
            <p className="text-lg text-muted-foreground">
              {subheading || 'Hàng nghìn học viên đã chinh phục tiếng Nhật cùng chúng tôi — đây là câu chuyện của họ.'}
            </p>
          </div>
        </ScrollReveal>

        {showTabs && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-5 py-2.5 rounded-full text-sm font-semibold border transition-all',
                tab === t.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary/5'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        )}

        <div className="max-w-7xl mx-auto">{renderLayout()}</div>

        {items.length > 0 && (
          <div className="text-center mt-14">
            <p className="text-sm text-muted-foreground mb-3">Bạn cũng là học viên? Hãy chia sẻ trải nghiệm để truyền cảm hứng cho cộng đồng.</p>
            <FeedbackSubmitDialog />
          </div>
        )}
      </div>
    </section>
  );
}

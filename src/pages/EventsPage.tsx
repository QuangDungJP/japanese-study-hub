import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, Clock, MapPin, Users, Video, ArrowRight, Loader2, Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';

const EVENTS_PER_PAGE = 9;

const EventsPage = () => {
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title_vi, description_vi, thumbnail_url, event_date, start_time, end_time, location_vi, is_online, max_participants, layout_style')
        .eq('is_published', true)
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchFilter = filter === 'all' ? true
        : filter === 'upcoming' ? !isPast(new Date(e.event_date))
        : isPast(new Date(e.event_date));
      const matchSearch = !search || (e.title_vi || '').toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [events, filter, search]);

  const totalPages = Math.ceil(filtered.length / EVENTS_PER_PAGE);
  const currentPage = Math.min(page, totalPages || 1);
  const paginatedEvents = filtered.slice((currentPage - 1) * EVENTS_PER_PAGE, currentPage * EVENTS_PER_PAGE);

  const upcomingCount = events.filter(e => !isPast(new Date(e.event_date))).length;
  const pastCount = events.filter(e => isPast(new Date(e.event_date))).length;

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
    setPage(1);
  };

  const nextUpcoming = useMemo(() => {
    const upcoming = events
      .filter(e => !isPast(new Date(e.event_date)))
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    return upcoming[0];
  }, [events]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5">
          <div className="absolute top-20 right-20 w-72 h-72 bg-accent/8 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float animation-delay-200" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6 border border-accent/20">
                <Sparkles className="w-4 h-4" />
                Sự kiện & Workshop
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-5 leading-tight">
                Sự kiện <span className="text-primary">hấp dẫn</span> đang chờ bạn
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Khám phá workshop, hội thảo và sự kiện học tập thú vị cùng đội ngũ chuyên gia
              </p>
            </div>
          </ScrollReveal>

          {/* Search */}
          <ScrollReveal delay={100}>
            <div className="max-w-xl mx-auto mt-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Tìm sự kiện..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="pl-12 h-12 rounded-2xl border-border/50 bg-card text-base shadow-sm"
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Filter Chips */}
          <ScrollReveal delay={200}>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {[
                { key: 'upcoming' as const, label: 'Sắp diễn ra', count: upcomingCount, icon: Sparkles },
                { key: 'past' as const, label: 'Đã qua', count: pastCount, icon: CalendarDays },
                { key: 'all' as const, label: 'Tất cả', count: events.length, icon: CalendarDays },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => handleFilterChange(f.key)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    filter === f.key
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Featured Next Event */}
      {nextUpcoming && filter === 'upcoming' && !search && page === 1 && (
        <section className="pb-8">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <Link to={`/su-kien/${nextUpcoming.id}`}>
                <div className="group relative rounded-3xl overflow-hidden bg-card border border-primary/20 hover:shadow-2xl transition-all duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative aspect-video lg:aspect-auto lg:min-h-[340px] overflow-hidden bg-muted">
                      {nextUpcoming.thumbnail_url ? (
                        <img src={nextUpcoming.thumbnail_url} alt={nextUpcoming.title_vi} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                          <CalendarDays className="w-16 h-16 text-primary/20" />
                        </div>
                      )}
                      {nextUpcoming.is_online && (
                        <Badge className="absolute top-4 left-4 bg-blue-600/90 text-white backdrop-blur-sm">
                          <Video className="w-3 h-3 mr-1" />Online
                        </Badge>
                      )}
                    </div>
                    <div className="p-6 md:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
                          <Sparkles className="w-3 h-3 mr-1" />Sắp diễn ra
                        </Badge>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
                        {nextUpcoming.title_vi}
                      </h2>
                      {nextUpcoming.description_vi && (
                        <p className="text-muted-foreground line-clamp-2 mb-6 leading-relaxed">{nextUpcoming.description_vi}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-primary" />
                          {format(new Date(nextUpcoming.event_date), 'dd MMM yyyy', { locale: vi })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-accent" />
                          {nextUpcoming.start_time?.slice(0,5)}{nextUpcoming.end_time ? ` - ${nextUpcoming.end_time.slice(0,5)}` : ''}
                        </span>
                        {nextUpcoming.location_vi && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-green-500" />{nextUpcoming.location_vi}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-primary font-semibold group-hover:gap-2 transition-all">
                        Xem chi tiết & Đăng ký <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Events Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">{filtered.length} sự kiện</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="flex gap-2"><div className="w-12 h-12 rounded-xl bg-muted" /><div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" /></div></div>
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Không tìm thấy sự kiện</h3>
              <p className="text-muted-foreground">Thử chọn bộ lọc khác hoặc quay lại sau</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedEvents.map((event, i) => {
                  const eventPast = isPast(new Date(event.event_date));
                  return (
                    <ScrollReveal key={event.id} delay={i * 80} direction="up">
                      <Link to={`/su-kien/${event.id}`} className="block h-full">
                        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-500 border-border hover:border-primary/20 h-full rounded-2xl hover:-translate-y-1">
                          <div className="relative aspect-video overflow-hidden bg-muted">
                            {event.thumbnail_url ? (
                              <img src={event.thumbnail_url} alt={event.title_vi} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                                <CalendarDays className="w-12 h-12 text-primary/20" />
                              </div>
                            )}
                            {eventPast && (
                              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                                <Badge variant="secondary" className="text-sm font-medium">Đã kết thúc</Badge>
                              </div>
                            )}
                            <div className="absolute top-3 right-3 flex gap-1.5">
                              {event.is_online && (
                                <Badge className="bg-blue-600/90 text-white text-xs backdrop-blur-sm">
                                  <Video className="w-3 h-3 mr-1" />Online
                                </Badge>
                              )}
                              {!eventPast && (
                                <Badge className="bg-green-500/90 text-white text-xs backdrop-blur-sm">Sắp tới</Badge>
                              )}
                            </div>
                          </div>

                          <CardContent className="p-5 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0 border border-primary/10">
                                <span className="text-[10px] font-bold text-primary uppercase leading-none">{format(new Date(event.event_date), 'MMM', { locale: vi })}</span>
                                <span className="text-xl font-extrabold text-primary leading-none">{format(new Date(event.event_date), 'dd')}</span>
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">{event.title_vi}</h3>
                              </div>
                            </div>

                            {event.description_vi && (
                              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{event.description_vi}</p>
                            )}

                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.start_time?.slice(0,5)}{event.end_time ? ` - ${event.end_time.slice(0,5)}` : ''}</span>
                              {event.location_vi && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location_vi}</span>}
                              {event.max_participants && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.max_participants} chỗ</span>}
                            </div>

                            <div className="pt-1">
                              <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                                Xem chi tiết <ArrowRight className="w-4 h-4" />
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </ScrollReveal>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button variant="outline" size="icon" className="rounded-xl" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="icon" className={`rounded-xl ${p === currentPage ? 'shadow-md' : ''}`} onClick={() => setPage(p)}>
                      {p}
                    </Button>
                  ))}
                  <Button variant="outline" size="icon" className="rounded-xl" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
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

export default EventsPage;

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays, Clock, MapPin, Users, Video, ArrowLeft, CheckCircle, Loader2, Share2, Sparkles, Heart } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';

interface EventDetail {
  id: string;
  title: string;
  title_vi: string;
  description: string | null;
  description_vi: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  gallery_urls: string[];
  event_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  location_vi: string | null;
  is_online: boolean;
  meet_link: string | null;
  max_participants: number | null;
  layout_style: string;
  content_html: string | null;
  content_html_vi: string | null;
}

interface FormField {
  id: string;
  label: string;
  label_vi: string;
  field_type: string;
  placeholder: string | null;
  placeholder_vi: string | null;
  is_required: boolean;
  options: string[];
  order_index: number;
}

const EventDetailPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [regCount, setRegCount] = useState(0);

  useEffect(() => {
    if (slug) fetchEvent();
  }, [slug]);

  useEffect(() => {
    if (!event) return;
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
    document.title = `${event.title_vi} | TNQDO`;
    setMeta('og:title', event.title_vi);
    setMeta('og:description', event.description_vi || event.title_vi);
    setMeta('og:type', 'article');
    setMeta('og:url', window.location.href);
    if (event.thumbnail_url) {
      setMeta('og:image', event.thumbnail_url);
      setMeta('og:image:width', '1200');
      setMeta('og:image:height', '630');
    }
    setNameMeta('twitter:card', 'summary_large_image');
    setNameMeta('twitter:title', event.title_vi);
    setNameMeta('twitter:description', event.description_vi || event.title_vi);
    if (event.thumbnail_url) setNameMeta('twitter:image', event.thumbnail_url);
    return () => { document.title = 'TNQDO'; };
  }, [event]);

  const fetchEvent = async () => {
    const [{ data: eventData }, { data: fieldsData }, { count }] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('event_form_fields').select('*').eq('event_id', id).eq('is_active', true).order('order_index'),
      supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', id).neq('status', 'cancelled'),
    ]);
    setEvent(eventData as any);
    setFields((fieldsData as any[])?.map(f => ({ ...f, options: Array.isArray(f.options) ? f.options : [] })) || []);
    setRegCount(count || 0);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const field of fields) {
      if (field.is_required && !formData[field.label_vi]) {
        toast({ title: 'Lỗi', description: `Vui lòng điền ${field.label_vi}`, variant: 'destructive' });
        return;
      }
    }
    if (event?.max_participants && regCount >= event.max_participants) {
      toast({ title: 'Đã hết chỗ', description: 'Sự kiện đã đạt số lượng đăng ký tối đa', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('event_registrations').insert({
        event_id: id, user_id: user?.id || null, data: formData, status: 'registered',
      } as any);
      if (error) throw error;
      setSubmitted(true);
      toast({ title: '🎉 Đăng ký thành công!', description: 'Bạn đã đăng ký tham gia sự kiện' });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: event?.title_vi, text: event?.description_vi || '', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Đã sao chép link!' });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải sự kiện...</p>
        </div>
      </div>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-xl text-muted-foreground mb-4">Sự kiện không tồn tại</p>
        <Button asChild><Link to="/su-kien"><ArrowLeft className="w-4 h-4 mr-2" />Quay lại</Link></Button>
      </div>
    </div>
  );

  const eventPast = isPast(new Date(event.event_date));
  const isFull = event.max_participants ? regCount >= event.max_participants : false;
  const isHeroLayout = event.layout_style === 'hero';
  const progressPercent = event.max_participants ? Math.round((regCount / event.max_participants) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative min-h-[50vh] md:min-h-[65vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          {event.thumbnail_url ? (
            <img src={event.thumbnail_url} alt={event.title_vi} className="w-full h-full object-cover scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative pb-10 pt-32">
          <Link to="/su-kien" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />Tất cả sự kiện
          </Link>
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-4">
              {eventPast ? (
                <Badge variant="secondary" className="backdrop-blur-sm">Đã kết thúc</Badge>
              ) : (
                <Badge className="bg-green-500/90 text-white backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 mr-1" />Sắp diễn ra
                </Badge>
              )}
              {event.is_online && <Badge className="bg-blue-600/90 text-white backdrop-blur-sm"><Video className="w-3 h-3 mr-1" />Online</Badge>}
              {isFull && <Badge variant="destructive" className="backdrop-blur-sm">Hết chỗ</Badge>}
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-4 leading-tight tracking-tight">
              {event.title_vi}
            </h1>
            {event.description_vi && (
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">{event.description_vi}</p>
            )}
            <div className="flex items-center gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={handleShare} className="backdrop-blur-sm">
                <Share2 className="w-4 h-4 mr-1.5" />Chia sẻ
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards Strip */}
      <section className="py-6 border-b border-border/50">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { icon: CalendarDays, label: 'Ngày', value: format(new Date(event.event_date), 'dd MMM yyyy', { locale: vi }), color: 'text-primary', bg: 'bg-primary/10' },
                { icon: Clock, label: 'Giờ', value: `${event.start_time?.slice(0,5)}${event.end_time ? ` - ${event.end_time.slice(0,5)}` : ''}`, color: 'text-orange-600', bg: 'bg-orange-500/10' },
                { icon: MapPin, label: 'Nơi', value: event.is_online ? 'Online' : event.location_vi || 'TBA', color: 'text-green-600', bg: 'bg-green-500/10' },
                { icon: Users, label: 'Đăng ký', value: `${regCount}${event.max_participants ? `/${event.max_participants}` : ''}`, color: 'text-violet-600', bg: 'bg-violet-500/10' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/50 hover:shadow-md transition-shadow">
                  <div className={`p-2 rounded-lg ${item.bg}`}>
                    <item.icon className={`w-4 h-4 md:w-5 md:h-5 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="font-semibold text-xs md:text-sm text-foreground truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Content + Registration */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left: Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Video */}
              {event.video_url && (
                <ScrollReveal>
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-border/50">
                    <video src={event.video_url} controls className="w-full aspect-video" poster={event.thumbnail_url || undefined} />
                  </div>
                </ScrollReveal>
              )}

              {/* Gallery */}
              {event.gallery_urls && event.gallery_urls.length > 0 && (
                <ScrollReveal>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(event.gallery_urls as string[]).map((url, i) => (
                      <div key={i} className="rounded-xl overflow-hidden aspect-[4/3] group cursor-pointer">
                        <img src={url} alt={`Gallery ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              )}

              {/* Content */}
              {event.content_html_vi && (
                <ScrollReveal>
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />Chi tiết sự kiện
                      </CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                      <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {event.content_html_vi}
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )}
            </div>

            {/* Right: Registration Form */}
            <div className="lg:col-span-2">
              <ScrollReveal delay={150}>
                <div className="sticky top-24">
                  <Card className="border-primary/20 shadow-xl overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-accent" />
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Heart className="w-5 h-5 text-primary" />Đăng ký tham gia
                      </CardTitle>
                      {event.max_participants && !eventPast && !submitted && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                            <span>{regCount} đã đăng ký</span>
                            <span>Còn {event.max_participants - regCount} chỗ</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-5">
                      {submitted ? (
                        <div className="text-center py-10 space-y-4">
                          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto animate-in zoom-in-50 duration-500">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                          </div>
                          <h3 className="text-xl font-bold text-foreground">Đăng ký thành công!</h3>
                          <p className="text-muted-foreground text-sm">Cảm ơn bạn đã đăng ký. Chúng tôi sẽ liên hệ xác nhận sớm nhất.</p>
                          <Button variant="outline" asChild className="mt-2">
                            <Link to="/su-kien">Xem thêm sự kiện</Link>
                          </Button>
                        </div>
                      ) : eventPast ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                            <CalendarDays className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground font-medium">Sự kiện này đã kết thúc</p>
                        </div>
                      ) : isFull ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                            <Users className="w-8 h-8 text-destructive" />
                          </div>
                          <p className="text-muted-foreground font-medium">Sự kiện đã hết chỗ</p>
                        </div>
                      ) : fields.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Chưa có form đăng ký</p>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          {fields.map(field => (
                            <div key={field.id} className="space-y-1.5">
                              <label className="text-sm font-medium flex items-center gap-1">
                                {field.label_vi}
                                {field.is_required && <span className="text-destructive">*</span>}
                              </label>
                              {field.field_type === 'textarea' ? (
                                <Textarea
                                  value={formData[field.label_vi] || ''}
                                  onChange={e => setFormData({ ...formData, [field.label_vi]: e.target.value })}
                                  placeholder={field.placeholder_vi || ''}
                                  required={field.is_required}
                                  rows={3}
                                  className="resize-none"
                                />
                              ) : field.field_type === 'select' ? (
                                <Select value={formData[field.label_vi] || ''} onValueChange={v => setFormData({ ...formData, [field.label_vi]: v })}>
                                  <SelectTrigger><SelectValue placeholder={field.placeholder_vi || 'Chọn...'} /></SelectTrigger>
                                  <SelectContent>
                                    {(field.options || []).map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : field.field_type === 'checkbox' ? (
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={!!formData[field.label_vi]}
                                    onCheckedChange={v => setFormData({ ...formData, [field.label_vi]: v })}
                                  />
                                  <span className="text-sm text-muted-foreground">{field.placeholder_vi || field.label_vi}</span>
                                </div>
                              ) : (
                                <Input
                                  type={field.field_type === 'email' ? 'email' : field.field_type === 'tel' ? 'tel' : field.field_type === 'number' ? 'number' : 'text'}
                                  value={formData[field.label_vi] || ''}
                                  onChange={e => setFormData({ ...formData, [field.label_vi]: e.target.value })}
                                  placeholder={field.placeholder_vi || ''}
                                  required={field.is_required}
                                />
                              )}
                            </div>
                          ))}
                          <Button type="submit" className="w-full mt-2" size="lg" disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            🚀 Đăng ký ngay
                          </Button>
                          <p className="text-[11px] text-center text-muted-foreground">🔒 Thông tin được bảo mật tuyệt đối</p>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EventDetailPage;

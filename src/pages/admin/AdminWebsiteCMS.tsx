import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import SectionPreview from '@/components/admin/SectionPreview';
import SectionEditorFields from '@/components/admin/SectionEditorFields';
import { 
  Layout, Image, Video, Eye, EyeOff, Save, Upload, Trash2, 
  Edit, Globe, FileText, DollarSign, RefreshCw, GripVertical,
  ImageIcon, Film, Link2, Monitor, SplitSquareHorizontal, MessageSquare, Bell
} from 'lucide-react';
import HomepageSectionOrder from '@/components/admin/HomepageSectionOrder';
import TestimonialsManager from '@/components/admin/TestimonialsManager';
import { Separator } from '@/components/ui/separator';
import {
  Facebook, Youtube, Instagram, Mail, Phone, MapPin, Globe as GlobeIcon2,
  Link as LinkIcon, Plus, X as XIcon, Footprints
} from 'lucide-react';


interface WebsiteContent {
  id: string;
  section_key: string;
  title: string | null;
  title_vi: string | null;
  subtitle: string | null;
  subtitle_vi: string | null;
  description: string | null;
  description_vi: string | null;
  content: Record<string, unknown>;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: string;
  title_vi: string;
  price: number;
  original_price: number | null;
  level: string;
  is_published: boolean;
}

const sectionLabels: Record<string, string> = {
  'hero': 'Trang chủ (Hero)',
  'skills': 'Kỹ năng',
  'languages': 'Ngôn ngữ',
  'teachers': 'Giảng viên',
  'zoom': 'Lớp học Meeting',
  'features': 'Tính năng',
  'blog': 'Tin tức & Bài viết (Blog)',
  'events': 'Sự kiện & Workshop',
  'testimonials': 'Đánh giá & Testimonials',
  'cta': 'Kêu gọi hành động',
  'pricing': 'Bảng giá',
  'about_hero': 'Giới thiệu - Hero',
  'about_story': 'Giới thiệu - Câu chuyện',
  'about_values': 'Giới thiệu - Giá trị',
  'about_3c_values': 'Giới thiệu - 3C Cốt lõi',
  'about_cta': 'Giới thiệu - CTA',
  'footer': 'Chân trang (Footer)',
};

const AdminWebsiteCMS = () => {
  const [sections, setSections] = useState<WebsiteContent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<WebsiteContent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [creatingTeachersSection, setCreatingTeachersSection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Footer editor state
  const [footerData, setFooterData] = useState<Record<string, any>>({
    brand_description: '',
    address: '',
    phone: '',
    email: '',
    website_domain: '',
    facebook_url: '',
    youtube_url: '',
    instagram_url: '',
    tiktok_url: '',
    zalo_url: '',
    copyright_text: '',
    custom_links_pages: [] as { label: string; url: string }[],
    custom_links_support: [] as { label: string; url: string }[],
  });
  const [footerRecordId, setFooterRecordId] = useState<string | null>(null);
  const [footerLoading, setFooterLoading] = useState(false);
  const [footerSaving, setFooterSaving] = useState(false);

  // Announcement Bar State
  const [announcementData, setAnnouncementData] = useState({
    enabled: true,
    text_vi: '🎉 Ưu đãi 20% Học phí JLPT N5-N1 - Đăng ký ngay hôm nay!',
    button_text_vi: 'Xem ưu đãi',
    button_url: '/khoa-hoc',
    bg_gradient: 'sakura',
  });
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  const saveAnnouncementBar = async () => {
    setAnnouncementSaving(true);
    try {
      const { data: existing } = await supabase
        .from('website_content')
        .select('id')
        .eq('section_key', 'announcement_bar')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('website_content')
          .update({ content: announcementData as any, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('website_content').insert({
          section_key: 'announcement_bar',
          title: 'Announcement Bar',
          content: announcementData as any,
          is_active: true,
        });
      }

      toast({ title: '✅ Đã lưu cấu hình Thanh thông báo!' });
    } catch (err: any) {
      toast({ title: 'Lỗi lưu thông báo', description: err.message, variant: 'destructive' });
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    title_vi: '',
    subtitle: '',
    subtitle_vi: '',
    description: '',
    description_vi: '',
    image_url: '',
    video_url: '',
    is_active: true,
    content: '{}'
  });

  const fetchSections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('website_content')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        content: (item.content || {}) as Record<string, unknown>
      }));
      
      setSections(typedData);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải nội dung website',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchCourses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title_vi, price, original_price, level, is_published');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }, []);

  useEffect(() => {
    fetchSections();
    fetchCourses();
    fetchFooter();
  }, [fetchSections, fetchCourses]);

  // Footer fetch
  const fetchFooter = async () => {
    setFooterLoading(true);
    try {
      const { data } = await supabase
        .from('website_content')
        .select('id, content')
        .eq('section_key', 'footer')
        .maybeSingle();

      if (data) {
        setFooterRecordId(data.id);
        const c = (data.content || {}) as Record<string, any>;
        setFooterData({
          brand_description: c.brand_description || '',
          address: c.address || '',
          phone: c.phone || '',
          email: c.email || '',
          website_domain: c.website_domain || '',
          facebook_url: c.facebook_url || '',
          youtube_url: c.youtube_url || '',
          instagram_url: c.instagram_url || '',
          tiktok_url: c.tiktok_url || '',
          zalo_url: c.zalo_url || '',
          copyright_text: c.copyright_text || '',
          custom_links_pages: Array.isArray(c.custom_links_pages) ? c.custom_links_pages : [],
          custom_links_support: Array.isArray(c.custom_links_support) ? c.custom_links_support : [],
        });
      }
    } catch (err) {
      console.error('Error fetching footer:', err);
    } finally {
      setFooterLoading(false);
    }
  };

  // Footer save
  const saveFooter = async () => {
    setFooterSaving(true);
    try {
      if (footerRecordId) {
        const { error } = await supabase
          .from('website_content')
          .update({ content: footerData as any, updated_at: new Date().toISOString() })
          .eq('id', footerRecordId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('website_content')
          .insert({
            section_key: 'footer',
            title_vi: 'Footer',
            is_active: true,
            order_index: 999,
            content: footerData as any,
          })
          .select('id')
          .single();
        if (error) throw error;
        if (data) setFooterRecordId(data.id);
      }
      toast({ title: '✅ Đã lưu Footer', description: 'Nội dung footer đã được cập nhật thành công.' });
    } catch (err) {
      console.error('Footer save error:', err);
      toast({ title: 'Lỗi', description: 'Không thể lưu footer', variant: 'destructive' });
    } finally {
      setFooterSaving(false);
    }
  };

  const updateFooterField = (key: string, value: any) => {
    setFooterData(prev => ({ ...prev, [key]: value }));
  };

  const createTeachersSection = async () => {
    setCreatingTeachersSection(true);
    try {
      const orderIndex = sections.length;
      const { error } = await supabase
        .from('website_content')
        .insert({
          section_key: 'teachers',
          title_vi: 'Đội ngũ giảng viên xuất sắc',
          subtitle_vi: 'Giảng viên',
          description_vi: 'Danh sách giáo viên được tuyển chọn để đồng hành cùng bạn',
          is_active: true,
          order_index: orderIndex,
          content: { teachers: [] },
        });

      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã tạo mục Giảng viên' });
      await fetchSections();
    } catch (error) {
      console.error('Error creating teachers section:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo mục Giảng viên',
        variant: 'destructive'
      });
    } finally {
      setCreatingTeachersSection(false);
    }
  };

  const openEditDialog = (section: WebsiteContent) => {
    setEditingSection(section);
    setFormData({
      title: section.title || '',
      title_vi: section.title_vi || '',
      subtitle: section.subtitle || '',
      subtitle_vi: section.subtitle_vi || '',
      description: section.description || '',
      description_vi: section.description_vi || '',
      image_url: section.image_url || '',
      video_url: section.video_url || '',
      is_active: section.is_active,
      content: JSON.stringify(section.content || {}, null, 2)
    });
    setIsDialogOpen(true);
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;

    setSaving(true);
    try {
      let parsedContent = {};
      try {
        parsedContent = JSON.parse(formData.content || '{}');
      } catch {
        parsedContent = {};
      }

      const { error } = await supabase
        .from('website_content')
        .update({
          title: formData.title || null,
          title_vi: formData.title_vi || null,
          subtitle: formData.subtitle || null,
          subtitle_vi: formData.subtitle_vi || null,
          description: formData.description || null,
          description_vi: formData.description_vi || null,
          image_url: formData.image_url || null,
          video_url: formData.video_url || null,
          is_active: formData.is_active,
          content: parsedContent
        })
        .eq('id', editingSection.id);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật nội dung section'
      });

      setIsDialogOpen(false);
      fetchSections();
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu nội dung',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('website-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('website-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));

      toast({
        title: 'Thành công',
        description: 'Đã upload ảnh thành công'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể upload ảnh',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'Lỗi',
        description: 'Video không được vượt quá 50MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('website-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('website-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, video_url: publicUrl }));

      toast({
        title: 'Thành công',
        description: 'Đã upload video thành công'
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể upload video',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleSectionActive = async (section: WebsiteContent) => {
    try {
      const { error } = await supabase
        .from('website_content')
        .update({ is_active: !section.is_active })
        .eq('id', section.id);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: section.is_active ? 'Đã ẩn section' : 'Đã hiển thị section'
      });

      fetchSections();
    } catch (error) {
      console.error('Error toggling section:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive'
      });
    }
  };

  const updateCoursePrice = async (courseId: string, price: number, originalPrice: number | null) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          price, 
          original_price: originalPrice 
        })
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật giá khóa học'
      });

      fetchCourses();
    } catch (error) {
      console.error('Error updating price:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật giá',
        variant: 'destructive'
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Generate preview data from current form
  const getPreviewData = () => {
    let parsedContent = {};
    try {
      parsedContent = JSON.parse(formData.content || '{}');
    } catch {
      parsedContent = {};
    }

    return {
      section_key: editingSection?.section_key || '',
      title: formData.title,
      title_vi: formData.title_vi,
      subtitle: formData.subtitle,
      subtitle_vi: formData.subtitle_vi,
      description: formData.description,
      description_vi: formData.description_vi,
      image_url: formData.image_url,
      content: parsedContent
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý Website</h1>
          <p className="text-muted-foreground mt-1">
            Chỉnh sửa nội dung các section trên trang chủ, giá khóa học và media
          </p>
        </div>
        <Button variant="outline" onClick={fetchSections}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>

      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="sections" className="gap-2">
            <Layout className="w-4 h-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="order" className="gap-2 font-bold text-primary">
            <GripVertical className="w-4 h-4" />
            Sắp xếp Trang chủ
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Bảng giá
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2">
            <Image className="w-4 h-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="announcement" className="gap-2 font-bold text-amber-500">
            <Bell className="w-4 h-4" />
            Thanh Thông Báo
          </TabsTrigger>
          <TabsTrigger value="footer" className="gap-2">
            <Footprints className="w-4 h-4" />
            Footer
          </TabsTrigger>
        </TabsList>

        {/* Order Tab */}
        <TabsContent value="order">
          <HomepageSectionOrder />
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Các section trên trang chủ
              </CardTitle>
              <CardDescription>
                Kéo thả để sắp xếp thứ tự, chỉnh sửa nội dung cho từng phần
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!sections.some((s) => s.section_key === 'teachers') && (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl border border-border bg-muted/40">
                    <div>
                      <p className="text-sm font-medium">Mục "Giảng viên" chưa tồn tại.</p>
                      <p className="text-xs text-muted-foreground">Tạo mục này để quản lý danh sách giảng viên hiển thị trên trang chủ.</p>
                    </div>
                    <Button
                      onClick={createTeachersSection}
                      disabled={creatingTeachersSection}
                    >
                      {creatingTeachersSection ? 'Đang tạo...' : 'Tạo mục Giảng viên'}
                    </Button>
                  </div>
                )}

                <div className="space-y-1">
                  {sections.map((section, index) => {
                  const isDragging = draggedIndex === index;
                  const isOver = dragOverIndex === index;
                  const isAbove = draggedIndex !== null && dragOverIndex !== null && draggedIndex > index && isOver;
                  const isBelow = draggedIndex !== null && dragOverIndex !== null && draggedIndex < index && isOver;

                  return (
                    <div key={section.id} className="relative">
                      {/* Drop indicator line - top */}
                      {isAbove && (
                        <div className="absolute -top-1 left-4 right-4 h-0.5 bg-primary rounded-full z-10 shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                      )}
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', index.toString());
                          setDraggedIndex(index);
                        }}
                        onDragEnd={() => {
                          setDraggedIndex(null);
                          setDragOverIndex(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverIndex(index);
                        }}
                        onDragLeave={() => {
                          if (dragOverIndex === index) setDragOverIndex(null);
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                          const toIndex = index;
                          setDraggedIndex(null);
                          setDragOverIndex(null);
                          if (fromIndex === toIndex) return;
                          
                          const newSections = [...sections];
                          const [moved] = newSections.splice(fromIndex, 1);
                          newSections.splice(toIndex, 0, moved);
                          setSections(newSections);

                          try {
                            await Promise.all(
                              newSections.map((s, i) =>
                                supabase.from('website_content').update({ order_index: i }).eq('id', s.id)
                              )
                            );
                            toast({ title: 'Thành công', description: 'Đã cập nhật thứ tự sections' });
                          } catch {
                            toast({ title: 'Lỗi', description: 'Không thể lưu thứ tự', variant: 'destructive' });
                            fetchSections();
                          }
                        }}
                        className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ease-out cursor-grab active:cursor-grabbing border-2 group
                          ${isDragging 
                            ? 'opacity-40 scale-[0.97] rotate-[0.5deg] border-primary/30 bg-primary/5 shadow-lg' 
                            : 'bg-card border-border hover:border-primary/20 hover:bg-muted/30 hover:shadow-md'
                          }
                          ${isOver && !isDragging ? 'border-primary/50 bg-primary/5 scale-[1.01]' : ''}
                        `}
                        style={{
                          transition: isDragging ? 'all 0.15s ease-out' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-md hover:bg-primary/10 transition-colors group-hover:text-primary text-muted-foreground">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-colors">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm">{sectionLabels[section.section_key] || section.section_key}</h3>
                              <Badge variant={section.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                {section.is_active ? 'Hiển thị' : 'Ẩn'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {section.title_vi || section.title || 'Chưa có tiêu đề'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {section.image_url && <ImageIcon className="w-4 h-4 text-green-500" />}
                          {section.video_url && <Film className="w-4 h-4 text-blue-500" />}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleSectionActive(section)}
                          >
                            {section.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => openEditDialog(section)}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Sửa
                          </Button>
                        </div>
                      </div>
                      {/* Drop indicator line - bottom */}
                      {isBelow && (
                        <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-primary rounded-full z-10 shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
                <GripVertical className="w-3.5 h-3.5" />
                Kéo thả để thay đổi thứ tự hiển thị các section trên trang chủ
              </p>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Bảng giá khóa học
              </CardTitle>
              <CardDescription>
                Điều chỉnh giá cho từng khóa học JLPT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khóa học</TableHead>
                    <TableHead>Cấp độ</TableHead>
                    <TableHead>Giá hiện tại</TableHead>
                    <TableHead>Giá gốc</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <CourseRow 
                      key={course.id} 
                      course={course} 
                      formatPrice={formatPrice}
                      onUpdatePrice={updateCoursePrice}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Media đã upload
              </CardTitle>
              <CardDescription>
                Quản lý ảnh và video trên website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.filter(s => s.image_url || s.video_url).map((section) => (
                  <Card key={section.id} className="overflow-hidden">
                    {section.image_url && (
                      <div className="aspect-video bg-muted">
                        <img 
                          src={section.image_url} 
                          alt={section.title_vi || section.section_key}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {section.video_url && !section.image_url && (
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <Video className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{sectionLabels[section.section_key]}</p>
                      <div className="flex gap-2 mt-2">
                        {section.image_url && (
                          <Badge variant="outline" className="text-xs">
                            <ImageIcon className="w-3 h-3 mr-1" />
                            Ảnh
                          </Badge>
                        )}
                        {section.video_url && (
                          <Badge variant="outline" className="text-xs">
                            <Film className="w-3 h-3 mr-1" />
                            Video
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {sections.filter(s => s.image_url || s.video_url).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Chưa có media nào được upload</p>
                  <p className="text-sm">Vào từng section để upload ảnh/video</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="testimonials" className="space-y-4">
          <TestimonialsManager />
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Footprints className="w-5 h-5" /> Chỉnh sửa Footer
                  </CardTitle>
                  <CardDescription>Tùy biến toàn bộ nội dung chân trang website</CardDescription>
                </div>
                <Button onClick={saveFooter} disabled={footerSaving} className="gap-2">
                  <Save className="w-4 h-4" />
                  {footerSaving ? 'Đang lưu...' : 'Lưu Footer'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {footerLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : (
                <>
                  {/* Brand Description */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                      <Layout className="w-4 h-4" /> Thương hiệu
                    </h3>
                    <div className="space-y-2">
                      <Label className="text-xs">Mô tả ngắn về thương hiệu</Label>
                      <Textarea
                        value={footerData.brand_description}
                        onChange={(e) => updateFooterField('brand_description', e.target.value)}
                        placeholder="Trung tâm đào tạo Tiếng Nhật hàng đầu..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Bản quyền (Copyright)</Label>
                      <Input
                        value={footerData.copyright_text}
                        onChange={(e) => updateFooterField('copyright_text', e.target.value)}
                        placeholder="© 2026 TNQDO. All rights reserved."
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Thông tin liên hệ
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Địa chỉ</Label>
                        <Input
                          value={footerData.address}
                          onChange={(e) => updateFooterField('address', e.target.value)}
                          placeholder="123 Nguyễn Huệ, Q.1, TP.HCM"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Số điện thoại</Label>
                        <Input
                          value={footerData.phone}
                          onChange={(e) => updateFooterField('phone', e.target.value)}
                          placeholder="1900 1234"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</Label>
                        <Input
                          value={footerData.email}
                          onChange={(e) => updateFooterField('email', e.target.value)}
                          placeholder="hello@tnqdo.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5"><GlobeIcon2 className="w-3.5 h-3.5" /> Website</Label>
                        <Input
                          value={footerData.website_domain}
                          onChange={(e) => updateFooterField('website_domain', e.target.value)}
                          placeholder="https://quangdungjp.com"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Social Links */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" /> Mạng xã hội
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5"><Facebook className="w-3.5 h-3.5 text-blue-600" /> Facebook</Label>
                        <Input
                          value={footerData.facebook_url}
                          onChange={(e) => updateFooterField('facebook_url', e.target.value)}
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5 text-red-600" /> YouTube</Label>
                        <Input
                          value={footerData.youtube_url}
                          onChange={(e) => updateFooterField('youtube_url', e.target.value)}
                          placeholder="https://youtube.com/@..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5 text-pink-600" /> Instagram</Label>
                        <Input
                          value={footerData.instagram_url}
                          onChange={(e) => updateFooterField('instagram_url', e.target.value)}
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">TikTok</Label>
                        <Input
                          value={footerData.tiktok_url}
                          onChange={(e) => updateFooterField('tiktok_url', e.target.value)}
                          placeholder="https://tiktok.com/@..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Zalo</Label>
                        <Input
                          value={footerData.zalo_url}
                          onChange={(e) => updateFooterField('zalo_url', e.target.value)}
                          placeholder="https://zalo.me/..."
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Custom Nav Links - Pages */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Cột "Trang" (tuỳ chỉnh link)
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-7 text-xs"
                        onClick={() => updateFooterField('custom_links_pages', [...(footerData.custom_links_pages || []), { label: '', url: '' }])}
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm link
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Mặc định: Giới thiệu, Khóa học, Giáo viên, Meeting, Blog. Thêm link tùy chỉnh bên dưới (sẽ hiện thêm sau danh sách mặc định).</p>
                    {(footerData.custom_links_pages || []).length > 0 && (
                      <div className="space-y-2">
                        {(footerData.custom_links_pages as { label: string; url: string }[]).map((link, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              placeholder="Tên hiển thị"
                              value={link.label}
                              onChange={(e) => {
                                const updated = [...footerData.custom_links_pages];
                                updated[idx] = { ...updated[idx], label: e.target.value };
                                updateFooterField('custom_links_pages', updated);
                              }}
                              className="flex-1"
                            />
                            <Input
                              placeholder="/duong-dan hoặc https://..."
                              value={link.url}
                              onChange={(e) => {
                                const updated = [...footerData.custom_links_pages];
                                updated[idx] = { ...updated[idx], url: e.target.value };
                                updateFooterField('custom_links_pages', updated);
                              }}
                              className="flex-1"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                const updated = footerData.custom_links_pages.filter((_: any, i: number) => i !== idx);
                                updateFooterField('custom_links_pages', updated);
                              }}
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Custom Nav Links - Support */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Cột "Hỗ trợ" (tuỳ chỉnh link)
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-7 text-xs"
                        onClick={() => updateFooterField('custom_links_support', [...(footerData.custom_links_support || []), { label: '', url: '' }])}
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm link
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Mặc định: Hỏi & Đáp, Liên hệ, Chính sách bảo mật, Điều khoản. Thêm link tùy chỉnh bên dưới.</p>
                    {(footerData.custom_links_support || []).length > 0 && (
                      <div className="space-y-2">
                        {(footerData.custom_links_support as { label: string; url: string }[]).map((link, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              placeholder="Tên hiển thị"
                              value={link.label}
                              onChange={(e) => {
                                const updated = [...footerData.custom_links_support];
                                updated[idx] = { ...updated[idx], label: e.target.value };
                                updateFooterField('custom_links_support', updated);
                              }}
                              className="flex-1"
                            />
                            <Input
                              placeholder="/duong-dan hoặc https://..."
                              value={link.url}
                              onChange={(e) => {
                                const updated = [...footerData.custom_links_support];
                                updated[idx] = { ...updated[idx], url: e.target.value };
                                updateFooterField('custom_links_support', updated);
                              }}
                              className="flex-1"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                const updated = footerData.custom_links_support.filter((_: any, i: number) => i !== idx);
                                updateFooterField('custom_links_support', updated);
                              }}
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Live Preview */}
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                      <Monitor className="w-4 h-4" /> Preview Footer
                    </h3>
                    <div className="bg-gray-900 text-white rounded-xl p-6 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                          <p className="font-bold text-base mb-2">TNQDO</p>
                          <p className="text-gray-400 text-xs leading-relaxed">{footerData.brand_description || 'Mô tả thương hiệu...'}</p>
                          <div className="flex gap-2 mt-3">
                            {footerData.facebook_url && <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"><Facebook className="w-3.5 h-3.5" /></div>}
                            {footerData.youtube_url && <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"><Youtube className="w-3.5 h-3.5" /></div>}
                            {footerData.instagram_url && <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"><Instagram className="w-3.5 h-3.5" /></div>}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold mb-2">Trang</p>
                          <ul className="space-y-1 text-gray-400 text-xs">
                            <li>Giới thiệu</li>
                            <li>Khóa học</li>
                            <li>Giáo viên</li>
                            <li>Meeting</li>
                            <li>Blog</li>
                            {(footerData.custom_links_pages || []).filter((l: any) => l.label).map((l: any, i: number) => <li key={i}>{l.label}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="font-bold mb-2">Hỗ trợ</p>
                          <ul className="space-y-1 text-gray-400 text-xs">
                            <li>Hỏi & Đáp</li>
                            <li>Liên hệ</li>
                            <li>Bảo mật</li>
                            <li>Điều khoản</li>
                            {(footerData.custom_links_support || []).filter((l: any) => l.label).map((l: any, i: number) => <li key={i}>{l.label}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="font-bold mb-2">Liên hệ</p>
                          <ul className="space-y-1.5 text-gray-400 text-xs">
                            {footerData.address && <li className="flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 shrink-0" />{footerData.address}</li>}
                            {footerData.phone && <li className="flex items-center gap-1.5"><Phone className="w-3 h-3 shrink-0" />{footerData.phone}</li>}
                            {footerData.email && <li className="flex items-center gap-1.5"><Mail className="w-3 h-3 shrink-0" />{footerData.email}</li>}
                            {footerData.website_domain && <li className="flex items-center gap-1.5"><GlobeIcon2 className="w-3 h-3 shrink-0" />{footerData.website_domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}</li>}
                          </ul>
                        </div>
                      </div>
                      <div className="border-t border-white/10 mt-4 pt-3 text-center text-gray-500 text-xs">
                        {footerData.copyright_text || '© 2026 TNQDO'}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcement Bar Tab */}
        <TabsContent value="announcement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                Cấu hình Thanh Thông Báo Khuyến Mãi (Announcement Bar)
              </CardTitle>
              <CardDescription>
                Thanh thông báo nổi bật nằm trên cùng trang web (trên Navbar)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                <div>
                  <p className="font-bold text-sm">Trạng thái Thanh thông báo:</p>
                  <p className="text-xs text-muted-foreground">Bật hoặc Tắt hiển thị trên đầu trang web</p>
                </div>
                <Switch
                  checked={announcementData.enabled}
                  onCheckedChange={(val) => setAnnouncementData(prev => ({ ...prev, enabled: val }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Nội dung thông báo (Tiếng Việt)</Label>
                <Input
                  value={announcementData.text_vi}
                  onChange={(e) => setAnnouncementData(prev => ({ ...prev, text_vi: e.target.value }))}
                  placeholder="VD: 🎉 Khuyến mãi 20% Học phí JLPT N5-N1!"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Tên nút bấm</Label>
                  <Input
                    value={announcementData.button_text_vi}
                    onChange={(e) => setAnnouncementData(prev => ({ ...prev, button_text_vi: e.target.value }))}
                    placeholder="VD: Xem ngay"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Đường dẫn nút bấm</Label>
                  <Input
                    value={announcementData.button_url}
                    onChange={(e) => setAnnouncementData(prev => ({ ...prev, button_url: e.target.value }))}
                    placeholder="VD: /khoa-hoc"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <Button onClick={saveAnnouncementBar} disabled={announcementSaving} className="font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                  <Save className="w-4 h-4" /> {announcementSaving ? 'Đang lưu...' : 'Lưu Thanh Thông Báo'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Section Dialog with Preview */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`${showPreview ? 'max-w-6xl' : 'max-w-3xl'} max-h-[90vh] overflow-hidden`}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Chỉnh sửa: {editingSection && sectionLabels[editingSection.section_key]}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="ml-4"
              >
                {showPreview ? (
                  <>
                    <Monitor className="w-4 h-4 mr-2" />
                    Ẩn Preview
                  </>
                ) : (
                  <>
                    <SplitSquareHorizontal className="w-4 h-4 mr-2" />
                    Hiện Preview
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>

          <div className={`grid ${showPreview ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
            {/* Form Section */}
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Titles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tiêu đề (English)</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Title in English"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tiêu đề (Tiếng Việt)</Label>
                    <Input
                      value={formData.title_vi}
                      onChange={(e) => setFormData(prev => ({ ...prev, title_vi: e.target.value }))}
                      placeholder="Tiêu đề tiếng Việt"
                    />
                  </div>
                </div>

                {/* Subtitles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phụ đề (English)</Label>
                    <Input
                      value={formData.subtitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="Subtitle in English"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phụ đề (Tiếng Việt)</Label>
                    <Input
                      value={formData.subtitle_vi}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitle_vi: e.target.value }))}
                      placeholder="Phụ đề tiếng Việt"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mô tả (English)</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description in English"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả (Tiếng Việt)</Label>
                    <Textarea
                      value={formData.description_vi}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_vi: e.target.value }))}
                      placeholder="Mô tả tiếng Việt"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Ảnh banner
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="URL ảnh hoặc upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Đang upload...' : 'Upload'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadImage}
                    />
                  </div>
                  {formData.image_url && (
                    <div className="mt-2 relative w-48 h-28 rounded-lg overflow-hidden border">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    Video (tối đa 50MB)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                      placeholder="URL video hoặc upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Đang upload...' : 'Upload'}
                    </Button>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleUploadVideo}
                    />
                  </div>
                  {formData.video_url && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Video className="w-5 h-5 text-primary" />
                      <span className="text-sm truncate flex-1">{formData.video_url}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6"
                        onClick={() => setFormData(prev => ({ ...prev, video_url: '' }))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Section-specific editor fields */}
                {editingSection && ['hero', 'teachers', 'cta'].includes(editingSection.section_key) ? (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Nội dung chi tiết
                    </Label>
                    <SectionEditorFields
                      sectionKey={editingSection.section_key}
                      content={(() => { try { return JSON.parse(formData.content || '{}'); } catch { return {}; } })()}
                      onChange={(newContent) => setFormData(prev => ({ ...prev, content: JSON.stringify(newContent, null, 2) }))}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Nội dung tùy chỉnh (JSON)
                    </Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder='{"key": "value"}'
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Định dạng JSON cho nội dung tùy chỉnh của section
                    </p>
                  </div>
                )}

                {/* Active Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Hiển thị trên website</Label>
                </div>
              </div>
            </ScrollArea>

            {/* Preview Section */}
            {showPreview && (
              <div className="border-l pl-6">
                <div className="mb-4">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    Preview trực tiếp
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Xem trước nội dung trước khi lưu
                  </p>
                </div>
                <ScrollArea className="h-[55vh]">
                  <div className="scale-90 origin-top-left">
                    <SectionPreview data={getPreviewData()} />
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveSection} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Course Price Row Component
interface CourseRowProps {
  course: Course;
  formatPrice: (price: number) => string;
  onUpdatePrice: (id: string, price: number, originalPrice: number | null) => void;
}

const CourseRow = ({ course, formatPrice, onUpdatePrice }: CourseRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(course.price.toString());
  const [originalPrice, setOriginalPrice] = useState(course.original_price?.toString() || '');

  const handleSave = () => {
    onUpdatePrice(
      course.id,
      parseInt(price) || 0,
      originalPrice ? parseInt(originalPrice) : null
    );
    setIsEditing(false);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{course.title_vi}</TableCell>
      <TableCell>
        <Badge variant="outline">{course.level}</Badge>
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-32"
          />
        ) : (
          <span className="font-semibold text-primary">{formatPrice(course.price)}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="number"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            className="w-32"
            placeholder="Không có"
          />
        ) : (
          course.original_price ? (
            <span className="line-through text-muted-foreground">{formatPrice(course.original_price)}</span>
          ) : '-'
        )}
      </TableCell>
      <TableCell>
        <Badge variant={course.is_published ? 'default' : 'secondary'}>
          {course.is_published ? 'Xuất bản' : 'Nháp'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {isEditing ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Hủy
            </Button>
            <Button size="sm" onClick={handleSave}>
              Lưu
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-1" />
            Sửa giá
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default AdminWebsiteCMS;

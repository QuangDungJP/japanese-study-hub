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
  ImageIcon, Film, Link2, Monitor, SplitSquareHorizontal, MessageSquare, Bell, Smartphone
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

export const PAGE_CATEGORIES = [
  { id: 'all', name: '📍 Tất cả các Trang', icon: 'Globe' },
  { id: 'home', name: '🏠 Trang Chủ', icon: 'Layout' },
  { id: 'about', name: '📖 Trang Giới Thiệu', icon: 'FileText' },
  { id: 'courses', name: '📚 Trang Khóa Học', icon: 'BookOpen' },
  { id: 'teachers', name: '👨‍🏫 Trang Giáo Viên', icon: 'Users' },
  { id: 'meeting', name: '💻 Trang Meeting Live', icon: 'Video' },
  { id: 'blog', name: '📰 Trang Blog & Bài Viết', icon: 'FileText' },
  { id: 'events', name: '🎉 Trang Sự Kiện', icon: 'Calendar' },
  { id: 'contact', name: '📞 Trang Liên Hệ', icon: 'Phone' },
  { id: 'seasonal', name: '🌸 Banner Theo Mùa / Lễ Tết', icon: 'Sparkles' },
];

const sectionLabels: Record<string, { label: string; page: string }> = {
  // Trang chủ
  'hero': { label: 'Trang chủ - Hero Banner Banner', page: 'home' },
  'skills': { label: 'Trang chủ - 4 Kỹ năng Cốt lõi', page: 'home' },
  'languages': { label: 'Trang chủ - Lộ trình JLPT', page: 'home' },
  'teachers': { label: 'Trang chủ - Đội ngũ Giảng viên', page: 'home' },
  'zoom': { label: 'Trang chủ - Lớp Meeting Online', page: 'home' },
  'features': { label: 'Trang chủ - Công nghệ & Tính năng', page: 'home' },
  'blog': { label: 'Trang chủ - Tin tức Blog', page: 'home' },
  'events': { label: 'Trang chủ - Sự kiện Workshop', page: 'home' },
  'testimonials': { label: 'Trang chủ - Đánh giá Học viên', page: 'home' },
  'cta': { label: 'Trang chủ - Banner Đăng ký CTA', page: 'home' },
  'pricing': { label: 'Trang chủ - Niêm yết Bảng giá', page: 'home' },
  'footer': { label: 'Chân trang (Footer)', page: 'home' },

  // Trang Giới Thiệu
  'about_hero': { label: 'Giới thiệu - Hero Header', page: 'about' },
  'about_story': { label: 'Giới thiệu - Câu chuyện Trung tâm', page: 'about' },
  'about_values': { label: 'Giới thiệu - Triết lý & Giá trị', page: 'about' },
  'about_3c_values': { label: 'Giới thiệu - Mô hình 3C Cốt lõi', page: 'about' },
  'about_cta': { label: 'Giới thiệu - Banner Đăng ký', page: 'about' },

  // Trang Khóa Học
  'courses_hero': { label: 'Khóa học - Hero Banner Header', page: 'courses' },
  'courses_banner': { label: 'Khóa học - Banner Lộ trình Chi tiết', page: 'courses' },
  'courses_discount': { label: 'Khóa học - Banner Ưu đãi Học phí', page: 'courses' },

  // Trang Giáo Viên
  'teachers_page_hero': { label: 'Giáo viên - Hero Header', page: 'teachers' },
  'teachers_recruitment': { label: 'Giáo viên - Banner Tuyển dụng', page: 'teachers' },

  // Trang Meeting Live
  'meeting_hero': { label: 'Meeting - Hero Banner Lớp Trực tuyến', page: 'meeting' },
  'meeting_guide': { label: 'Meeting - Hướng dẫn Tham gia Meet/Zoom', page: 'meeting' },

  // Trang Blog & Sự kiện
  'blog_hero': { label: 'Blog - Banner Header Tin tức', page: 'blog' },
  'events_hero': { label: 'Sự kiện - Banner Workshop', page: 'events' },

  // Trang Liên Hệ
  'contact_hero': { label: 'Liên hệ - Hero Header Banner', page: 'contact' },
  'contact_info': { label: 'Liên hệ - Địa chỉ & Văn phòng', page: 'contact' },

  // Banners Theo Mùa / Lễ Tết
  'seasonal_tet': { label: 'Lễ Tết - Banner Chúc Mừng Năm Mới', page: 'seasonal' },
  'seasonal_summer': { label: 'Lễ Tết - Banner Khuyến Mãi Mùa Hè', page: 'seasonal' },
  'seasonal_back_to_school': { label: 'Lễ Tết - Banner Mùa Tựu Trường', page: 'seasonal' },
  'seasonal_discount_2011': { label: 'Lễ Tết - Banner Tri Ân 20/11', page: 'seasonal' },
  'seasonal_christmas': { label: 'Lễ Tết - Banner Giáng Sinh & Năm Mới', page: 'seasonal' },
};

const getSectionInfo = (key: string) => {
  if (sectionLabels[key]) return sectionLabels[key];
  
  let page = 'home';
  if (key.startsWith('about_')) page = 'about';
  else if (key.startsWith('course') || key.startsWith('courses')) page = 'courses';
  else if (key.startsWith('teacher')) page = 'teachers';
  else if (key.startsWith('meeting')) page = 'meeting';
  else if (key.startsWith('blog')) page = 'blog';
  else if (key.startsWith('event')) page = 'events';
  else if (key.startsWith('contact')) page = 'contact';
  else if (key.startsWith('seasonal') || key.startsWith('tet') || key.startsWith('sale') || key.startsWith('promo')) page = 'seasonal';

  return {
    label: key.replace(/_/g, ' ').toUpperCase(),
    page
  };
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
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Custom section creation modal
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [newSectionData, setNewSectionData] = useState({
    section_key: '',
    title_vi: '',
    subtitle_vi: '',
    description_vi: '',
    image_url: '',
    page_category: 'home'
  });

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

  const handleCreateCustomSection = async () => {
    if (!newSectionData.section_key || !newSectionData.title_vi) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng nhập Mã Section và Tiêu đề', variant: 'destructive' });
      return;
    }

    const cleanKey = newSectionData.section_key.trim().toLowerCase().replace(/\s+/g, '_');

    try {
      const { error } = await supabase
        .from('website_content')
        .insert({
          section_key: cleanKey,
          title_vi: newSectionData.title_vi,
          subtitle_vi: newSectionData.subtitle_vi || null,
          description_vi: newSectionData.description_vi || null,
          image_url: newSectionData.image_url || null,
          is_active: true,
          order_index: sections.length,
          content: {},
        });

      if (error) throw error;

      toast({ title: '✅ Tạo Section thành công', description: `Đã thêm section mới "${cleanKey}"` });
      setIsCreateSectionOpen(false);
      setNewSectionData({ section_key: '', title_vi: '', subtitle_vi: '', description_vi: '', image_url: '', page_category: 'home' });
      await fetchSections();
    } catch (error: any) {
      console.error('Error creating section:', error);
      toast({ title: 'Lỗi', description: error.message || 'Không thể tạo section', variant: 'destructive' });
    }
  };

  const handleDeleteSection = async (section: WebsiteContent) => {
    const info = getSectionInfo(section.section_key);
    if (!confirm(`Bạn có chắc chắn muốn xóa section "${info.label || section.section_key}"?`)) return;

    try {
      const { error } = await supabase
        .from('website_content')
        .delete()
        .eq('id', section.id);

      if (error) throw error;

      toast({ title: 'Đã xóa', description: `Đã xóa section ${section.section_key}` });
      await fetchSections();
    } catch (error: any) {
      console.error('Error deleting section:', error);
      toast({ title: 'Lỗi', description: 'Không thể xóa section', variant: 'destructive' });
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
    } catch (error: any) {
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

  const handleQuickSectionImageUpload = async (section: WebsiteContent, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${section.section_key}_${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('website-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('website-assets')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('website_content')
        .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', section.id);

      if (updateError) throw updateError;

      toast({
        title: '✅ Cập nhật ảnh thành công',
        description: `Đã cập nhật ảnh bìa mới cho mục ${section.section_key}`
      });

      fetchSections();
    } catch (error: any) {
      console.error('Error uploading section cover:', error);
      toast({
        title: 'Lỗi upload ảnh',
        description: error.message || 'Không thể upload ảnh bìa',
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
        description: `Đã ${!section.is_active ? 'bật' : 'tắt'} hiển thị section`
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
        <TabsContent value="sections" className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/30 border shadow-xs">
            <div>
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Quản lý Section Từng Trang & Banner Theo Mùa
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chỉnh sửa toàn bộ nội dung, ảnh bìa của từng trang (Trang chủ, Giới thiệu, Khóa học, Meeting, Blog, Lễ Tết) tránh hardcode.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() => setIsCreateSectionOpen(true)}
                size="sm"
                className="font-bold gap-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
              >
                <Plus className="w-4 h-4" /> Tạo Section Mới
              </Button>
            </div>
          </div>

          {/* Page Category Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b scrollbar-none">
            {PAGE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = cat.id === 'all' 
                ? sections.length 
                : sections.filter(s => getSectionInfo(s.section_key).page === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span>{cat.name}</span>
                  <Badge 
                    variant={isSelected ? 'secondary' : 'outline'} 
                    className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-bold"
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Section Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sections
              .filter((section) => {
                if (selectedCategory === 'all') return true;
                const info = getSectionInfo(section.section_key);
                return info.page === selectedCategory;
              })
              .map((section) => {
                const info = getSectionInfo(section.section_key);
                const isCustom = !['hero', 'skills', 'languages', 'teachers', 'zoom', 'features', 'blog', 'events', 'testimonials', 'cta', 'pricing', 'footer', 'about_hero', 'about_story', 'about_values'].includes(section.section_key);

                return (
                  <Card key={section.id} className="overflow-hidden border-2 hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm hover:shadow-md">
                    <CardHeader className="p-4 bg-muted/20 border-b flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <CardTitle className="text-sm font-bold truncate">
                            {info.label}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                              {section.section_key}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] font-semibold">
                              {PAGE_CATEGORIES.find(c => c.id === info.page)?.name.split(' ')[1] || info.page}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={section.is_active}
                          onCheckedChange={() => toggleSectionActive(section)}
                          title={section.is_active ? "Đang hiển thị" : "Đang ẩn"}
                        />
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      {/* Media Banner Thumbnail Preview */}
                      <div className="relative h-36 sm:h-44 w-full rounded-xl bg-muted overflow-hidden border group shrink-0">
                        {section.image_url ? (
                          <img 
                            src={section.image_url} 
                            alt={section.title_vi || section.section_key}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/40 p-4 text-center">
                            <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                            <span className="text-xs font-medium">Chưa có ảnh bìa / banner</span>
                          </div>
                        )}

                        {/* Quick Image Upload Overlay Button */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 backdrop-blur-xs">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              const input = document.getElementById(`quick-upload-${section.id}`) as HTMLInputElement;
                              input?.click();
                            }}
                            disabled={uploading}
                            className="font-bold text-xs gap-1.5 shadow-lg"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {uploading ? 'Đang upload...' : '📷 Đổi Ảnh Bìa'}
                          </Button>
                        </div>
                        <input
                          id={`quick-upload-${section.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleQuickSectionImageUpload(section, e)}
                        />
                      </div>

                      {/* Text Details Snippet */}
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground line-clamp-1">
                          {section.title_vi || section.title || '(Chưa cài đặt tiêu đề)'}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {section.description_vi || section.description || 'Chưa có mô tả nội dung...'}
                        </p>
                      </div>

                      {/* Footer Card Action Buttons */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t mt-auto">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          {section.image_url && <span className="flex items-center text-emerald-600 font-semibold gap-1"><ImageIcon className="w-3 h-3" /> Có Banner</span>}
                          {section.video_url && <span className="flex items-center text-blue-600 font-semibold gap-1"><Film className="w-3 h-3" /> Có Video</span>}
                        </div>

                        <div className="flex items-center gap-1">
                          {isCustom && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteSection(section)}
                              title="Xóa Section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => openEditDialog(section)}
                            className="gap-1 font-bold text-xs h-8"
                          >
                            <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {sections.filter(s => selectedCategory === 'all' || getSectionInfo(s.section_key).page === selectedCategory).length === 0 && (
            <div className="text-center py-12 border rounded-2xl bg-muted/20 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-bold text-sm">Chưa có Section nào trong mục này</p>
              <p className="text-xs mt-1">Bấm nút "Tạo Section Mới" phía trên để thêm banner / nội dung cho trang này</p>
              <Button onClick={() => setIsCreateSectionOpen(true)} className="mt-4 font-bold text-xs gap-1.5">
                <Plus className="w-4 h-4" /> Tạo Section Mới Ngay
              </Button>
            </div>
          )}
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
                      <p className="font-medium text-sm">{getSectionInfo(section.section_key).label}</p>
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
                Chỉnh sửa: {editingSection && getSectionInfo(editingSection.section_key).label}
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

            {/* Preview Section with Live Device Switcher */}
            {showPreview && (
              <div className="border-l pl-6 flex flex-col h-[65vh]">
                <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <Label className="flex items-center gap-2 font-bold text-foreground">
                      <Eye className="w-4 h-4 text-primary" />
                      Preview Trực Tiếp
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Tự động cập nhật theo nội dung đang nhập
                    </p>
                  </div>

                  {/* Device Switcher Controls */}
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                    <Button
                      type="button"
                      size="sm"
                      variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                      onClick={() => setPreviewDevice('desktop')}
                      className="h-7 px-2 text-xs font-bold gap-1"
                      title="Desktop Mode"
                    >
                      <Monitor className="w-3.5 h-3.5" /> Desktop
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={previewDevice === 'tablet' ? 'default' : 'ghost'}
                      onClick={() => setPreviewDevice('tablet')}
                      className="h-7 px-2 text-xs font-bold gap-1"
                      title="Tablet (768px)"
                    >
                      <SplitSquareHorizontal className="w-3.5 h-3.5" /> Tablet
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                      onClick={() => setPreviewDevice('mobile')}
                      className="h-7 px-2 text-xs font-bold gap-1"
                      title="Mobile (375px)"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Mobile
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 rounded-xl border bg-muted/20 p-2">
                  {previewDevice === 'mobile' ? (
                    <div className="w-[350px] mx-auto my-3 border-[8px] border-gray-900 rounded-[36px] shadow-2xl bg-background overflow-hidden relative transition-all">
                      {/* Mobile Notch */}
                      <div className="w-24 h-4 bg-gray-900 mx-auto rounded-b-xl flex items-center justify-center mb-1">
                        <div className="w-8 h-1 bg-gray-700 rounded-full" />
                      </div>
                      <div className="p-2 overflow-x-hidden">
                        <SectionPreview data={getPreviewData()} />
                      </div>
                    </div>
                  ) : previewDevice === 'tablet' ? (
                    <div className="w-[580px] mx-auto my-3 border-6 border-gray-800 rounded-[24px] shadow-xl bg-background overflow-hidden p-2 transition-all">
                      <SectionPreview data={getPreviewData()} />
                    </div>
                  ) : (
                    <div className="w-full transition-all">
                      <SectionPreview data={getPreviewData()} />
                    </div>
                  )}
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

      {/* Create Custom Section Dialog */}
      <Dialog open={isCreateSectionOpen} onOpenChange={setIsCreateSectionOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Tạo Section / Banner Mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-bold text-xs">Mã Định Danh (Section Key - không dấu, gạch dưới)</Label>
              <Input
                placeholder="VD: seasonal_tet_2026 hoặc courses_summer_sale"
                value={newSectionData.section_key}
                onChange={(e) => setNewSectionData(prev => ({ ...prev, section_key: e.target.value }))}
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">Mã unique dùng để lập trình hoặc truy xuất trên giao diện website</p>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs">Tiêu đề (Tiếng Việt)</Label>
              <Input
                placeholder="VD: Chương trình Ưu đãi Tết 2026"
                value={newSectionData.title_vi}
                onChange={(e) => setNewSectionData(prev => ({ ...prev, title_vi: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-bold text-xs">Phụ đề (Tagline)</Label>
                <Input
                  placeholder="VD: Giảm ngay 30% học phí"
                  value={newSectionData.subtitle_vi}
                  onChange={(e) => setNewSectionData(prev => ({ ...prev, subtitle_vi: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs">Trang Áp Dụng (Phân loại)</Label>
                <select
                  value={newSectionData.page_category}
                  onChange={(e) => setNewSectionData(prev => ({ ...prev, page_category: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-bold"
                >
                  {PAGE_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs">Mô tả nội dung</Label>
              <Textarea
                placeholder="Mô tả chi tiết chương trình khuyến mãi hoặc section..."
                value={newSectionData.description_vi}
                onChange={(e) => setNewSectionData(prev => ({ ...prev, description_vi: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs">URL Ảnh bìa / Banner</Label>
              <Input
                placeholder="https://... hoặc paste đường dẫn ảnh"
                value={newSectionData.image_url}
                onChange={(e) => setNewSectionData(prev => ({ ...prev, image_url: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateSectionOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateCustomSection} className="font-bold gap-1 bg-primary">
              <Save className="w-4 h-4" /> Tạo Section
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

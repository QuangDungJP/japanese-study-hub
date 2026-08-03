import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  BookOpen, Folder, FolderOpen, GripVertical, ArrowUp, ArrowDown, MoveRight,
  Plus, Upload, FileText, ChevronDown, ChevronRight, Play, ExternalLink,
  BookMarked, Sparkles, Clock, Calendar, Trash2, Edit3, Link2, FileType2, Presentation,
  MoreVertical, Search, CheckCircle2, Layers, Filter, Eye, Maximize2, Layers3,
  BarChart3, ListOrdered, CheckSquare, Sparkle, RefreshCw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { InlineLessonPresentation } from './InlineLessonPresentation';
import MediaUploader from '@/components/shared/MediaUploader';

export interface LessonItem {
  id: string;
  title: string;
  title_vi?: string | null;
  description?: string | null;
  skill?: string;
  level?: string;
  duration_minutes?: number;
  is_published?: boolean;
  session_id?: string | null;
  session_number?: number | null;
  week_number?: number | null;
  topic_group?: string | null;
  category?: string | null; // 'curriculum' | 'session' | 'week' | etc.
  order_index?: number;
  created_at?: string;
  type: 'lesson' | 'material';
  file_url?: string;
  file_type?: string;
  slide_url?: string;
  document_url?: string;
  content_html?: string;
}

export interface SessionItem {
  id: string;
  class_id: string;
  session_date: string;
  start_time: string;
  end_time?: string | null;
  topic?: string | null;
  notes?: string | null;
  week_number?: number | null;
  order_index?: number;
}

interface Props {
  classId: string;
  className?: string;
  isTeacher?: boolean;
  onRefreshNeeded?: () => void;
}

export const ClassLessonOrganizer = ({ classId, className, isTeacher = false, onRefreshNeeded }: Props) => {
  const { user, isTeacherOrAbove, isAdmin } = useAuth();
  const { toast } = useToast();

  const effectiveIsTeacher = isTeacher || !!isTeacherOrAbove || !!isAdmin;

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [items, setItems] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [viewGroupMode, setViewGroupMode] = useState<'session' | 'week' | 'overview'>('session');

  // Drag and Drop state
  const [draggedItem, setDraggedItem] = useState<LessonItem | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Collapsible state for folders
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    curriculum: true,
    unassigned: true,
  });

  // Inline Slide Presentation state
  const [activePresentation, setActivePresentation] = useState<{ title: string; url: string; type?: string } | null>(null);

  // Quick Session Topic Edit Dialog
  const [editSessionTopic, setEditSessionTopic] = useState<{ id: string; topic: string; weekNum?: number } | null>(null);

  // Create material dialog
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [materialMode, setMaterialMode] = useState<'file' | 'url'>('file');
  const [targetFolderId, setTargetFolderId] = useState<string>('curriculum');
  const [materialForm, setMaterialForm] = useState({ title: '', link_url: '', category: 'giáo_trình' });
  const [uploading, setUploading] = useState(false);

  // Delete material confirmation state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<LessonItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Deep Lesson / Material Edit state
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [editLessonForm, setEditLessonForm] = useState<{
    title_vi: string;
    description: string;
    skill: string;
    level: string;
    duration_minutes: number;
    slide_url: string;
    document_url: string;
    video_url: string;
    xp_reward: number;
  }>({
    title_vi: '',
    description: '',
    skill: 'reading',
    level: 'N4',
    duration_minutes: 15,
    slide_url: '',
    document_url: '',
    video_url: '',
    xp_reward: 10,
  });

  const openEditLessonModal = (item: LessonItem) => {
    setEditingLesson(item);
    setEditLessonForm({
      title_vi: item.title_vi || item.title || '',
      description: item.description || '',
      skill: item.skill || 'reading',
      level: item.level || 'N4',
      duration_minutes: item.duration_minutes || 15,
      slide_url: item.slide_url || item.document_url || item.file_url || '',
      document_url: item.document_url || item.slide_url || item.file_url || '',
      video_url: item.file_url || '',
      xp_reward: 10,
    });
  };

  const handleSaveLessonEdit = async () => {
    if (!editingLesson || !editLessonForm) return;
    try {
      const sb: any = supabase;
      if (editingLesson.type === 'material') {
        const { error } = await sb.from('lesson_materials').update({
          title: editLessonForm.title_vi,
          description: editLessonForm.description,
          file_url: editLessonForm.slide_url || editLessonForm.document_url || editingLesson.file_url,
        }).eq('id', editingLesson.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('lessons').update({
          title: editLessonForm.title_vi,
          title_vi: editLessonForm.title_vi,
          description: editLessonForm.description,
          description_vi: editLessonForm.description,
          skill: editLessonForm.skill,
          level: editLessonForm.level,
          duration_minutes: Number(editLessonForm.duration_minutes) || 15,
          slide_url: editLessonForm.slide_url || null,
          document_url: editLessonForm.document_url || editLessonForm.slide_url || null,
          video_url: editLessonForm.video_url || null,
          xp_reward: Number(editLessonForm.xp_reward) || 10,
        }).eq('id', editingLesson.id);
        if (error) throw error;
      }

      toast({ title: '✅ Đã cập nhật bài học thành công!' });
      setEditingLesson(null);
      loadData();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (e: any) {
      console.error('Error updating lesson:', e);
      toast({ title: 'Lỗi cập nhật bài học', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    setDeleting(true);
    try {
      const sb: any = supabase;
      if (deleteConfirmItem.type === 'material') {
        const { error } = await sb.from('lesson_materials').delete().eq('id', deleteConfirmItem.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('lessons').delete().eq('id', deleteConfirmItem.id);
        if (error) throw error;
      }
      toast({ title: '✅ Đã xóa tài liệu / bài học thành công!' });
      setItems((prev) => prev.filter((i) => i.id !== deleteConfirmItem.id));
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (e: any) {
      console.error('Error deleting item:', e);
      toast({ title: 'Lỗi khi xóa tài liệu', description: e.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteConfirmItem(null);
    }
  };

  useEffect(() => {
    if (classId) {
      loadData();
    }
  }, [classId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const sb: any = supabase;
      const [{ data: sData }, { data: lData }, { data: mData }] = await Promise.all([
        sb.from('class_sessions').select('*').eq('class_id', classId).order('session_date', { ascending: true }),
        sb.from('lessons').select('*').eq('class_id', classId).order('order_index', { ascending: true }),
        sb.from('lesson_materials').select('*').eq('class_id', classId).order('order_index', { ascending: true }),
      ]);

      setSessions((sData || []) as SessionItem[]);

      // Map lessons to unified items
      const lessonItems: LessonItem[] = (lData || []).map((l: any) => ({
        id: l.id,
        title: l.title_vi || l.title || 'Bài học',
        title_vi: l.title_vi,
        description: l.description_vi || l.description,
        skill: l.skill,
        level: l.level,
        duration_minutes: l.duration_minutes,
        is_published: l.is_published,
        session_id: l.session_id,
        session_number: l.session_number,
        week_number: l.week_number,
        topic_group: l.topic_group,
        category: l.category || (l.session_id ? 'session' : 'unassigned'),
        order_index: l.order_index ?? 0,
        created_at: l.created_at,
        type: 'lesson',
        file_url: l.video_url || l.thumbnail_url,
        slide_url: l.slide_url || l.document_url,
        document_url: l.document_url,
        content_html: l.content_html,
      }));

      // Map materials to unified items
      const materialItems: LessonItem[] = (mData || []).map((m: any) => ({
        id: m.id,
        title: m.title || 'Tài liệu',
        description: m.description,
        session_id: m.session_id || null,
        week_number: m.week_number || null,
        category: m.description === 'giáo_trình' || m.description?.toLowerCase().includes('giáo trình') ? 'curriculum' : (m.session_id ? 'session' : 'curriculum'),
        order_index: m.order_index ?? 0,
        created_at: m.created_at,
        type: 'material',
        file_url: m.file_url,
        file_type: m.file_type,
        slide_url: m.file_url,
      }));

      const combined = [...lessonItems, ...materialItems].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      setItems(combined);

      // Auto expand folder states
      setOpenFolders((prev) => {
        const next = { ...prev };
        (sData || []).forEach((s: any, idx: number) => {
          if (next[`session_${s.id}`] === undefined) next[`session_${s.id}`] = true;
          const weekNum = s.week_number || Math.ceil((idx + 1) / 2);
          if (next[`week_${weekNum}`] === undefined) next[`week_${weekNum}`] = true;
        });
        return next;
      });
    } catch (e: any) {
      console.error('Error loading class organizer data:', e);
      toast({ title: 'Lỗi tải danh sách bài học', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Filter items by search & skill
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedSkill !== 'all' && item.skill && item.skill !== selectedSkill) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.level && item.level.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery, selectedSkill]);

  // Group items by Folder ID (by Session OR by Week)
  const groupedData = useMemo(() => {
    if (viewGroupMode === 'week') {
      // Grouping by WEEK (Tuần 1, Tuần 2, Tuần 3...)
      const map: Record<string, { title: string; subtitle: string; items: LessonItem[]; weekNum: number }> = {
        curriculum: { title: '📚 Giáo trình học & Sách Ebook', subtitle: 'Lộ trình và sách học toàn khóa', items: [], weekNum: 0 },
        unassigned: { title: '📌 Bài học chưa phân tuần', subtitle: 'Các tài nguyên tự do', items: [], weekNum: 999 },
      };

      // Collect weeks from sessions
      const weekMap: Record<number, { sessionTopics: string[]; dates: string[] }> = {};
      sessions.forEach((s, idx) => {
        const wNum = s.week_number || Math.ceil((idx + 1) / 2);
        if (!weekMap[wNum]) weekMap[wNum] = { sessionTopics: [], dates: [] };
        if (s.topic) weekMap[wNum].sessionTopics.push(s.topic);
        if (s.session_date) weekMap[wNum].dates.push(format(parseISO(s.session_date), 'dd/MM'));
      });

      // Find max week or default 4 weeks
      const maxWeek = Math.max(4, ...Object.keys(weekMap).map(Number));
      for (let w = 1; w <= maxWeek; w++) {
        const info = weekMap[w];
        const topicStr = info?.sessionTopics.length ? info.sessionTopics.join(' + ') : 'Chủ đề bài học';
        const dateStr = info?.dates.length ? ` (${info.dates.join(' - ')})` : '';
        map[`week_${w}`] = {
          title: `Tuần ${w}: ${topicStr}`,
          subtitle: `Lịch học tuần ${w}${dateStr}`,
          items: [],
          weekNum: w,
        };
      }

      filteredItems.forEach((item) => {
        if (item.category === 'curriculum') {
          map.curriculum.items.push(item);
        } else if (item.session_id) {
          const s = sessions.find((x) => x.id === item.session_id);
          const sIdx = sessions.findIndex((x) => x.id === item.session_id);
          const wNum = item.week_number || (s?.week_number || (sIdx >= 0 ? Math.ceil((sIdx + 1) / 2) : 1));
          if (map[`week_${wNum}`]) {
            map[`week_${wNum}`].items.push(item);
          } else {
            map.unassigned.items.push(item);
          }
        } else if (item.week_number && map[`week_${item.week_number}`]) {
          map[`week_${item.week_number}`].items.push(item);
        } else {
          map.unassigned.items.push(item);
        }
      });

      return map;
    } else {
      // Grouping by SESSION (Buổi 1, Buổi 2, Buổi 3...)
      const map: Record<string, { title: string; subtitle: string; items: LessonItem[]; sessionObj?: SessionItem }> = {
        curriculum: { title: '📚 Giáo trình học & Sách Ebook', subtitle: 'Lộ trình và sách học toàn khóa', items: [] },
        unassigned: { title: '📌 Bài học chưa phân buổi', subtitle: 'Bài học tự do hoặc đang xếp lịch', items: [] },
      };

      sessions.forEach((s, idx) => {
        const sDateStr = s.session_date ? format(parseISO(s.session_date), 'dd/MM/yyyy') : '';
        map[`session_${s.id}`] = {
          title: `Buổi ${idx + 1}: ${s.topic || 'Bài học trên lớp'}`,
          subtitle: `${sDateStr} ${s.start_time ? `• ${s.start_time}` : ''}`,
          items: [],
          sessionObj: s,
        };
      });

      filteredItems.forEach((item) => {
        if (item.category === 'curriculum') {
          map.curriculum.items.push(item);
        } else if (item.session_id && map[`session_${item.session_id}`]) {
          map[`session_${item.session_id}`].items.push(item);
        } else {
          map.unassigned.items.push(item);
        }
      });

      return map;
    }
  }, [filteredItems, sessions, viewGroupMode]);

  // Handle Drag and Drop
  const handleDragStart = (e: React.DragEvent, item: LessonItem) => {
    if (!isTeacher) return;
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverFolder = (e: React.DragEvent, folderId: string) => {
    if (!isTeacher || !draggedItem) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeaveFolder = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnFolder = async (e: React.DragEvent, targetFolderId: string) => {
    if (!isTeacher || !draggedItem) return;
    e.preventDefault();
    setDragOverFolderId(null);

    const itemToMove = draggedItem;
    setDraggedItem(null);

    await moveItemToFolder(itemToMove, targetFolderId);
  };

  // Logic to move item to a target folder
  const moveItemToFolder = async (item: LessonItem, targetFolderId: string) => {
    try {
      const targetItems = groupedData[targetFolderId]?.items || [];
      const newOrderIndex = targetItems.length + 1;

      let newSessionId: string | null = null;
      let newWeekNumber: number | null = null;
      let newCategory: string = 'session';

      if (targetFolderId === 'curriculum') {
        newCategory = 'curriculum';
        newSessionId = null;
        newWeekNumber = null;
      } else if (targetFolderId.startsWith('session_')) {
        newSessionId = targetFolderId.replace('session_', '');
        newCategory = 'session';
        const s = sessions.find((x) => x.id === newSessionId);
        if (s?.week_number) newWeekNumber = s.week_number;
      } else if (targetFolderId.startsWith('week_')) {
        newWeekNumber = parseInt(targetFolderId.replace('week_', ''), 10);
        newCategory = 'week';
        const sInWeek = sessions.find((x, idx) => (x.week_number || Math.ceil((idx + 1) / 2)) === newWeekNumber);
        if (sInWeek) newSessionId = sInWeek.id;
      } else {
        newCategory = 'unassigned';
        newSessionId = null;
        newWeekNumber = null;
      }

      // Optimistic update state
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, session_id: newSessionId, week_number: newWeekNumber, category: newCategory, order_index: newOrderIndex }
            : it
        )
      );

      // Persist to Supabase DB
      const sb: any = supabase;
      if (item.type === 'lesson') {
        const { error } = await sb
          .from('lessons')
          .update({
            session_id: newSessionId,
            week_number: newWeekNumber,
            category: newCategory,
            order_index: newOrderIndex,
          })
          .eq('id', item.id);

        if (error) throw error;
      } else {
        const { error } = await sb
          .from('lesson_materials')
          .update({
            session_id: newSessionId,
            week_number: newWeekNumber,
            description: targetFolderId === 'curriculum' ? 'giáo_trình' : (newSessionId ? `buổi_${newSessionId}` : 'tài_liệu'),
            order_index: newOrderIndex,
          })
          .eq('id', item.id);

        if (error) throw error;
      }

      const folderTitle = groupedData[targetFolderId]?.title || targetFolderId;
      toast({
        title: 'Đã di chuyển bài học',
        description: `Bài "${item.title}" đã được xếp vào [${folderTitle}].`,
      });

      if (onRefreshNeeded) onRefreshNeeded();
    } catch (e: any) {
      console.error('Error moving item:', e);
      toast({ title: 'Lỗi di chuyển', description: e.message, variant: 'destructive' });
      loadData();
    }
  };

  // Logic to reorder item up/down within same list
  const moveItemUpDown = async (item: LessonItem, folderId: string, direction: -1 | 1) => {
    const list = [...(groupedData[folderId]?.items || [])];
    const index = list.findIndex((i) => i.id === item.id);
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= list.length) return;

    const otherItem = list[newIndex];
    const orderA = item.order_index ?? index + 1;
    const orderB = otherItem.order_index ?? newIndex + 1;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id === item.id) return { ...it, order_index: orderB };
        if (it.id === otherItem.id) return { ...it, order_index: orderA };
        return it;
      })
    );

    try {
      const sb: any = supabase;
      const tableA = item.type === 'lesson' ? 'lessons' : 'lesson_materials';
      const tableB = otherItem.type === 'lesson' ? 'lessons' : 'lesson_materials';

      await Promise.all([
        sb.from(tableA).update({ order_index: orderB }).eq('id', item.id),
        sb.from(tableB).update({ order_index: orderA }).eq('id', otherItem.id),
      ]);

      toast({ title: 'Đã cập nhật vị trí thứ tự bài học' });
    } catch (e: any) {
      toast({ title: 'Lỗi sắp xếp', description: e.message, variant: 'destructive' });
      loadData();
    }
  };

  // Save session topic edit
  const handleSaveSessionTopic = async () => {
    if (!editSessionTopic) return;
    try {
      const { error } = await supabase
        .from('class_sessions')
        .update({
          topic: editSessionTopic.topic,
          week_number: editSessionTopic.weekNum || null,
        })
        .eq('id', editSessionTopic.id);

      if (error) throw error;

      toast({ title: 'Đã lưu tên chủ đề Buổi / Tuần học' });
      setEditSessionTopic(null);
      loadData();
    } catch (e: any) {
      toast({ title: 'Lỗi lưu chủ đề', description: e.message, variant: 'destructive' });
    }
  };

  // Upload document / material directly to target folder
  const handleUploadMaterial = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'file').toLowerCase();
      // Sanitize filename to avoid invalid key errors in storage
      const safeFileName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `curriculum/${classId}/${Date.now()}_${safeFileName}`;
      const { error: upErr } = await supabase.storage.from('lesson-assets').upload(path, file);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('lesson-assets').getPublicUrl(path);

      let targetSessionId: string | null = null;
      let targetWeekNum: number | null = null;

      if (targetFolderId.startsWith('session_')) {
        targetSessionId = targetFolderId.replace('session_', '');
      } else if (targetFolderId.startsWith('week_')) {
        targetWeekNum = parseInt(targetFolderId.replace('week_', ''), 10);
      }

      const { error: dbErr } = await (supabase as any).from('lesson_materials').insert({
        teacher_id: user.id,
        class_id: classId,
        session_id: targetSessionId,
        week_number: targetWeekNum,
        title: materialForm.title.trim() || file.name,
        description: targetFolderId === 'curriculum' ? 'giáo_trình' : (targetSessionId ? `buổi_${targetSessionId}` : 'tài_liệu'),
        file_url: publicUrl,
        file_type: ext,
        file_size: file.size,
        order_index: (groupedData[targetFolderId]?.items.length || 0) + 1,
      });

      if (dbErr) throw dbErr;

      toast({ title: 'Đã thêm tài liệu / slide', description: file.name });
      setMaterialDialogOpen(false);
      setMaterialForm({ title: '', link_url: '', category: 'giáo_trình' });
      loadData();
    } catch (e: any) {
      toast({ title: 'Lỗi tải file', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrlMaterial = async () => {
    if (!user || !materialForm.link_url.trim()) {
      toast({ title: 'Vui lòng nhập URL trình chiếu', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      let targetSessionId: string | null = null;
      let targetWeekNum: number | null = null;

      if (targetFolderId.startsWith('session_')) {
        targetSessionId = targetFolderId.replace('session_', '');
      } else if (targetFolderId.startsWith('week_')) {
        targetWeekNum = parseInt(targetFolderId.replace('week_', ''), 10);
      }

      const rawUrl = materialForm.link_url.trim();
      let detectedType = 'slide';
      if (rawUrl.toLowerCase().includes('.pdf')) detectedType = 'pdf';
      else if (rawUrl.includes('canva.com') || rawUrl.includes('google.com/presentation') || rawUrl.toLowerCase().includes('.ppt')) detectedType = 'slide';
      else detectedType = 'link';

      const { error: dbErr } = await (supabase as any).from('lesson_materials').insert({
        teacher_id: user.id,
        class_id: classId,
        session_id: targetSessionId,
        week_number: targetWeekNum,
        title: materialForm.title.trim() || 'URL Trình chiếu / Slide',
        description: targetFolderId === 'curriculum' ? 'giáo_trình' : (targetSessionId ? `buổi_${targetSessionId}` : 'tài_liệu'),
        file_url: rawUrl,
        file_type: detectedType,
        order_index: (groupedData[targetFolderId]?.items.length || 0) + 1,
      });

      if (dbErr) throw dbErr;

      toast({ title: 'Đã thêm URL trình chiếu', description: materialForm.title || rawUrl });
      setMaterialDialogOpen(false);
      setMaterialForm({ title: '', link_url: '', category: 'giáo_trình' });
      loadData();
    } catch (e: any) {
      toast({ title: 'Lỗi thêm URL trình chiếu', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const setAllFoldersOpen = (isOpen: boolean) => {
    const next: Record<string, boolean> = {};
    Object.keys(groupedData).forEach((key) => {
      next[key] = isOpen;
    });
    setOpenFolders(next);
  };

  const formatDatePosted = (dateIso?: string) => {
    if (!dateIso) return 'Đã đăng gần đây';
    try {
      return `Đã đăng vào ${format(parseISO(dateIso), 'dd', { locale: vi })} thg ${format(parseISO(dateIso), 'M', { locale: vi })}`;
    } catch (e) {
      return 'Đã đăng gần đây';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-muted-foreground">Đang tải danh sách bài học & giáo trình theo buổi...</p>
      </div>
    );
  }

  const folderKeys = Object.keys(groupedData).filter((k) => {
    if (k === 'unassigned' && groupedData.unassigned.items.length === 0 && !isTeacher) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-gradient-to-r from-card via-card/90 to-primary/5 p-4 sm:p-5 rounded-2xl border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <Layers3 className="w-6 h-6 text-primary" />
                Giáo trình & Bài học theo Buổi / Tuần
              </h2>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold">
                {items.length} tài nguyên
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Phân loại bài học, slide trình chiếu và tài liệu theo Buổi học & Tuần học trực quan như Google Classroom.
            </p>
          </div>

          {/* Group View Toggle (Theo Buổi vs Theo Tuần vs Tổng Quan Lộ Trình) */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/60 p-1.5 rounded-xl border flex-wrap">
            <Button
              size="sm"
              variant={viewGroupMode === 'session' ? 'default' : 'ghost'}
              onClick={() => setViewGroupMode('session')}
              className="h-8 text-xs font-semibold rounded-lg"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Theo Buổi học
            </Button>
            <Button
              size="sm"
              variant={viewGroupMode === 'week' ? 'default' : 'ghost'}
              onClick={() => setViewGroupMode('week')}
              className="h-8 text-xs font-semibold rounded-lg"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" /> Theo Tuần / Chủ đề
            </Button>
            <Button
              size="sm"
              variant={viewGroupMode === 'overview' ? 'default' : 'ghost'}
              onClick={() => setViewGroupMode('overview')}
              className="h-8 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Tổng Quan & Xếp Thứ Tự
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        {viewGroupMode !== 'overview' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài học, slide, tài liệu..."
                className="pl-9 h-9 text-xs bg-background"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger className="h-9 text-xs w-full sm:w-[150px] bg-background">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Tất cả kỹ năng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kỹ năng</SelectItem>
                  <SelectItem value="reading">📖 Đọc hiểu</SelectItem>
                  <SelectItem value="listening">🎧 Nghe hiểu</SelectItem>
                  <SelectItem value="vocabulary">📚 Từ vựng</SelectItem>
                  <SelectItem value="grammar">📝 Ngữ pháp</SelectItem>
                  <SelectItem value="speaking">🗣️ Nói / Hội thoại</SelectItem>
                  <SelectItem value="writing">✍️ Luyện viết</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAllFoldersOpen(true)}
                  className="h-9 text-[11px] px-2.5 bg-background"
                  title="Mở tất cả các danh mục"
                >
                  Mở tất cả
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAllFoldersOpen(false)}
                  className="h-9 text-[11px] px-2.5 bg-background"
                  title="Thu gọn tất cả các danh mục"
                >
                  Thu gọn
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODE 3: TỔNG QUAN LỘ TRÌNH & XẾP THỨ TỰ (OVERVIEW MATRIX) */}
      {viewGroupMode === 'overview' ? (
        <div className="space-y-6">
          {/* Summary Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Tổng số Buổi học</p>
                  <p className="text-xl font-extrabold text-blue-700 dark:text-blue-400">{sessions.length} buổi</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Tổng số Tuần học</p>
                  <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
                    {Math.max(4, Math.ceil(sessions.length / 2))} tuần
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-500/10 border-purple-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Tổng Bài học & Slide</p>
                  <p className="text-xl font-extrabold text-purple-700 dark:text-purple-400">{items.length} bài</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Thứ tự tùy chỉnh</p>
                  <p className="text-xl font-extrabold text-amber-700 dark:text-amber-400">Đã kích hoạt ✨</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overview List with Reordering Controls */}
          <Card className="border-border shadow-soft">
            <CardHeader className="border-b bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-primary" />
                  Ma Trận Lộ Trình & Sắp Xếp Thứ Tự Chi Tiết
                </CardTitle>
                <Button size="sm" variant="outline" onClick={loadData} className="text-xs gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Làm mới dữ liệu
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {sessions.map((s, idx) => {
                const sItems = items.filter((it) => it.session_id === s.id);
                const weekNum = s.week_number || Math.ceil((idx + 1) / 2);

                return (
                  <div key={s.id} className="p-3.5 rounded-xl border bg-card space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-3 flex-wrap bg-muted/30 p-2.5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600 text-white font-bold text-xs">
                          Buổi {idx + 1}
                        </Badge>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs">
                          Tuần {weekNum}
                        </Badge>
                        <span className="font-bold text-sm text-foreground">{s.topic || 'Bài học trên lớp'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{s.session_date ? format(parseISO(s.session_date), 'dd/MM/yyyy') : ''}</span>
                        {isTeacher && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-primary font-medium"
                            onClick={() => setEditSessionTopic({ id: s.id, topic: s.topic || '', weekNum })}
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" /> Sửa tên chủ đề
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Lesson Items inside this session with ordering buttons */}
                    <div className="pl-3 border-l-2 border-primary/20 space-y-2">
                      {sItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-1">Chưa có bài học được gán vào buổi này.</p>
                      ) : (
                        sItems.map((item, itemIdx) => (
                          <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge variant="secondary" className="font-bold text-[10px] shrink-0">
                                #{item.order_index || itemIdx + 1}
                              </Badge>
                              <span className="font-medium text-foreground truncate">{item.title}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {item.type === 'lesson' ? 'Bài học' : item.file_type || 'Tài liệu'}
                              </Badge>
                            </div>

                            {isTeacher && (
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  disabled={itemIdx === 0}
                                  onClick={() => moveItemUpDown(item, `session_${s.id}`, -1)}
                                  title="Chuyển lên"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  disabled={itemIdx === sItems.length - 1}
                                  onClick={() => moveItemUpDown(item, `session_${s.id}`, 1)}
                                  title="Chuyển xuống"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* MAIN ACCORDION LIST (THEO BUỔI HOẶC THEO TUẦN) */
        <div className="space-y-4">
          {folderKeys.map((folderId) => {
            const group = groupedData[folderId];
            if (!group) return null;

            const isOpen = openFolders[folderId] !== false;
            const isDragOver = dragOverFolderId === folderId;
            const itemsList = group.items;

            // Theme colors based on folder category
            let headerGradient = 'from-slate-700 to-zinc-800 text-white';
            let headerBg = 'bg-card hover:bg-accent/30';
            let iconBg = 'bg-primary/10 text-primary';

            if (folderId === 'curriculum') {
              headerGradient = 'from-purple-600 to-indigo-600 text-white';
              headerBg = 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20';
              iconBg = 'bg-purple-600 text-white';
            } else if (folderId.startsWith('week_')) {
              headerGradient = 'from-emerald-600 to-teal-600 text-white';
              headerBg = 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20';
              iconBg = 'bg-emerald-600 text-white';
            } else if (folderId.startsWith('session_')) {
              headerGradient = 'from-blue-600 to-cyan-600 text-white';
              headerBg = 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20';
              iconBg = 'bg-blue-600 text-white';
            }

            return (
              <div
                key={folderId}
                onDragOver={(e) => handleDragOverFolder(e, folderId)}
                onDragLeave={handleDragLeaveFolder}
                onDrop={(e) => handleDropOnFolder(e, folderId)}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                  isDragOver ? 'border-primary ring-4 ring-primary/20 bg-primary/10 scale-[1.005]' : 'border-border/80'
                }`}
              >
                {/* Accordion Group Header */}
                <div
                  className={`flex items-center justify-between p-3.5 sm:p-4 transition-colors cursor-pointer select-none ${headerBg}`}
                  onClick={() => toggleFolder(folderId)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button type="button" className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                      {isOpen ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs font-bold ${iconBg}`}>
                      {folderId === 'curriculum' ? (
                        <BookMarked className="w-5 h-5" />
                      ) : folderId.startsWith('week_') ? (
                        <Layers className="w-5 h-5" />
                      ) : (
                        <Calendar className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base sm:text-lg text-foreground tracking-tight line-clamp-1">
                          {group.title}
                        </h3>
                        <Badge variant="secondary" className="font-semibold text-xs shrink-0">
                          {itemsList.length} tài nguyên
                        </Badge>
                        {isDragOver && (
                          <Badge className="bg-primary text-primary-foreground animate-pulse">Thả vào đây 🎯</Badge>
                        )}
                      </div>
                      {group.subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{group.subtitle}</p>}
                    </div>
                  </div>

                  {isTeacher && (
                    <div className="flex items-center gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTargetFolderId(folderId);
                          setMaterialDialogOpen(true);
                        }}
                        className="h-8 text-xs bg-background shadow-2xs hover:bg-muted font-medium"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1 text-primary" /> Thêm tài liệu / Slide
                      </Button>
                    </div>
                  )}
                </div>

                {/* Accordion Content Items */}
                {isOpen && (
                  <div className="p-3 sm:p-4 pt-1 bg-card/50 space-y-2.5 border-t border-border/50">
                    {itemsList.length === 0 ? (
                      <div className="p-6 border-2 border-dashed rounded-xl text-center text-xs text-muted-foreground bg-muted/20 my-2">
                        <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
                        Mục này chưa có bài học hoặc tài liệu nào.
                        {isTeacher && (
                          <span className="block mt-1 text-primary font-medium">
                            Kéo bài học thả vào đây hoặc bấm nút "Thêm tài liệu / Slide".
                          </span>
                        )}
                      </div>
                    ) : (
                      itemsList.map((item, idx) => {
                        const targetSlideUrl = item.slide_url || item.document_url || item.file_url;
                        const isSlideOrDoc = !!targetSlideUrl && (
                          item.file_type === 'slide' || item.file_type === 'pdf' ||
                          (item.file_type && ['pdf', 'ppt', 'pptx', 'link'].includes(item.file_type.toLowerCase())) ||
                          targetSlideUrl.includes('.pdf') || targetSlideUrl.includes('.ppt') || targetSlideUrl.includes('canva.com') || targetSlideUrl.includes('google.com/presentation')
                        );
                        const postedDateStr = formatDatePosted(item.created_at);

                        return (
                          <div
                            key={item.id}
                            draggable={isTeacher}
                            onDragStart={(e) => handleDragStart(e, item)}
                            className={`group flex items-center justify-between gap-3 p-3.5 rounded-xl border bg-card hover:bg-accent/40 shadow-2xs transition-all duration-150 ${
                              draggedItem?.id === item.id ? 'opacity-40 border-dashed border-primary' : 'hover:border-primary/40'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {isTeacher && (
                                <div
                                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors p-1 shrink-0"
                                  title="Kéo để di chuyển hoặc thay đổi thứ tự"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                              )}

                              {/* Item Badge Icon */}
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                                {item.type === 'lesson' ? (
                                  <FileText className="w-5 h-5" />
                                ) : isSlideOrDoc ? (
                                  <Presentation className="w-5 h-5 text-purple-600" />
                                ) : (
                                  <FileType2 className="w-5 h-5 text-emerald-600" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm text-foreground line-clamp-1 tracking-tight">
                                    {item.title}
                                  </h4>
                                  {item.type === 'lesson' ? (
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-[10px] uppercase font-bold">
                                      Bài học
                                    </Badge>
                                  ) : isSlideOrDoc ? (
                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/30 text-[10px] uppercase font-bold">
                                      Slide / Trình chiếu 📺
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px] uppercase font-bold">
                                      {item.file_type || 'Tài liệu'}
                                    </Badge>
                                  )}
                                  {item.skill && (
                                    <Badge variant="secondary" className="text-[10px] font-medium">
                                      {item.skill}
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                                  <span>{postedDateStr}</span>
                                  {item.duration_minutes && (
                                    <span className="flex items-center gap-1">
                                      • <Clock className="w-3 h-3" /> {item.duration_minutes} phút
                                    </span>
                                  )}
                                  {item.description && (
                                    <span className="line-clamp-1 max-w-md hidden md:inline text-muted-foreground/80">
                                      • {item.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Quick Action Controls */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Slide Presentation trigger */}
                              {isSlideOrDoc && targetSlideUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setActivePresentation({
                                    title: item.title,
                                    url: targetSlideUrl,
                                    type: item.file_type || 'slide'
                                  })}
                                  className="h-8 text-xs font-bold bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-700 dark:text-purple-300 hover:from-purple-500/20 hover:to-indigo-500/20 border-purple-500/30 rounded-lg shadow-2xs"
                                >
                                  <Presentation className="w-3.5 h-3.5 mr-1 text-purple-600" /> Trình chiếu Slide 📺
                                </Button>
                              )}

                              {/* Main Action Button */}
                              {item.type === 'lesson' ? (
                                <Button size="sm" variant="default" asChild className="h-8 text-xs font-bold rounded-lg shadow-xs">
                                  <Link to={`/learn/lessons/${item.id}`}>
                                    <Play className="w-3.5 h-3.5 mr-1 fill-current" /> Vào học
                                  </Link>
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" asChild className="h-8 text-xs font-semibold rounded-lg">
                                  <a href={item.file_url} target="_blank" rel="noreferrer">
                                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Mở file
                                  </a>
                                </Button>
                              )}

                              {/* Dropdown Menu (More options) */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Tùy chọn thao tác:</div>
                                  {item.type === 'lesson' ? (
                                    <DropdownMenuItem asChild>
                                      <Link to={`/learn/lessons/${item.id}`}>
                                        <Play className="w-3.5 h-3.5 mr-2 text-primary" /> Mở bài học
                                      </Link>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem asChild>
                                      <a href={item.file_url} target="_blank" rel="noreferrer">
                                        <ExternalLink className="w-3.5 h-3.5 mr-2 text-purple-600" /> Xem tệp tài liệu
                                      </a>
                                    </DropdownMenuItem>
                                  )}

                                  {effectiveIsTeacher && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => openEditLessonModal(item)} className="font-semibold text-primary">
                                        <Edit3 className="w-3.5 h-3.5 mr-2 text-primary" /> Chỉnh sửa bài học / tài liệu
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        Chuyển danh mục:
                                      </div>
                                      <DropdownMenuItem onClick={() => moveItemToFolder(item, 'curriculum')}>
                                        📚 Giáo trình học & Sách Ebook
                                      </DropdownMenuItem>
                                      {viewGroupMode === 'session' ? (
                                        sessions.map((s, sIdx) => (
                                          <DropdownMenuItem key={s.id} onClick={() => moveItemToFolder(item, `session_${s.id}`)}>
                                            📅 Buổi {sIdx + 1}: {s.topic || format(parseISO(s.session_date), 'dd/MM')}
                                          </DropdownMenuItem>
                                        ))
                                      ) : (
                                        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => (
                                          <DropdownMenuItem key={w} onClick={() => moveItemToFolder(item, `week_${w}`)}>
                                            🗓️ Tuần {w}
                                          </DropdownMenuItem>
                                        ))
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem disabled={idx === 0} onClick={() => moveItemUpDown(item, folderId, -1)}>
                                        <ArrowUp className="w-3.5 h-3.5 mr-2" /> Chuyển lên trên
                                      </DropdownMenuItem>
                                      <DropdownMenuItem disabled={idx === itemsList.length - 1} onClick={() => moveItemUpDown(item, folderId, 1)}>
                                        <ArrowDown className="w-3.5 h-3.5 mr-2" /> Chuyển xuống dưới
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => setDeleteConfirmItem(item)}
                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive font-medium cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-2 text-destructive" /> Xóa tài liệu / bài học
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Presentation Viewer */}
      {activePresentation && (
        <Dialog open={!!activePresentation} onOpenChange={() => setActivePresentation(null)}>
          <DialogContent className="max-w-5xl h-[85vh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-primary" />
                {activePresentation.title}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 p-4 bg-muted/30">
              <InlineLessonPresentation
                slideUrl={activePresentation.url}
                title={activePresentation.title}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Edit Session Topic */}
      {editSessionTopic && (
        <Dialog open={!!editSessionTopic} onOpenChange={() => setEditSessionTopic(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                Đổi tên Chủ đề Buổi / Tuần học
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Tên chủ đề buổi học</label>
                <Input
                  value={editSessionTopic.topic}
                  onChange={(e) => setEditSessionTopic({ ...editSessionTopic, topic: e.target.value })}
                  placeholder="VD: Đoản văn + Nghe N4 - M1"
                  className="mt-1 font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Số Tuần học tương ứng</label>
                <Input
                  type="number"
                  value={editSessionTopic.weekNum || 1}
                  onChange={(e) => setEditSessionTopic({ ...editSessionTopic, weekNum: parseInt(e.target.value) || 1 })}
                  className="mt-1"
                  min={1}
                  max={24}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditSessionTopic(null)}>Hủy</Button>
              <Button onClick={handleSaveSessionTopic}>Lưu thay đổi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Material Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Thêm Slide / Tài liệu cho {groupedData[targetFolderId]?.title || 'Buổi học'}
            </DialogTitle>
          </DialogHeader>

          {/* Mode Switcher: Tải tệp vs Nhập URL trình chiếu */}
          <div className="flex gap-2 p-1 bg-muted/60 rounded-xl border">
            <Button
              type="button"
              size="sm"
              variant={materialMode === 'file' ? 'default' : 'ghost'}
              onClick={() => setMaterialMode('file')}
              className="flex-1 text-xs font-semibold rounded-lg"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Tải tệp từ máy tính
            </Button>
            <Button
              type="button"
              size="sm"
              variant={materialMode === 'url' ? 'default' : 'ghost'}
              onClick={() => setMaterialMode('url')}
              className="flex-1 text-xs font-semibold rounded-lg"
            >
              <Link2 className="w-3.5 h-3.5 mr-1.5" /> Nhập URL trình chiếu
            </Button>
          </div>

          <div className="space-y-3 py-1">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Tiêu đề đính kèm</label>
              <Input
                value={materialForm.title}
                onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                placeholder={materialMode === 'url' ? "VD: Slide Google Slides / Canva Buổi 31" : "VD: Từ vựng Minna N4 - Bài 31"}
                className="mt-1 font-medium"
              />
            </div>

            {materialMode === 'file' ? (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Chọn tệp từ máy tính</label>
                <Input
                  type="file"
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                  onChange={(e) => e.target.files?.[0] && handleUploadMaterial(e.target.files[0])}
                  className="mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Hỗ trợ PDF, PowerPoint (.pptx), Word, Excel, ZIP... (Tên file tự động chuẩn hóa an toàn).
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Đường dẫn URL trình chiếu / Tài liệu online</label>
                <Input
                  value={materialForm.link_url}
                  onChange={(e) => setMaterialForm({ ...materialForm, link_url: e.target.value })}
                  placeholder="https://docs.google.com/presentation/d/... hoặc Canva / PDF URL"
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground bg-primary/5 p-2 rounded-lg border border-primary/10">
                  ✨ <strong>Hỗ trợ nhúng trực tiếp:</strong> Google Slides, Canva, Office PowerPoint Web, PDF online... Học viên có thể xem trực tiếp ngay trong lớp học!
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setMaterialDialogOpen(false)}>Hủy</Button>
            {materialMode === 'url' && (
              <Button onClick={handleAddUrlMaterial} disabled={uploading || !materialForm.link_url.trim()}>
                {uploading ? 'Đang thêm...' : 'Lưu URL trình chiếu'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation Dialog */}
      {deleteConfirmItem && (
        <Dialog open={!!deleteConfirmItem} onOpenChange={() => setDeleteConfirmItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Xác nhận xóa tài liệu / bài học
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <p className="text-sm text-foreground font-medium">
                Bạn có chắc chắn muốn xóa <span className="font-bold text-destructive">"{deleteConfirmItem.title}"</span> khỏi danh sách buổi học này không?
              </p>
              <p className="text-xs text-muted-foreground bg-destructive/5 p-2.5 rounded-lg border border-destructive/20">
                ⚠️ Hành động này sẽ gỡ hoàn toàn tệp/bài học này khỏi lớp học. Học viên sẽ không còn xem được tài liệu này nữa.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setDeleteConfirmItem(null)} disabled={deleting}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={handleDeleteItem} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa ngay'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Deep Lesson / Material Editor Dialog */}
      {editingLesson && (
        <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary font-extrabold text-base">
                <Edit3 className="w-5 h-5" />
                Chỉnh sửa bài học / tài liệu chuyên sâu: {editingLesson.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Tiêu đề bài học / Tài liệu (Tiếng Việt)</label>
                <Input
                  value={editLessonForm.title_vi}
                  onChange={(e) => setEditLessonForm({ ...editLessonForm, title_vi: e.target.value })}
                  placeholder="VD: Từ vựng Minna N4 - Bài 31"
                  className="font-bold text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Mô tả tóm tắt nội dung</label>
                <Textarea
                  value={editLessonForm.description}
                  onChange={(e) => setEditLessonForm({ ...editLessonForm, description: e.target.value })}
                  placeholder="Nhập mô tả tóm tắt cho bài học..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Kỹ năng</label>
                  <Select value={editLessonForm.skill} onValueChange={(v) => setEditLessonForm({ ...editLessonForm, skill: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reading">📖 Đọc hiểu (Reading)</SelectItem>
                      <SelectItem value="listening">🎧 Nghe hiểu (Listening)</SelectItem>
                      <SelectItem value="speaking">🗣️ Nói Kaiwa (Speaking)</SelectItem>
                      <SelectItem value="writing">✍️ Viết (Writing)</SelectItem>
                      <SelectItem value="vocabulary">🎴 Từ vựng (Vocabulary)</SelectItem>
                      <SelectItem value="grammar">📚 Ngữ pháp (Grammar)</SelectItem>
                      <SelectItem value="kanji">🈁 Kanji (Hán tự)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Trình độ (Level)</label>
                  <Select value={editLessonForm.level} onValueChange={(v) => setEditLessonForm({ ...editLessonForm, level: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N5">N5 Sơ cấp 1</SelectItem>
                      <SelectItem value="N4">N4 Sơ cấp 2</SelectItem>
                      <SelectItem value="N3">N3 Trung cấp</SelectItem>
                      <SelectItem value="N2">N2 Cao cấp</SelectItem>
                      <SelectItem value="N1">N1 Chuyên sâu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Thời lượng (Phút)</label>
                  <Input
                    type="number"
                    value={editLessonForm.duration_minutes}
                    onChange={(e) => setEditLessonForm({ ...editLessonForm, duration_minutes: parseInt(e.target.value) || 15 })}
                    className="mt-1"
                    min={1}
                  />
                </div>
              </div>

              {/* Uploaders for Slide / Document / Video */}
              <div className="space-y-3 pt-2 border-t">
                <div>
                  <label className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase flex items-center gap-1.5 mb-1.5">
                    <Presentation className="w-4 h-4" /> Link Trình Chiếu Slide (Canva / Google Slides / PDF / PPTX)
                  </label>
                  <Input
                    value={editLessonForm.slide_url}
                    onChange={(e) => setEditLessonForm({ ...editLessonForm, slide_url: e.target.value })}
                    placeholder="https://docs.google.com/presentation/d/... hoặc link Canva"
                    className="font-mono text-xs mb-2"
                  />
                  <MediaUploader
                    value={editLessonForm.slide_url}
                    onChange={(url) => setEditLessonForm({ ...editLessonForm, slide_url: url })}
                    accept="document"
                    bucket="lesson-assets"
                    placeholder="Tải tệp PDF / Slide mới hoặc chọn từ Thư viện"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase flex items-center gap-1.5 mb-1.5">
                    <Play className="w-4 h-4" /> Link Video bài giảng (YouTube / MP4)
                  </label>
                  <Input
                    value={editLessonForm.video_url}
                    onChange={(e) => setEditLessonForm({ ...editLessonForm, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... hoặc URL mp4"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setEditingLesson(null)}>Hủy</Button>
              <Button onClick={handleSaveLessonEdit} className="font-bold">Lưu thay đổi bài học</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClassLessonOrganizer;

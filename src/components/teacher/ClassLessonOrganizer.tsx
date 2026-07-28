import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  BookOpen, Folder, FolderOpen, GripVertical, ArrowUp, ArrowDown, MoveRight,
  Plus, Upload, FileText, ChevronDown, ChevronRight, Play, ExternalLink,
  BookMarked, Sparkles, Clock, Calendar, Trash2, Edit3, Link2, FileType2, Presentation
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

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
  category?: string | null; // 'curriculum' | 'session' | etc.
  order_index?: number;
  created_at?: string;
  type: 'lesson' | 'material';
  file_url?: string;
  file_type?: string;
}

export interface SessionItem {
  id: string;
  class_id: string;
  session_date: string;
  start_time: string;
  end_time?: string | null;
  topic?: string | null;
  notes?: string | null;
  order_index?: number;
}

interface Props {
  classId: string;
  className?: string;
  isTeacher?: boolean;
  onRefreshNeeded?: () => void;
}

export const ClassLessonOrganizer = ({ classId, className, isTeacher = false, onRefreshNeeded }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [items, setItems] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Drag and Drop state
  const [draggedItem, setDraggedItem] = useState<LessonItem | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Collapsible state for folders
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    curriculum: true,
    unassigned: true,
  });

  // Create material dialog
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string>('curriculum');
  const [materialForm, setMaterialForm] = useState({ title: '', link_url: '', category: 'giáo_trình' });
  const [uploading, setUploading] = useState(false);

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
        title: l.title || l.title_vi || 'Bài học',
        title_vi: l.title_vi,
        description: l.description_vi || l.description,
        skill: l.skill,
        level: l.level,
        duration_minutes: l.duration_minutes,
        is_published: l.is_published,
        session_id: l.session_id,
        category: l.category || (l.session_id ? 'session' : 'unassigned'),
        order_index: l.order_index ?? 0,
        created_at: l.created_at,
        type: 'lesson',
      }));

      // Map materials to unified items
      const materialItems: LessonItem[] = (mData || []).map((m: any) => ({
        id: m.id,
        title: m.title || 'Tài liệu',
        description: m.description,
        session_id: m.lesson_id ? null : (m.class_id ? null : null), // will check description or category
        category: m.description === 'giáo_trình' || m.description?.toLowerCase().includes('giáo trình') ? 'curriculum' : (m.lesson_id ? 'lesson_attached' : 'curriculum'),
        order_index: m.order_index ?? 0,
        created_at: m.created_at,
        type: 'material',
        file_url: m.file_url,
        file_type: m.file_type,
      }));

      const combined = [...lessonItems, ...materialItems].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      setItems(combined);

      // Auto expand folder states for existing sessions
      setOpenFolders((prev) => {
        const next = { ...prev };
        (sData || []).forEach((s: any) => {
          if (next[`session_${s.id}`] === undefined) next[`session_${s.id}`] = true;
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

  // Group items by Folder ID
  // Folders: 'curriculum' (Giáo trình học), 'session_<id>' (Buổi 1, 2, ...), 'unassigned' (Chưa phân buổi)
  const groupedItems = useMemo(() => {
    const map: Record<string, LessonItem[]> = {
      curriculum: [],
      unassigned: [],
    };

    sessions.forEach((s) => {
      map[`session_${s.id}`] = [];
    });

    items.forEach((item) => {
      if (item.category === 'curriculum') {
        map.curriculum.push(item);
      } else if (item.session_id && map[`session_${item.session_id}`]) {
        map[`session_${item.session_id}`].push(item);
      } else {
        map.unassigned.push(item);
      }
    });

    // Sort items inside each folder by order_index
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    });

    return map;
  }, [items, sessions]);

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

  // Logic to move item to a folder
  const moveItemToFolder = async (item: LessonItem, targetFolderId: string) => {
    try {
      const targetItems = groupedItems[targetFolderId] || [];
      const newOrderIndex = targetItems.length + 1;

      let newSessionId: string | null = null;
      let newCategory: string = 'session';

      if (targetFolderId === 'curriculum') {
        newCategory = 'curriculum';
        newSessionId = null;
      } else if (targetFolderId.startsWith('session_')) {
        newSessionId = targetFolderId.replace('session_', '');
        newCategory = 'session';
      } else {
        newCategory = 'unassigned';
        newSessionId = null;
      }

      // Optimistic update state
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, session_id: newSessionId, category: newCategory, order_index: newOrderIndex }
            : it
        )
      );

      // Persist to Supabase
      const sb: any = supabase;
      if (item.type === 'lesson') {
        const { error } = await sb
          .from('lessons')
          .update({
            session_id: newSessionId,
            category: newCategory,
            order_index: newOrderIndex,
          })
          .eq('id', item.id);

        if (error) throw error;
      } else {
        const { error } = await sb
          .from('lesson_materials')
          .update({
            description: targetFolderId === 'curriculum' ? 'giáo_trình' : (newSessionId ? `buổi_${newSessionId}` : 'tài_liệu'),
            order_index: newOrderIndex,
          })
          .eq('id', item.id);

        if (error) throw error;
      }

      const folderName =
        targetFolderId === 'curriculum'
          ? '📚 Giáo trình học'
          : targetFolderId.startsWith('session_')
          ? `Buổi học`
          : 'Chưa phân buổi';

      toast({
        title: 'Đã di chuyển bài học',
        description: `Bài "${item.title}" đã được thả vào [${folderName}].`,
      });

      if (onRefreshNeeded) onRefreshNeeded();
    } catch (e: any) {
      console.error('Error moving item:', e);
      toast({ title: 'Lỗi di chuyển', description: e.message, variant: 'destructive' });
      loadData();
    }
  };

  // Logic to reorder item within same list
  const moveItemUpDown = async (item: LessonItem, folderId: string, direction: -1 | 1) => {
    const list = [...(groupedItems[folderId] || [])];
    const index = list.findIndex((i) => i.id === item.id);
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= list.length) return;

    const otherItem = list[newIndex];
    const orderA = item.order_index ?? index + 1;
    const orderB = otherItem.order_index ?? newIndex + 1;

    // Optimistic UI update
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

      toast({ title: 'Đã sắp xếp lại thứ tự bài học' });
    } catch (e: any) {
      toast({ title: 'Lỗi sắp xếp', description: e.message, variant: 'destructive' });
      loadData();
    }
  };

  // Handle uploading file directly to Curriculum or Session folder
  const handleUploadMaterial = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'file').toLowerCase();
      const path = `curriculum/${classId}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('lesson-assets').upload(path, file);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('lesson-assets').getPublicUrl(path);

      const targetDesc = targetFolderId === 'curriculum' ? 'giáo_trình' : targetFolderId;
      const { error: dbErr } = await (supabase as any).from('lesson_materials').insert({
        teacher_id: user.id,
        class_id: classId,
        title: materialForm.title || file.name,
        description: targetDesc,
        file_url: publicUrl,
        file_type: ext,
        file_size: file.size,
        order_index: (groupedItems[targetFolderId]?.length || 0) + 1,
      });

      if (dbErr) throw dbErr;

      toast({ title: 'Đã thêm giáo trình/tài liệu', description: file.name });
      setMaterialDialogOpen(false);
      setMaterialForm({ title: '', link_url: '', category: 'giáo_trình' });
      loadData();
    } catch (e: any) {
      toast({ title: 'Lỗi tải file', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  if (loading) {
    return <div className="text-center py-12 text-sm text-muted-foreground">Đang tải cấu trúc giáo trình bài học...</div>;
  }

  const renderFolderHeader = (
    folderId: string,
    title: string,
    badgeText: string,
    icon: any,
    colorClass: string,
    bgClass: string,
    description?: string
  ) => {
    const IconComp = icon;
    const isOpen = openFolders[folderId] !== false;
    const isDragOver = dragOverFolderId === folderId;

    return (
      <div
        onDragOver={(e) => handleDragOverFolder(e, folderId)}
        onDragLeave={handleDragLeaveFolder}
        onDrop={(e) => handleDropOnFolder(e, folderId)}
        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
          isDragOver
            ? 'border-primary ring-4 ring-primary/20 bg-primary/10 scale-[1.01]'
            : `${bgClass} border-border/80 hover:border-primary/40`
        }`}
      >
        <button
          onClick={() => toggleFolder(folderId)}
          className="flex items-center gap-3 text-left flex-1 min-w-0"
        >
          {isOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${colorClass}`}>
            <IconComp className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base tracking-tight text-foreground truncate">{title}</h3>
              <Badge variant="secondary" className="font-semibold text-xs">{badgeText}</Badge>
              {isDragOver && (
                <Badge className="bg-primary text-primary-foreground animate-pulse">
                  Thả vào đây 🎯
                </Badge>
              )}
            </div>
            {description && <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>}
          </div>
        </button>

        {isTeacher && (
          <div className="flex items-center gap-2 ml-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTargetFolderId(folderId);
                setMaterialDialogOpen(true);
              }}
              className="h-8 text-xs bg-background shadow-xs hover:bg-muted"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-primary" /> Thêm tài liệu
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderItemList = (folderId: string, itemsList: LessonItem[]) => {
    const isOpen = openFolders[folderId] !== false;

    if (!isOpen) return null;

    return (
      <div
        onDragOver={(e) => handleDragOverFolder(e, folderId)}
        onDragLeave={handleDragLeaveFolder}
        onDrop={(e) => handleDropOnFolder(e, folderId)}
        className="pl-3 sm:pl-6 space-y-2.5 pt-2 border-l-2 border-dashed border-primary/20 ml-4 my-2 transition-all"
      >
        {itemsList.length === 0 ? (
          <div className="p-4 border-2 border-dashed rounded-xl text-center text-xs text-muted-foreground bg-muted/20">
            <FolderOpen className="w-8 h-8 mx-auto mb-1 opacity-30 text-primary" />
            Thư mục này chưa có bài học. {isTeacher ? 'Kéo & thả bài học từ danh sách vào đây hoặc bấm "Thêm tài liệu"' : ''}
          </div>
        ) : (
          itemsList.map((item, idx) => (
            <div
              key={item.id}
              draggable={isTeacher}
              onDragStart={(e) => handleDragStart(e, item)}
              className={`group flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/40 shadow-xs transition-all duration-150 ${
                draggedItem?.id === item.id ? 'opacity-40 border-dashed border-primary' : 'hover:border-primary/40'
              }`}
            >
              {isTeacher && (
                <div
                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors p-1"
                  title="Kéo để di chuyển hoặc sắp xếp lại"
                >
                  <GripVertical className="w-4 h-4" />
                </div>
              )}

              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-sm text-foreground truncate">{item.title}</h4>
                  {item.type === 'lesson' ? (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-[11px]">
                      Bài học
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/30 text-[11px] uppercase">
                      {item.file_type || 'Tài liệu'}
                    </Badge>
                  )}
                  {item.level && <Badge variant="secondary" className="text-[10px]">{item.level}</Badge>}
                </div>
                {item.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>}
                {item.duration_minutes && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {item.duration_minutes} phút
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                {item.type === 'lesson' ? (
                  <Button size="sm" variant="default" asChild className="h-8 text-xs font-semibold rounded-lg">
                    <Link to={`/learn/${item.skill || 'reading'}`}>
                      <Play className="w-3.5 h-3.5 mr-1" /> Học ngay
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" asChild className="h-8 text-xs rounded-lg">
                    <a href={item.file_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Mở file
                    </a>
                  </Button>
                )}

                {isTeacher && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      disabled={idx === 0}
                      onClick={() => moveItemUpDown(item, folderId, -1)}
                      title="Chuyển lên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      disabled={idx === itemsList.length - 1}
                      onClick={() => moveItemUpDown(item, folderId, 1)}
                      title="Chuyển xuống"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Chuyển vào thư mục khác">
                          <MoveRight className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Chuyển sang thư mục:</div>
                        <DropdownMenuItem onClick={() => moveItemToFolder(item, 'curriculum')}>
                          📚 Giáo trình học (Ebook / Lộ trình)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {sessions.map((s, sIdx) => (
                          <DropdownMenuItem key={s.id} onClick={() => moveItemToFolder(item, `session_${s.id}`)}>
                            📅 Buổi {sIdx + 1}: {s.topic || format(new Date(s.session_date), 'dd/MM')}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => moveItemToFolder(item, 'unassigned')}>
                          📌 Chưa phân buổi
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-extrabold flex items-center gap-2">
              <BookMarked className="w-6 h-6 text-primary" />
              Giáo trình & Bài học theo Buổi
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isTeacher
                ? '💡 Kéo thả bài học vào các buổi học hoặc mục Giáo trình học để sắp xếp ngăn nắp.'
                : 'Lộ trình bài học và tài liệu được sắp xếp khoa học theo từng buổi học.'}
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          {/* Section 1: Giáo trình học (Curriculum / Ebooks / General Roadmaps) */}
          <div className="space-y-1">
            {renderFolderHeader(
              'curriculum',
              '📚 Giáo trình học (Sách Ebook / Lộ trình chung)',
              `${groupedItems.curriculum.length} tài liệu`,
              BookMarked,
              'bg-gradient-to-r from-purple-600 to-indigo-600',
              'bg-purple-500/5',
              'Nơi chứa sách Ebook, Lộ trình học tổng quan, tài liệu chung toàn khóa'
            )}
            {renderItemList('curriculum', groupedItems.curriculum)}
          </div>

          {/* Section 2: Session Folders (Buổi 1, Buổi 2, ...) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider px-1">
              Lịch & Bài học từng buổi ({sessions.length} buổi)
            </h4>

            {sessions.map((session, sIdx) => {
              const fId = `session_${session.id}`;
              const sItems = groupedItems[fId] || [];
              const sDateStr = session.session_date ? format(new Date(session.session_date), 'dd/MM/yyyy') : '';
              return (
                <div key={session.id} className="space-y-1">
                  {renderFolderHeader(
                    fId,
                    `Buổi ${sIdx + 1}: ${session.topic || 'Bài học trên lớp'}`,
                    `${sItems.length} bài`,
                    Calendar,
                    'bg-gradient-to-r from-blue-600 to-cyan-600',
                    'bg-blue-500/5',
                    `${sDateStr} ${session.start_time ? `• ${session.start_time}` : ''}`
                  )}
                  {renderItemList(fId, sItems)}
                </div>
              );
            })}
          </div>

          {/* Section 3: Unassigned Lessons (Bài học chưa phân vào buổi nào) */}
          {groupedItems.unassigned.length > 0 && (
            <div className="space-y-1 pt-2">
              {renderFolderHeader(
                'unassigned',
                '📌 Bài học chưa phân buổi',
                `${groupedItems.unassigned.length} bài`,
                Folder,
                'bg-gradient-to-r from-slate-600 to-zinc-700',
                'bg-muted/40',
                'Các bài học tự do hoặc đang chờ xếp vào buổi học phù hợp'
              )}
              {renderItemList('unassigned', groupedItems.unassigned)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload / Create Material Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Thêm tài liệu / Giáo trình
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Tiêu đề hiển thị</label>
              <Input
                value={materialForm.title}
                onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                placeholder="VD: Sách Minna no Nihongo I - Bản đầy đủ"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Chọn file đính kèm</label>
              <Input
                type="file"
                disabled={uploading}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                onChange={(e) => e.target.files?.[0] && handleUploadMaterial(e.target.files[0])}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Hỗ trợ PDF, Word, PowerPoint, Excel, Ảnh, ZIP...</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMaterialDialogOpen(false)}>Hủy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassLessonOrganizer;

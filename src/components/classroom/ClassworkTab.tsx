import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, ClipboardList, FileText, HelpCircle, Trash2, Edit, ChevronDown, ChevronRight, FolderPlus, Sparkles, ExternalLink, Link2, Youtube, CalendarClock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import AssignmentComposer from './AssignmentComposer';
import SubmitDialog from './SubmitDialog';

interface Props { classId: string; isTeacher: boolean }

const kindMeta: Record<string, { icon: any; color: string; label: string }> = {
  assignment: { icon: ClipboardList, color: 'from-orange-500 to-amber-500', label: 'Bài tập' },
  material: { icon: FileText, color: 'from-blue-500 to-cyan-500', label: 'Tài liệu' },
  question: { icon: HelpCircle, color: 'from-purple-500 to-pink-500', label: 'Câu hỏi' },
};

const ClassworkTab = ({ classId, isTeacher }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [mySubs, setMySubs] = useState<any[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitAssignment, setSubmitAssignment] = useState<any>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [topicOpen, setTopicOpen] = useState(false);
  const [topicName, setTopicName] = useState('');

  const load = async () => {
    const sb: any = supabase;
    const [{ data: t }, { data: a }, subsRes] = await Promise.all([
      sb.from('class_topics').select('*').eq('class_id', classId).order('order_index'),
      sb.from('class_assignments').select('*').eq('class_id', classId).order('created_at', { ascending: false }),
      user ? sb.from('class_assignment_submissions').select('*').eq('student_id', user.id) : Promise.resolve({ data: [] }),
    ]);
    setTopics(t || []);
    setAssignments(a || []);
    setMySubs(subsRes.data || []);
  };

  useEffect(() => { load(); }, [classId, user]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = { __none: [] };
    topics.forEach(t => { map[t.id] = []; });
    assignments.forEach(a => {
      const k = a.topic_id || '__none';
      if (!map[k]) map[k] = [];
      map[k].push(a);
    });
    return map;
  }, [topics, assignments]);

  const createTopic = async () => {
    if (!topicName.trim()) return;
    const { error } = await (supabase as any).from('class_topics').insert({
      class_id: classId, name: topicName.trim(), order_index: topics.length,
    });
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    setTopicName(''); setTopicOpen(false); load();
  };

  const delTopic = async (id: string) => {
    if (!confirm('Xóa chủ đề? Bài tập sẽ về mục "Không có chủ đề".')) return;
    await (supabase as any).from('class_topics').delete().eq('id', id);
    load();
  };

  const delAssignment = async (id: string) => {
    if (!confirm('Xóa bài tập?')) return;
    await (supabase as any).from('class_assignments').delete().eq('id', id);
    load();
  };

  const openEdit = (a: any) => { setEditing(a); setComposerOpen(true); };
  const openCreate = () => { setEditing(null); setComposerOpen(true); };
  const openSubmit = (a: any) => { setSubmitAssignment(a); setSubmitOpen(true); };

  const subFor = (aid: string) => mySubs.find(s => s.assignment_id === aid);

  const renderSection = (topicId: string, topicName: string) => {
    const items = grouped[topicId] || [];
    const isOpen = !collapsed[topicId];
    return (
      <div key={topicId} className="space-y-2">
        <div className="flex items-center justify-between group">
          <button onClick={() => setCollapsed(c => ({ ...c, [topicId]: !c[topicId] }))} className="flex items-center gap-2 text-left hover:text-primary transition-colors">
            {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            <h3 className="text-lg font-bold">{topicName}</h3>
            <Badge variant="outline" className="ml-2 text-xs">{items.length}</Badge>
          </button>
          {isTeacher && topicId !== '__none' && (
            <Button variant="ghost" size="icon" onClick={() => delTopic(topicId)} className="opacity-0 group-hover:opacity-100">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
        {isOpen && (
          <div className="space-y-2 pl-2 border-l-2 border-dashed border-muted ml-2">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic pl-4 py-2">Chưa có mục nào</p>
            ) : items.map(a => {
              const meta = kindMeta[a.kind || 'assignment'] || kindMeta.assignment;
              const Icon = meta.icon;
              const sub = subFor(a.id);
              const submitted = sub?.status === 'submitted' || sub?.status === 'graded';
              const overdue = a.due_date && new Date(a.due_date) < new Date() && !submitted;
              const upcoming = a.start_at && new Date(a.start_at) > new Date();
              return (
                <Card key={a.id} className="hover:shadow-md hover:border-primary/40 transition-all group/item">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{a.title}</h4>
                        {submitted && <Badge className="bg-green-500/15 text-green-700 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />{sub?.status === 'graded' ? 'Đã chấm' : 'Đã nộp'}</Badge>}
                        {upcoming && <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 font-medium">🔒 Chưa đến giờ mở đề</Badge>}
                        {overdue && <Badge variant="destructive">Quá hạn</Badge>}
                        {a.points ? <Badge variant="outline">{a.points} điểm</Badge> : null}
                      </div>
                      {a.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{a.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {a.start_at ? (
                          <span className={`flex items-center gap-1 font-medium ${upcoming ? 'text-amber-600' : 'text-emerald-600'}`}>
                            <CalendarClock className="w-3 h-3" />
                            {upcoming ? `Mở đề lúc: ${format(new Date(a.start_at), 'dd/MM/yyyy HH:mm')}` : `Đã mở lúc: ${format(new Date(a.start_at), 'dd/MM/yyyy HH:mm')}`}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">🟢 Luôn mở</span>
                        )}
                        {a.due_date && <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />Hạn: {format(new Date(a.due_date), 'dd/MM/yyyy HH:mm')}</span>}
                        {Array.isArray(a.attachments) && a.attachments.length > 0 && (
                          <span className="flex items-center gap-1">
                            {a.attachments.length} tệp đính kèm
                          </span>
                        )}
                        {sub?.score != null && <span className="text-primary font-semibold">Điểm: {sub.score}/{a.points || 100}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isTeacher ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => delAssignment(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </>
                      ) : upcoming ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: 'Chưa tới giờ mở đề bài',
                              description: `Đề thi/bài tập này được lên lịch mở lúc ${format(new Date(a.start_at), 'dd/MM/yyyy HH:mm')}. Vui lòng quay lại đúng giờ!`,
                              variant: 'destructive',
                            });
                          }}
                          className="border-amber-500/50 text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold"
                        >
                          🔒 Mở lúc {format(new Date(a.start_at), 'HH:mm dd/MM')}
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => openSubmit(a)} variant={submitted ? 'outline' : 'default'}>
                          {submitted ? 'Xem/Sửa' : 'Nộp bài'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {isTeacher && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={openCreate} className="rounded-full shadow-md"><Plus className="w-4 h-4 mr-1" />Tạo bài tập</Button>
          <Button variant="outline" onClick={() => setTopicOpen(true)} className="rounded-full"><FolderPlus className="w-4 h-4 mr-1" />Thêm chủ đề</Button>
          <div className="ml-auto text-sm text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3" />Bấm ✨ AI trong trình soạn thảo để tạo nhanh</div>
        </div>
      )}

      {topics.length === 0 && assignments.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          {isTeacher ? 'Chưa có bài tập. Nhấn "Tạo bài tập" để bắt đầu.' : 'Giáo viên chưa giao bài tập nào.'}
        </CardContent></Card>
      ) : (
        <div className="space-y-8">
          {topics.map(t => renderSection(t.id, t.name))}
          {(grouped.__none?.length || 0) > 0 && renderSection('__none', 'Không có chủ đề')}
        </div>
      )}

      <AssignmentComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        classId={classId}
        topics={topics}
        initial={editing}
        onSaved={load}
      />

      {submitAssignment && (
        <SubmitDialog
          open={submitOpen}
          onOpenChange={setSubmitOpen}
          assignment={submitAssignment}
          existing={subFor(submitAssignment.id)}
          onSaved={load}
        />
      )}

      <Dialog open={topicOpen} onOpenChange={setTopicOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Thêm chủ đề mới</DialogTitle></DialogHeader>
          <Input value={topicName} onChange={e => setTopicName(e.target.value)} placeholder="VD: Tuần 1 - Chào hỏi" onKeyDown={e => e.key === 'Enter' && createTopic()} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTopicOpen(false)}>Hủy</Button>
            <Button onClick={createTopic}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassworkTab;
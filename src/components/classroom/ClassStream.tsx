import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Pin, PinOff, Trash2, MessageSquare, Send, Heart, Megaphone, FileText, ClipboardList } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Props { classId: string; isTeacher?: boolean }

type Post = {
  id: string; class_id: string; author_id: string; kind: string;
  title: string | null; body: string | null; attachments: any[];
  pinned: boolean; created_at: string; assignment_id?: string | null;
  author?: { full_name?: string; avatar_url?: string };
  comments?: Comment[]; reactions?: { emoji: string; user_id: string }[];
};
type Comment = { id: string; author_id: string; body: string; created_at: string; author?: any };

const initial = (name?: string) => (name || '?').trim().charAt(0).toUpperCase();

const ClassStream = ({ classId, isTeacher }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  const load = async () => {
    const sb: any = supabase;
    const { data } = await sb.from('class_stream_posts').select('*').eq('class_id', classId).order('pinned', { ascending: false }).order('created_at', { ascending: false });
    const posts: Post[] = (data as Post[]) || [];
    const ids = posts.map(p => p.id);
    const authorIds = [...new Set(posts.map(p => p.author_id))];
    const [{ data: profs }, { data: cmts }, { data: rxs }] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', authorIds.length ? authorIds : ['00000000-0000-0000-0000-000000000000']),
      ids.length ? sb.from('class_stream_comments').select('*').in('post_id', ids).order('created_at') : Promise.resolve({ data: [] }),
      ids.length ? sb.from('class_stream_reactions').select('*').in('post_id', ids) : Promise.resolve({ data: [] }),
    ]);
    const commentAuthorIds = [...new Set((cmts || []).map((c: any) => c.author_id))];
    let commentProfs: any[] = [];
    if (commentAuthorIds.length) {
      const { data } = await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', commentAuthorIds);
      commentProfs = data || [];
    }
    setPosts(posts.map(p => ({
      ...p,
      author: profs?.find((x: any) => x.user_id === p.author_id),
      comments: (cmts || []).filter((c: any) => c.post_id === p.id).map((c: any) => ({ ...c, author: commentProfs.find(x => x.user_id === c.author_id) })),
      reactions: (rxs || []).filter((r: any) => r.post_id === p.id),
    })));
  };

  useEffect(() => { load(); }, [classId]);

  useEffect(() => {
    const ch = supabase.channel(`class-stream-${classId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_stream_posts', filter: `class_id=eq.${classId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_stream_comments' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_stream_reactions' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [classId]);

  const post = async () => {
    if (!user || !body.trim()) return;
    setPosting(true);
    const { error } = await (supabase as any).from('class_stream_posts').insert({
      class_id: classId, author_id: user.id, kind: 'announcement', body: body.trim(),
    });
    setPosting(false);
    if (error) return toast({ title: 'Lỗi đăng bài', description: error.message, variant: 'destructive' });
    setBody('');
  };

  const togglePin = async (p: Post) => {
    await (supabase as any).from('class_stream_posts').update({ pinned: !p.pinned }).eq('id', p.id);
  };
  const del = async (p: Post) => {
    if (!confirm('Xóa bài đăng?')) return;
    await (supabase as any).from('class_stream_posts').delete().eq('id', p.id);
  };
  const submitComment = async (postId: string) => {
    const b = (commentDraft[postId] || '').trim();
    if (!b || !user) return;
    await (supabase as any).from('class_stream_comments').insert({ post_id: postId, author_id: user.id, body: b });
    setCommentDraft(d => ({ ...d, [postId]: '' }));
  };
  const toggleReact = async (p: Post) => {
    if (!user) return;
    const mine = p.reactions?.find(r => r.user_id === user.id && r.emoji === '❤️');
    if (mine) {
      await (supabase as any).from('class_stream_reactions').delete().eq('post_id', p.id).eq('user_id', user.id).eq('emoji', '❤️');
    } else {
      await (supabase as any).from('class_stream_reactions').insert({ post_id: p.id, user_id: user.id, emoji: '❤️' });
    }
  };

  const kindMeta: Record<string, { icon: any; label: string; color: string }> = {
    announcement: { icon: Megaphone, label: 'Thông báo', color: 'bg-primary/10 text-primary' },
    assignment: { icon: ClipboardList, label: 'Bài tập', color: 'bg-orange-500/10 text-orange-600' },
    material: { icon: FileText, label: 'Tài liệu', color: 'bg-blue-500/10 text-blue-600' },
  };

  return (
    <div className="space-y-4">
      {/* Composer */}
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-9 h-9"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{initial((user as any)?.user_metadata?.full_name || user?.email)}</AvatarFallback></Avatar>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={isTeacher ? 'Chia sẻ thông báo với cả lớp…' : 'Đặt câu hỏi hoặc chia sẻ với lớp…'}
              rows={2}
              className="resize-none flex-1 bg-muted/30 border-none focus-visible:ring-1"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={post} disabled={posting || !body.trim()} size="sm" className="rounded-full">
              <Send className="w-3.5 h-3.5 mr-1" />Đăng bài
            </Button>
          </div>
        </CardContent>
      </Card>

      {posts.length === 0 && (
        <Card className="border-dashed"><CardContent className="py-14 text-center text-muted-foreground">
          <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
          Chưa có bài đăng nào. Hãy chia sẻ điều gì đó với lớp!
        </CardContent></Card>
      )}

      {posts.map(p => {
        const meta = kindMeta[p.kind] || kindMeta.announcement;
        const Icon = meta.icon;
        const liked = !!p.reactions?.find(r => r.user_id === user?.id && r.emoji === '❤️');
        const likeCount = p.reactions?.filter(r => r.emoji === '❤️').length || 0;
        const canModify = isTeacher || p.author_id === user?.id;
        return (
          <Card key={p.id} className={`transition-all hover:shadow-md ${p.pinned ? 'ring-2 ring-primary/40' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10"><AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground">{initial(p.author?.full_name)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{p.author?.full_name || 'Thành viên'}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${meta.color}`}><Icon className="w-3 h-3" />{meta.label}</span>
                    {p.pinned && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-700"><Pin className="w-3 h-3" />Ghim</span>}
                    <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: vi })}</span>
                  </div>
                  {p.title && <h3 className="font-bold text-lg mt-1">{p.title}</h3>}
                  {p.body && <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed">{p.body}</p>}
                </div>
                {canModify && (
                  <div className="flex items-center gap-1">
                    {isTeacher && (
                      <Button variant="ghost" size="icon" onClick={() => togglePin(p)} title={p.pinned ? 'Bỏ ghim' : 'Ghim'}>
                        {p.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => del(p)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 mt-3 pt-3 border-t">
                <Button variant="ghost" size="sm" onClick={() => toggleReact(p)} className={liked ? 'text-red-500' : ''}>
                  <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />{likeCount || 'Thích'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOpenComments(o => ({ ...o, [p.id]: !o[p.id] }))}>
                  <MessageSquare className="w-4 h-4 mr-1" />{p.comments?.length || 0} bình luận
                </Button>
              </div>

              {openComments[p.id] && (
                <div className="mt-3 space-y-3 pl-2 border-l-2 border-primary/20">
                  {p.comments?.map(c => (
                    <div key={c.id} className="flex items-start gap-2">
                      <Avatar className="w-7 h-7"><AvatarFallback className="text-[10px]">{initial(c.author?.full_name)}</AvatarFallback></Avatar>
                      <div className="flex-1 bg-muted/50 rounded-2xl px-3 py-2">
                        <p className="text-xs font-semibold">{c.author?.full_name || 'Thành viên'} <span className="text-muted-foreground font-normal ml-1">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: vi })}</span></p>
                        <p className="text-sm">{c.body}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7"><AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{initial((user as any)?.user_metadata?.full_name || user?.email)}</AvatarFallback></Avatar>
                    <div className="flex-1 flex items-center gap-2 bg-muted/40 rounded-full pr-1 pl-3 py-1">
                      <input
                        className="flex-1 bg-transparent text-sm outline-none"
                        placeholder="Viết bình luận…"
                        value={commentDraft[p.id] || ''}
                        onChange={e => setCommentDraft(d => ({ ...d, [p.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && submitComment(p.id)}
                      />
                      <Button size="icon" className="rounded-full h-7 w-7" onClick={() => submitComment(p.id)}><Send className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ClassStream;
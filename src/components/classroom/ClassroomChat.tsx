import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, Send, Smile, Reply, Edit3, Trash2, X, Check, Loader2, Image, ShieldAlert, Sparkles
} from 'lucide-react';
import AvatarWithDecoration from '@/components/shared/AvatarWithDecoration';

export interface ClassMessage {
  id: string;
  class_id: string;
  sender_id: string;
  message_text: string;
  reply_to_id?: string | null;
  attachments?: any[];
  reactions?: Record<string, string[]>; // { '👍': ['user1', 'user2'] }
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  sender_profile?: {
    full_name: string;
    avatar_url?: string | null;
    equipped_frame_code?: string | null;
  };
  reply_message?: {
    message_text: string;
    sender_name: string;
  };
}

const EMOJI_REACTIONS = ['👍', '❤️', '👏', '🎉', '🔥', '😮'];

export const ClassroomChat = ({ classId }: { classId: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ClassMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Active Actions State
  const [replyingTo, setReplyingTo] = useState<ClassMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ClassMessage | null>(null);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('class_messages')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for senders
      const senderIds = Array.from(new Set((data || []).map(m => m.sender_id)));
      const profileMap = new Map<string, any>();
      if (senderIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, equipped_frame_code')
          .in('id', senderIds);

        if (profs) {
          profs.forEach(p => profileMap.set(p.id, p));
        }
      }

      const formatted: ClassMessage[] = ((data || []) as any[]).map((m: any) => ({
        ...m,
        sender_profile: profileMap.get(m.sender_id) || { full_name: 'Thành viên' },
      }));

      setMessages(formatted);
    } catch (err) {
      console.error('Error fetching class messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to Supabase Realtime changes for class_messages
    const channel = supabase
      .channel(`class-chat-${classId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_messages', filter: `class_id=eq.${classId}` },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user || !inputText.trim()) return;

    setSending(true);
    try {
      if (editingMessage) {
        // Edit message
        await supabase
          .from('class_messages')
          .update({
            message_text: inputText.trim(),
            is_edited: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingMessage.id);

        setEditingMessage(null);
      } else {
        // Send new message
        await supabase.from('class_messages').insert({
          class_id: classId,
          sender_id: user.id,
          message_text: inputText.trim(),
          reply_to_id: replyingTo?.id || null,
        });

        setReplyingTo(null);
      }

      setInputText('');
      fetchMessages();
    } catch (err: any) {
      toast({ title: 'Lỗi gửi tin nhắn', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleToggleReaction = async (msg: ClassMessage, emoji: string) => {
    if (!user) return;

    const currentReactions: Record<string, string[]> = msg.reactions || {};
    const userList = currentReactions[emoji] || [];

    const hasReacted = userList.includes(user.id);
    const updatedUsers = hasReacted
      ? userList.filter(id => id !== user.id)
      : [...userList, user.id];

    const updatedReactions = { ...currentReactions, [emoji]: updatedUsers };

    await supabase
      .from('class_messages')
      .update({ reactions: updatedReactions })
      .eq('id', msg.id);

    fetchMessages();
  };

  const handleUnsendMessage = async (msg: ClassMessage) => {
    if (!user) return;
    if (!confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này không?')) return;

    await supabase
      .from('class_messages')
      .update({ is_deleted: true, message_text: 'Tin nhắn đã bị thu hồi' })
      .eq('id', msg.id);

    toast({ title: 'Đã thu hồi tin nhắn' });
    fetchMessages();
  };

  return (
    <Card className="border-2 shadow-lg flex flex-col h-[600px] overflow-hidden bg-card">
      <CardHeader className="bg-muted/40 border-b py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary animate-pulse" />
          <div>
            <CardTitle className="text-base font-extrabold text-foreground">Thảo Luận Lớp Học Real-Time</CardTitle>
            <CardDescription className="text-[11px]">Bảo mật chỉ Giáo viên & Học viên trong lớp xem được</CardDescription>
          </div>
        </div>

        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Realtime Active
        </Badge>
      </CardHeader>

      {/* Messages List Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
        {loading ? (
          <div className="flex justify-center items-center h-full text-xs text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải thảo luận lớp học...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-xs text-muted-foreground space-y-2">
            <MessageSquare className="w-10 h-10 mx-auto opacity-30 text-primary" />
            <p className="font-bold text-sm text-foreground">Chưa có tin nhắn nào trong lớp học này.</p>
            <p>Hãy mở lời gửi lời chào đầu tiên đến thầy cô và bạn bè!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.sender_id === user?.id;
            const replyMsg = messages.find(m => m.id === msg.reply_to_id);

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] group ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <AvatarWithDecoration
                  userId={msg.sender_id}
                  avatarUrl={msg.sender_profile?.avatar_url}
                  name={msg.sender_profile?.full_name}
                  frameCode={msg.sender_profile?.equipped_frame_code}
                  size="sm"
                  className="mt-1 shrink-0"
                />

                <div className={`space-y-1 ${isSelf ? 'items-end text-right' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold px-1">
                    <span>{msg.sender_profile?.full_name || 'Thành viên'}</span>
                    <span>•</span>
                    <span className="text-[10px]">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Quoted Reply Message Preview */}
                  {replyMsg && (
                    <div className="text-[11px] p-2 rounded-xl bg-muted/60 border-l-4 border-primary text-muted-foreground line-clamp-1 italic">
                      Replying to <span className="font-bold">{replyMsg.sender_profile?.full_name}</span>: "{replyMsg.message_text}"
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed relative border shadow-xs transition-all ${
                      msg.is_deleted
                        ? 'bg-muted/40 text-muted-foreground italic'
                        : isSelf
                        ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                        : 'bg-card text-foreground rounded-tl-none border-border'
                    }`}
                  >
                    {msg.message_text}
                    {msg.is_edited && <span className="text-[9px] opacity-70 ml-1.5">(đã sửa)</span>}
                  </div>

                  {/* Reactions Display */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                        if (!userIds || userIds.length === 0) return null;
                        const hasReacted = userIds.includes(user?.id || '');
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg, emoji)}
                            className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 transition-all ${
                              hasReacted ? 'bg-primary/20 border-primary text-primary font-bold' : 'bg-card border-border hover:bg-muted'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Action Bar (Hover Trigger) */}
                  {!msg.is_deleted && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pt-1">
                      {EMOJI_REACTIONS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg, emoji)}
                          className="hover:scale-125 transition-transform p-0.5 text-xs"
                        >
                          {emoji}
                        </button>
                      ))}

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => setReplyingTo(msg)}
                        title="Trả lời"
                      >
                        <Reply className="w-3 h-3" />
                      </Button>

                      {isSelf && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => { setEditingMessage(msg); setInputText(msg.message_text); }}
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-rose-500 hover:text-rose-600"
                            onClick={() => handleUnsendMessage(msg)}
                            title="Thu hồi"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input Bar */}
      <div className="p-3 border-t bg-card space-y-2">
        {/* Reply/Edit Banner Preview */}
        {(replyingTo || editingMessage) && (
          <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-primary/10 border border-primary/20">
            <span className="font-semibold truncate">
              {editingMessage ? '📝 Đang chỉnh sửa tin nhắn...' : `💬 Đang trả lời ${replyingTo?.sender_profile?.full_name}...`}
            </span>
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => { setReplyingTo(null); setEditingMessage(null); setInputText(''); }}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập tin nhắn thảo luận cùng lớp..."
            className="flex-1 h-10 text-xs rounded-xl"
          />
          <Button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="h-10 px-4 rounded-xl font-bold gap-1.5 bg-primary text-primary-foreground"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {editingMessage ? 'Lưu' : 'Gửi'}
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default ClassroomChat;

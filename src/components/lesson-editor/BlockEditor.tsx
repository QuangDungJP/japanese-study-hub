import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, Copy, GripVertical, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { BLOCK_ICONS, BLOCK_LABELS, BlockKind, LessonBlock, cloneBlock, makeBlock } from '@/lib/lessonBlocks';
import { cn } from '@/lib/utils';
import AICopilot from './AICopilot';

interface Props {
  value: LessonBlock[];
  onChange: (blocks: LessonBlock[]) => void;
  lessonTitle?: string;
  lessonLevel?: string;
}

const KIND_ORDER: BlockKind[] = [
  'heading', 'paragraph', 'callout', 'image', 'video', 'audio', 'embed', 'vocabulary', 'quiz', 'divider',
];

const BlockEditor = ({ value, onChange, lessonTitle, lessonLevel }: Props) => {
  const [showAI, setShowAI] = useState(true);
  const blocks = value || [];

  const set = (i: number, updater: (b: LessonBlock) => LessonBlock) =>
    onChange(blocks.map((b, idx) => (idx === i ? updater(b) : b)));

  const setData = (i: number, patch: Record<string, any>) =>
    set(i, (b) => ({ ...b, data: { ...b.data, ...patch } }));

  const insertAt = (i: number, kind: BlockKind) => {
    const next = [...blocks];
    next.splice(i, 0, makeBlock(kind));
    onChange(next);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const duplicate = (i: number) => {
    const next = [...blocks];
    next.splice(i + 1, 0, cloneBlock(blocks[i]));
    onChange(next);
  };

  const remove = (i: number) => onChange(blocks.filter((_, idx) => idx !== i));

  const appendMany = (list: LessonBlock[]) => onChange([...blocks, ...list]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Canvas */}
      <div className="space-y-2 min-w-0">
        {blocks.length === 0 && (
          <Card className="border-dashed p-10 text-center text-muted-foreground space-y-3">
            <div className="text-4xl">✨</div>
            <p className="text-sm">Chưa có block nào. Thêm block đầu tiên hoặc dùng AI Copilot bên phải.</p>
            <BlockAddMenu onPick={(k) => insertAt(0, k)} />
          </Card>
        )}

        {blocks.map((b, i) => (
          <div key={b.id} className="group relative">
            <div className="absolute -left-9 top-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, -1)} title="Lên"><ArrowUp className="w-3 h-3" /></Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, 1)} title="Xuống"><ArrowDown className="w-3 h-3" /></Button>
            </div>
            <Card className="p-3 border-l-4 border-l-transparent hover:border-l-primary/40 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {BLOCK_ICONS[b.kind]} {BLOCK_LABELS[b.kind]}
                </span>
                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => duplicate(i)} title="Nhân bản"><Copy className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(i)} title="Xóa"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <BlockBody block={b} onData={(p) => setData(i, p)} />
            </Card>
            <div className="flex justify-center py-1 opacity-0 group-hover:opacity-100 transition">
              <BlockAddMenu onPick={(k) => insertAt(i + 1, k)} compact />
            </div>
          </div>
        ))}

        {blocks.length > 0 && (
          <div className="pt-2 flex justify-center">
            <BlockAddMenu onPick={(k) => insertAt(blocks.length, k)} />
          </div>
        )}
      </div>

      {/* AI Copilot */}
      <div className="lg:sticky lg:top-4 h-fit">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI Copilot
          </p>
          <Button size="sm" variant="ghost" onClick={() => setShowAI((v) => !v)}>
            {showAI ? <X className="w-3 h-3" /> : 'Mở'}
          </Button>
        </div>
        {showAI && (
          <AICopilot
            lessonTitle={lessonTitle || ''}
            lessonLevel={lessonLevel || ''}
            onInsert={appendMany}
          />
        )}
      </div>
    </div>
  );
};

const BlockAddMenu = ({ onPick, compact }: { onPick: (k: BlockKind) => void; compact?: boolean }) => {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button variant={compact ? 'ghost' : 'outline'} size="sm" onClick={() => setOpen(true)} className={cn(compact && 'h-6 text-xs text-muted-foreground')}>
        <Plus className="w-3 h-3 mr-1" /> Thêm block
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap gap-1 justify-center p-2 rounded-xl border bg-card shadow-sm">
      {KIND_ORDER.map((k) => (
        <Button key={k} size="sm" variant="ghost" onClick={() => { onPick(k); setOpen(false); }} className="text-xs">
          <span className="mr-1">{BLOCK_ICONS[k]}</span>{BLOCK_LABELS[k]}
        </Button>
      ))}
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpen(false)}><X className="w-3 h-3" /></Button>
    </div>
  );
};

const BlockBody = ({ block, onData }: { block: LessonBlock; onData: (p: Record<string, any>) => void }) => {
  const d = block.data;
  switch (block.kind) {
    case 'heading':
      return (
        <div className="flex gap-2">
          <Select value={String(d.level || 2)} onValueChange={(v) => onData({ level: Number(v) })}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">H1</SelectItem>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
            </SelectContent>
          </Select>
          <Input value={d.text || ''} onChange={(e) => onData({ text: e.target.value })} placeholder="Tiêu đề…" className="text-lg font-semibold" />
        </div>
      );
    case 'paragraph':
      return <Textarea value={d.text || ''} onChange={(e) => onData({ text: e.target.value })} placeholder="Nội dung đoạn văn…" rows={3} />;
    case 'callout':
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input value={d.emoji || ''} onChange={(e) => onData({ emoji: e.target.value })} className="w-16 text-center" placeholder="💡" />
            <Select value={d.tone || 'info'} onValueChange={(v) => onData({ tone: v })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Thông tin</SelectItem>
                <SelectItem value="tip">Mẹo</SelectItem>
                <SelectItem value="warning">Cảnh báo</SelectItem>
                <SelectItem value="success">Thành công</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea value={d.text || ''} onChange={(e) => onData({ text: e.target.value })} placeholder="Ghi chú nổi bật…" rows={2} />
        </div>
      );
    case 'image':
    case 'video':
    case 'audio':
      return (
        <div className="space-y-2">
          <Input value={d.url || ''} onChange={(e) => onData({ url: e.target.value })} placeholder="URL (dán link ảnh/video/YouTube/mp3)…" />
          <Input value={d.caption || ''} onChange={(e) => onData({ caption: e.target.value })} placeholder="Chú thích (tùy chọn)" />
        </div>
      );
    case 'embed':
      return (
        <div className="space-y-2">
          <Input value={d.url || ''} onChange={(e) => onData({ url: e.target.value })} placeholder="URL PDF / Google Slide / DOCX…" />
          <Input value={d.title || ''} onChange={(e) => onData({ title: e.target.value })} placeholder="Tiêu đề hiển thị" />
        </div>
      );
    case 'vocabulary': {
      const items = Array.isArray(d.items) ? d.items : [];
      return (
        <div className="space-y-2">
          {items.map((it: any, idx: number) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_1.5fr_auto] gap-2">
              <Input value={it.term || ''} onChange={(e) => onData({ items: items.map((x: any, j: number) => j === idx ? { ...x, term: e.target.value } : x) })} placeholder="Từ" />
              <Input value={it.reading || ''} onChange={(e) => onData({ items: items.map((x: any, j: number) => j === idx ? { ...x, reading: e.target.value } : x) })} placeholder="Cách đọc" />
              <Input value={it.meaning || ''} onChange={(e) => onData({ items: items.map((x: any, j: number) => j === idx ? { ...x, meaning: e.target.value } : x) })} placeholder="Nghĩa" />
              <Button size="icon" variant="ghost" onClick={() => onData({ items: items.filter((_: any, j: number) => j !== idx) })}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => onData({ items: [...items, { term: '', reading: '', meaning: '' }] })}><Plus className="w-3 h-3 mr-1" />Thêm từ</Button>
        </div>
      );
    }
    case 'quiz': {
      const choices: string[] = Array.isArray(d.choices) ? d.choices : ['', '', '', ''];
      return (
        <div className="space-y-2">
          <Input value={d.question || ''} onChange={(e) => onData({ question: e.target.value })} placeholder="Câu hỏi…" />
          <div className="space-y-1">
            {choices.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="radio" checked={d.answer === idx} onChange={() => onData({ answer: idx })} />
                <Input value={c} onChange={(e) => onData({ choices: choices.map((x, j) => (j === idx ? e.target.value : x)) })} placeholder={`Đáp án ${idx + 1}`} />
              </div>
            ))}
          </div>
          <Textarea value={d.explanation || ''} onChange={(e) => onData({ explanation: e.target.value })} placeholder="Giải thích (hiện sau khi trả lời)" rows={2} />
        </div>
      );
    }
    case 'divider':
      return <div className="border-t border-dashed" />;
    default:
      return null;
  }
};

export default BlockEditor;
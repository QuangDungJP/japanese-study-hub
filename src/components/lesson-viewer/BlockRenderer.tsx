import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { LessonBlock } from '@/lib/lessonBlocks';
import { cn } from '@/lib/utils';

const toneClass: Record<string, string> = {
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200',
  tip: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200',
  success: 'bg-green-500/10 border-green-500/30 text-green-900 dark:text-green-200',
};

const ytEmbed = (u: string) => {
  const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

const officeEmbed = (u: string) => {
  if (/\.(docx?|pptx?|xlsx?)($|\?)/i.test(u)) return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(u)}`;
  return null;
};

const BlockRenderer = ({ blocks }: { blocks: LessonBlock[] }) => {
  return (
    <div className="space-y-6">
      {blocks.map((b) => <BlockView key={b.id} block={b} />)}
    </div>
  );
};

const BlockView = ({ block }: { block: LessonBlock }) => {
  const d = block.data || {};
  switch (block.kind) {
    case 'heading': {
      const level = Math.min(3, Math.max(1, Number(d.level) || 2));
      const cls = level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl';
      const Tag = (`h${level}` as unknown) as keyof JSX.IntrinsicElements;
      return <Tag className={`${cls} font-bold leading-tight`}>{d.text || 'Tiêu đề'}</Tag>;
    }
    case 'paragraph':
      return <p className="text-base leading-relaxed whitespace-pre-line text-foreground/90">{d.text}</p>;
    case 'callout':
      return (
        <div className={cn('rounded-xl border p-4 flex gap-3', toneClass[d.tone] || toneClass.info)}>
          <span className="text-2xl leading-none">{d.emoji || '💡'}</span>
          <p className="text-sm leading-relaxed whitespace-pre-line">{d.text}</p>
        </div>
      );
    case 'image':
      return d.url ? (
        <figure className="space-y-2">
          <img src={d.url} alt={d.caption || ''} className="w-full rounded-xl border" />
          {d.caption && <figcaption className="text-center text-sm text-muted-foreground">{d.caption}</figcaption>}
        </figure>
      ) : null;
    case 'video': {
      if (!d.url) return null;
      const yt = ytEmbed(d.url);
      return (
        <figure className="space-y-2">
          <div className="aspect-video rounded-xl overflow-hidden bg-black border">
            {yt ? (
              <iframe src={yt} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media; picture-in-picture" />
            ) : (
              <video src={d.url} controls className="w-full h-full" />
            )}
          </div>
          {d.caption && <figcaption className="text-center text-sm text-muted-foreground">{d.caption}</figcaption>}
        </figure>
      );
    }
    case 'audio':
      return d.url ? (
        <div className="space-y-1">
          <audio src={d.url} controls className="w-full" />
          {d.caption && <p className="text-sm text-muted-foreground">{d.caption}</p>}
        </div>
      ) : null;
    case 'embed': {
      if (!d.url) return null;
      const office = officeEmbed(d.url);
      const isPdf = /\.pdf($|\?)/i.test(d.url);
      const src = office || d.url;
      return (
        <Card className="overflow-hidden">
          {d.title && <div className="px-4 py-2 border-b text-sm font-medium">{d.title}</div>}
          {(office || isPdf) ? (
            <iframe src={src} className="w-full h-[70vh]" title={d.title || 'embed'} />
          ) : (
            <a href={d.url} target="_blank" rel="noreferrer" className="p-4 block text-primary underline text-sm">{d.title || d.url}</a>
          )}
        </Card>
      );
    }
    case 'vocabulary': {
      const items = Array.isArray(d.items) ? d.items : [];
      return (
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Từ vựng</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((it: any, i: number) => (
              <div key={i} className="rounded-lg border p-3 hover:border-primary/40 transition">
                <div className="font-bold text-lg">{it.term}</div>
                {it.reading && <div className="text-xs text-muted-foreground">{it.reading}</div>}
                <div className="text-sm mt-1">{it.meaning}</div>
              </div>
            ))}
          </div>
        </Card>
      );
    }
    case 'quiz':
      return <QuizBlock data={d} />;
    case 'divider':
      return <hr className="border-dashed" />;
    default:
      return null;
  }
};

const QuizBlock = ({ data }: { data: any }) => {
  const [picked, setPicked] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const choices: string[] = Array.isArray(data.choices) ? data.choices : [];
  const answer = Number(data.answer) || 0;
  return (
    <Card className="p-4 space-y-3 border-l-4 border-l-primary">
      <p className="font-semibold">{data.question}</p>
      <div className="space-y-2">
        {choices.map((c, i) => {
          const isPicked = picked === i;
          const isRight = reveal && i === answer;
          const isWrong = reveal && isPicked && i !== answer;
          return (
            <button
              key={i}
              onClick={() => { setPicked(i); setReveal(true); }}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition text-sm flex items-center gap-2',
                !reveal && 'hover:bg-muted',
                isRight && 'border-green-500 bg-green-500/10',
                isWrong && 'border-red-500 bg-red-500/10',
                !reveal && isPicked && 'border-primary bg-primary/5',
              )}
            >
              {isRight && <Check className="w-4 h-4 text-green-600" />}
              {isWrong && <X className="w-4 h-4 text-red-600" />}
              {!reveal && <span className="w-5 h-5 rounded-full border text-xs flex items-center justify-center">{String.fromCharCode(65 + i)}</span>}
              <span className="flex-1">{c}</span>
            </button>
          );
        })}
      </div>
      {reveal && data.explanation && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <span className="font-medium">Giải thích: </span>{data.explanation}
        </div>
      )}
      {reveal && (
        <Button size="sm" variant="ghost" onClick={() => { setPicked(null); setReveal(false); }}>Làm lại</Button>
      )}
    </Card>
  );
};

export default BlockRenderer;
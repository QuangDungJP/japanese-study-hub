// Block schema for the Notion-style lesson editor.
// Stored inside `lessons.content` as { version:1, blocks: LessonBlock[] }.

export type BlockKind =
  | 'heading'
  | 'paragraph'
  | 'callout'
  | 'image'
  | 'video'
  | 'audio'
  | 'embed'
  | 'vocabulary'
  | 'quiz'
  | 'divider';

export interface LessonBlock {
  id: string;
  kind: BlockKind;
  data: Record<string, any>;
}

export const BLOCK_LABELS: Record<BlockKind, string> = {
  heading: 'Tiêu đề',
  paragraph: 'Đoạn văn',
  callout: 'Ghi chú nổi bật',
  image: 'Hình ảnh',
  video: 'Video / YouTube',
  audio: 'Âm thanh',
  embed: 'Nhúng (PDF / Slide / Link)',
  vocabulary: 'Từ vựng',
  quiz: 'Câu hỏi nhanh',
  divider: 'Đường kẻ',
};

export const BLOCK_ICONS: Record<BlockKind, string> = {
  heading: 'H',
  paragraph: '¶',
  callout: '💡',
  image: '🖼️',
  video: '🎬',
  audio: '🎧',
  embed: '📎',
  vocabulary: '📚',
  quiz: '❓',
  divider: '—',
};

const uid = () => (globalThis.crypto?.randomUUID?.() || `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

export const makeBlock = (kind: BlockKind, data: Record<string, any> = {}): LessonBlock => {
  const defaults: Record<BlockKind, Record<string, any>> = {
    heading: { text: 'Tiêu đề mới', level: 2 },
    paragraph: { text: '' },
    callout: { text: '', emoji: '💡', tone: 'info' },
    image: { url: '', caption: '' },
    video: { url: '', caption: '' },
    audio: { url: '', caption: '' },
    embed: { url: '', title: '' },
    vocabulary: { items: [{ term: '', reading: '', meaning: '' }] },
    quiz: { question: '', choices: ['', '', '', ''], answer: 0, explanation: '' },
    divider: {},
  };
  return { id: uid(), kind, data: { ...defaults[kind], ...data } };
};

export const cloneBlock = (b: LessonBlock): LessonBlock => ({
  ...b,
  id: uid(),
  data: JSON.parse(JSON.stringify(b.data)),
});

export const isBlockArray = (v: any): v is LessonBlock[] =>
  Array.isArray(v) && v.every((x) => x && typeof x === 'object' && typeof x.kind === 'string');
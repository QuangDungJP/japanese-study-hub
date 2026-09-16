/**
 * Dịch vụ Quản lý Tài liệu Huấn luyện & Mẫu đề Tham chiếu cho Trợ lý AI Sinh Đề Thi JLPT
 */

export interface AITrainingDoc {
  id: string;
  title: string;
  level: string; // 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'all'
  skill: string; // 'all' | 'vocabulary' | 'grammar' | 'reading' | 'listening'
  content: string;
  file_name?: string;
  file_size?: number;
  created_at: string;
  is_active: boolean;
  source_type: 'preset' | 'uploaded' | 'pasted';
  author_name?: string;
}

const TRAINING_DOCS_KEY = 'tnqdo_ai_exam_training_docs';

// Bộ tài liệu mẫu & ma trận khảo thí chuẩn quốc tế được nạp sẵn
export const PRESET_TRAINING_DOCS: AITrainingDoc[] = [
  {
    id: 'preset-jlpt-matrix-n4',
    title: 'Ma trận cấu trúc đề chuẩn JLPT N4 (Chuẩn Khảo Thí Quốc Tế)',
    level: 'N4',
    skill: 'all',
    content: `[MA TRẬN ĐỀ THI JLPT N4]
1. KIẾN THỨC NGÔN NGỮ (TỪ VỰNG - CHỮ HÁN):
- Mondai 1: Cách đọc chữ Hán (9 câu - Kanji trong Minna no Nihongo bài 26-50).
- Mondai 2: Viết chữ Hán từ Hiragana (6 câu).
- Mondai 3: Tìm từ thích hợp theo ngữ cảnh (10 câu).
- Mondai 4: Chọn câu đồng nghĩa / diễn đạt tương đương (5 câu).
- Mondai 5: Cách dùng từ đúng trong câu (5 câu).

2. NGỮ PHÁP & ĐỌC HIỂU:
- Mondai 1: Lựa chọn mẫu ngữ pháp thích hợp (15 câu).
- Mondai 2: Ghép sao hoàn thành câu ngữ pháp (5 câu).
- Mondai 3: Điền từ vào đoạn văn ngữ pháp (5 câu).
- Mondai 4 (Đoạn ngắn): 4 bài đọc ngắn (mỗi bài ~100-150 chữ, 1 câu hỏi/bài).
- Mondai 5 (Đoạn trung văn): 2 bài đọc trung văn (mỗi bài ~450 chữ, có 2-3 câu hỏi con).
- Mondai 6 (Tìm kiếm thông tin): 1 bảng thông báo / quảng cáo / lịch trình (2 câu hỏi con).

3. NGHE HIỂU:
- Mondai 1: Nghe hiểu chủ đề (có tranh minh họa).
- Mondai 2: Nghe hiểu điểm chính (có thời gian đọc câu hỏi).
- Mondai 3: Nghe hiểu khái quát / lời thoại ngắn.
- Mondai 4: Nghe hiểu phản xạ nhanh.`,
    is_active: true,
    source_type: 'preset',
    created_at: '2026-01-01T00:00:00.000Z',
    author_name: 'Hội đồng Khảo thí Quang Dũng Nihongo',
  },
  {
    id: 'preset-reading-chum-n4',
    title: 'Mẫu Đoạn Trung Văn Đọc Hiểu N4 (Kèm 3 Câu Hỏi Con)',
    level: 'N4',
    skill: 'reading',
    content: `[BÀI ĐỌC MẪU - ĐOẠN TRUNG VĂN N4]
Tiêu đề: 日本のコンビニエンスストア (Cửa hàng tiện lợi Nhật Bản)
Bài đọc:
日本の町には、たくさんのコンビニエンスストア（コンビニ）があります。コンビニは２４時間開いていて、とても便利です。食べ物や飲み物はもちろん、雑誌や傘、ノートなども買うことができます。
また、買い物のほかに、電気代や水道代を払ったり、荷物を送ったりすることもできます。銀行のお金を下ろすことができるATMもあります。
外国から日本に来た人たちは、「日本のコンビニは何でもあって、本当に便利だ」と驚きます。しかし、夜遅くまで働いている店員さんは大変です。最近は、店員が足りないため、夜は店を閉めるコンビニも少しずつ増えてきました。

Câu hỏi con đính kèm:
1. コンビニでできないことは何ですか。
A. 食べ物を買うこと  B. 水道代を払うこと  C. 電車に乗ること  D. 荷物を送ること
(Đáp án đúng: C. Giải thích: Bài đọc không nhắc đến việc đi tàu ở cửa hàng tiện lợi)

2. 外国から来た人は、日本のコンビニについてどう思っていますか。
A. 何でもあって本当に便利だと思っている
B. 店員が優しくて親切だと思っている
C. 値段が高くて困ると思っている
D. 店が小さくて狭いと思っている
(Đáp án đúng: A. Dẫn chứng: 外国から日本に来た人たちは、「日本のコンビニは何でもあって、本当に便利だ」と驚きます)

3. 最近のコンビニはどうして夜に店を閉めることがありますか。
A. 電気代が高くなったから
B. 店員が足りなくなったから
C. お客さんが来なくなったから
D. 荷物を送る人が減ったから
(Đáp án đúng: B. Dẫn chứng: 最近は、店員が足りないため、夜は店を閉めるコンビニも少しずつ増えてきました)`,
    is_active: true,
    source_type: 'preset',
    created_at: '2026-01-01T00:00:00.000Z',
    author_name: 'Tài liệu Giảng viên Quang Dũng',
  },
  {
    id: 'preset-grammar-matrix-n3',
    title: 'Ma trận Ngữ pháp & Đọc hiểu Chùm N3',
    level: 'N3',
    skill: 'grammar',
    content: `[MA TRẬN NGỮ PHÁP N3 TRỌNG TÂM]
- Nhóm mục đích/nguyên nhân: ~わけだ, ~わけではない, ~わけがない, ~おかげで, ~せいで, ~によって
- Nhóm đối chiếu/nhượng bộ: ~に対して, ~反面, ~わりに, ~くせに, ~にもかかわらず, ~ものの
- Nhóm thời điểm/trạng thái: ~うちに, ~最中に, ~たとたん, ~つつある, ~っぱなし, ~だらけ
- Nhóm cảm xúc/bắt buộc: ~ざるを得ない, ~かねない, ~かねる, ~に違いない, ~はずがない
Yêu cầu sinh câu hỏi: Luôn có ngữ cảnh hội thoại công sở hoặc đời sống Nhật Bản, 4 phương án nhiễu logic, giải thích chi tiết vì sao đúng/sai.`,
    is_active: true,
    source_type: 'preset',
    created_at: '2026-01-01T00:00:00.000Z',
    author_name: 'Ban Học thuật JLPT Master',
  },
];

/**
 * Lấy toàn bộ danh sách tài liệu huấn luyện
 */
export function getTrainingDocs(): AITrainingDoc[] {
  try {
    const raw = localStorage.getItem(TRAINING_DOCS_KEY);
    if (raw) {
      const userDocs: AITrainingDoc[] = JSON.parse(raw);
      if (Array.isArray(userDocs)) {
        // Merge preset docs with user uploaded docs (presets that user deleted will be preserved or overridden)
        const userDocIds = new Set(userDocs.map((d) => d.id));
        const missingPresets = PRESET_TRAINING_DOCS.filter((p) => !userDocIds.has(p.id));
        return [...userDocs, ...missingPresets];
      }
    }
  } catch (e) {
    console.error('Error reading training docs:', e);
  }
  return PRESET_TRAINING_DOCS;
}

/**
 * Lưu danh sách tài liệu huấn luyện
 */
export function saveTrainingDocs(docs: AITrainingDoc[]) {
  try {
    localStorage.setItem(TRAINING_DOCS_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error('Error saving training docs:', e);
  }
}

/**
 * Thêm một tài liệu huấn luyện mới
 */
export function addTrainingDoc(doc: Omit<AITrainingDoc, 'id' | 'created_at'>): AITrainingDoc {
  const all = getTrainingDocs();
  const newDoc: AITrainingDoc = {
    ...doc,
    id: `train-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };
  const updated = [newDoc, ...all];
  saveTrainingDocs(updated);
  return newDoc;
}

/**
 * Xóa một tài liệu huấn luyện
 */
export function deleteTrainingDoc(id: string): boolean {
  const all = getTrainingDocs();
  const updated = all.filter((d) => d.id !== id);
  saveTrainingDocs(updated);
  return true;
}

/**
 * Bật/Tắt trạng thái áp dụng tài liệu
 */
export function toggleTrainingDocActive(id: string): boolean {
  const all = getTrainingDocs();
  const updated = all.map((d) => (d.id === id ? { ...d, is_active: !d.is_active } : d));
  saveTrainingDocs(updated);
  return true;
}

/**
 * Trích xuất nội dung huấn luyện cho AI sinh đề theo Cấp độ và Kỹ năng
 */
export function buildAIPromptGrounding(level: string, skill: string = 'all'): string {
  const all = getTrainingDocs();
  const normLevel = level.toUpperCase();

  const relevant = all.filter((doc) => {
    if (!doc.is_active) return false;
    const matchLevel = doc.level === 'all' || doc.level.toUpperCase() === normLevel;
    const matchSkill = skill === 'all' || doc.skill === 'all' || doc.skill === skill;
    return matchLevel && matchSkill;
  });

  if (relevant.length === 0) {
    return `[CƠ SỞ THAM CHIẾU JLPT ${level}]: Cấu trúc đề chuẩn quốc tế theo ma trận JLPT Nhật Bản, có đầy đủ các phần Từ vựng, Ngữ pháp, Đọc hiểu trung văn kèm câu hỏi con, và Nghe hiểu.`;
  }

  return relevant
    .map(
      (d, idx) =>
        `--- TÀI LIỆU THAM CHIẾU HUẤN LUYỆN #${idx + 1}: ${d.title} (Cấp độ: ${d.level}) ---\n${d.content.slice(0, 2000)}`
    )
    .join('\n\n');
}

import { supabase } from '@/integrations/supabase/client';

export interface SectionPassConfig {
  language?: number;  // Liệt Kiến thức ngôn ngữ (N1-N3: 19/60)
  reading?: number;   // Liệt Đọc hiểu (N1-N3: 19/60)
  listening: number;  // Liệt Nghe hiểu (19/60)
  combined?: number;  // Liệt Kiến thức ngôn ngữ & Đọc hiểu (N4-N5: 38/120)
}

export interface JLPTLevelScoringRule {
  level: string;
  totalMax: number;          // 180
  passingTotal: number;      // N5: 80, N4: 90, N3: 95, N2: 90, N1: 100
  durationMinutes: number;   // N5: 105, N4: 115, N3: 140, N2: 155, N1: 165
  difficultyFactor: number;  // 1.05
  sectionPass: SectionPassConfig;
  notes: string;
}

export interface ExamPool {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  order: number;
  created_at: string;
}

// Default International Standard JLPT Scoring Rules
export const DEFAULT_JLPT_SCORING_RULES: Record<string, JLPTLevelScoringRule> = {
  N5: {
    level: 'N5',
    totalMax: 180,
    passingTotal: 80,
    durationMinutes: 105,
    difficultyFactor: 1.05,
    sectionPass: {
      combined: 38, // Từ vựng + Ngữ pháp + Đọc hiểu tối thiểu 38/120
      listening: 19, // Nghe hiểu tối thiểu 19/60
    },
    notes: 'Sơ cấp 1. Gồm 2 phần thi: Kiến thức ngôn ngữ & Đọc hiểu (120đ, điểm liệt 38đ) và Nghe hiểu (60đ, điểm liệt 19đ).',
  },
  N4: {
    level: 'N4',
    totalMax: 180,
    passingTotal: 90,
    durationMinutes: 115,
    difficultyFactor: 1.05,
    sectionPass: {
      combined: 38, // Từ vựng + Ngữ pháp + Đọc hiểu tối thiểu 38/120
      listening: 19, // Nghe hiểu tối thiểu 19/60
    },
    notes: 'Sơ cấp 2. Gồm 2 phần thi: Kiến thức ngôn ngữ & Đọc hiểu (120đ, điểm liệt 38đ) và Nghe hiểu (60đ, điểm liệt 19đ).',
  },
  N3: {
    level: 'N3',
    totalMax: 180,
    passingTotal: 95,
    durationMinutes: 140,
    difficultyFactor: 1.05,
    sectionPass: {
      language: 19, // Kiến thức ngôn ngữ (Từ vựng, Ngữ pháp) tối thiểu 19/60
      reading: 19,  // Đọc hiểu tối thiểu 19/60
      listening: 19,// Nghe hiểu tối thiểu 19/60
    },
    notes: 'Trung cấp 1. Gồm 3 phần thi độc lập (mỗi phần 60đ, điểm liệt mỗi phần là 19đ).',
  },
  N2: {
    level: 'N2',
    totalMax: 180,
    passingTotal: 90,
    durationMinutes: 155,
    difficultyFactor: 1.05,
    sectionPass: {
      language: 19,
      reading: 19,
      listening: 19,
    },
    notes: 'Trung cấp 2. Gồm 3 phần thi độc lập (mỗi phần 60đ, điểm liệt mỗi phần là 19đ).',
  },
  N1: {
    level: 'N1',
    totalMax: 180,
    passingTotal: 100,
    durationMinutes: 165,
    difficultyFactor: 1.05,
    sectionPass: {
      language: 19,
      reading: 19,
      listening: 19,
    },
    notes: 'Cao cấp. Gồm 3 phần thi độc lập (mỗi phần 60đ, điểm liệt mỗi phần là 19đ).',
  },
};

// Default Exam Pools
export const DEFAULT_EXAM_POOLS: ExamPool[] = [
  {
    id: 'pool-1',
    name: 'Kho đề số 1 (Đề Chuẩn Khảo Thí Quốc Tế)',
    description: 'Bộ đề thi thử tiêu chuẩn đợt 1 dành cho học viên ôn luyện toàn diện.',
    is_active: true,
    order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'pool-2',
    name: 'Kho đề số 2 (Đề Luyện Thi Cấp Tốc)',
    description: 'Kho đề đợt 2 nâng cao tốc độ phản xạ và làm quen dạng đề biến thể.',
    is_active: false,
    order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'pool-3',
    name: 'Kho đề số 3 (Đề Chinh Phục Điểm Tuyệt Đối)',
    description: 'Bộ đề tổng hợp thử thách độ khó cao dành cho mục tiêu đạt điểm cao JLPT.',
    is_active: false,
    order: 3,
    created_at: new Date().toISOString(),
  },
];

const SCORING_RULES_STORAGE_KEY = 'tnqdo_jlpt_scoring_rules';
const EXAM_POOLS_STORAGE_KEY = 'tnqdo_jlpt_exam_pools';

/**
 * Lấy cấu hình thang điểm JLPT hiện hành
 */
export function getScoringRules(): Record<string, JLPTLevelScoringRule> {
  try {
    const saved = localStorage.getItem(SCORING_RULES_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_JLPT_SCORING_RULES, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading scoring rules:', e);
  }
  return DEFAULT_JLPT_SCORING_RULES;
}

/**
 * Lưu cấu hình thang điểm JLPT
 */
export function saveScoringRules(rules: Record<string, JLPTLevelScoringRule>) {
  try {
    localStorage.setItem(SCORING_RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch (e) {
    console.error('Error saving scoring rules:', e);
  }
}

/**
 * Lấy danh sách các Kho Đề hiện có
 */
export function getExamPools(): ExamPool[] {
  try {
    const saved = localStorage.getItem(EXAM_POOLS_STORAGE_KEY);
    if (saved) {
      const pools: ExamPool[] = JSON.parse(saved);
      if (Array.isArray(pools) && pools.length > 0) return pools;
    }
  } catch (e) {
    console.error('Error reading exam pools:', e);
  }
  return DEFAULT_EXAM_POOLS;
}

/**
 * Lưu danh sách Kho Đề
 */
export function saveExamPools(pools: ExamPool[]) {
  try {
    localStorage.setItem(EXAM_POOLS_STORAGE_KEY, JSON.stringify(pools));
  } catch (e) {
    console.error('Error saving exam pools:', e);
  }
}

/**
 * Lấy ID kho đề của một bài thi
 */
export function getExamPoolId(exam: any): string {
  // Check if questions has a pool_config entry
  if (Array.isArray(exam.questions)) {
    const poolConfig = exam.questions.find((q: any) => q.type === 'pool_config');
    if (poolConfig?.pool_id) return poolConfig.pool_id;
  }
  // Check custom fields or tags
  if (exam.custom_fields?.pool_id) return exam.custom_fields.pool_id;
  return 'pool-1'; // Default pool
}

/**
 * Gán đề thi vào một kho đề cụ thể
 */
export async function assignExamToPool(examId: string, poolId: string, poolName: string) {
  try {
    const { data: exam, error } = await supabase
      .from('exams')
      .select('questions')
      .eq('id', examId)
      .single();

    if (error) throw error;

    const existingQs = Array.isArray(exam.questions) ? exam.questions : [];
    const filteredQs = existingQs.filter((q: any) => q.type !== 'pool_config');
    const updatedQs = [...filteredQs, { type: 'pool_config', pool_id: poolId, pool_name: poolName }];

    const { error: updateError } = await supabase
      .from('exams')
      .update({ questions: updatedQs })
      .eq('id', examId);

    if (updateError) throw updateError;
    return true;
  } catch (e) {
    console.error('Failed to assign exam to pool:', e);
    return false;
  }
}

/**
 * Thuật toán bốc đề thi thông minh chống trùng đề (Anti-Duplicate Exam Assignment)
 * 1. Kiểm tra các đề thuộc Kho đề hiện tại (theo thứ tự ưu tiên các kho).
 * 2. Tìm đề mà học viên CHƯA TỪNG LÀM trong kho đó.
 * 3. Nếu còn đề chưa làm: trả về đề đó.
 * 4. Nếu đã làm hết kho 1: tự động chuyển sang kho 2, kho 3.
 * 5. Nếu đã làm hết tất cả các kho: xoay vòng lại từ kho 1.
 */
export function getNextUntakenExam(
  level: string,
  allExams: any[],
  studentCompletedExamIds: string[]
): {
  exam: any | null;
  currentPool: ExamPool;
  completedInPool: number;
  totalInPool: number;
  isAllPoolsCompleted: boolean;
  poolSwitched: boolean;
} {
  const pools = getExamPools();
  const normalizedLevel = level.toUpperCase();

  // Sort pools by order
  const sortedPools = [...pools].sort((a, b) => a.order - b.order);

  // Group exams by pool and level
  let selectedExam: any | null = null;
  let targetPool = sortedPools[0] || DEFAULT_EXAM_POOLS[0];
  let poolSwitched = false;
  let completedInPoolCount = 0;
  let totalInPoolCount = 0;

  for (let i = 0; i < sortedPools.length; i++) {
    const pool = sortedPools[i];
    const poolExams = allExams.filter((exam) => {
      const examLvl = (exam.exam_category || exam.level || 'N4').toUpperCase();
      if (examLvl !== normalizedLevel) return false;
      const examPoolId = getExamPoolId(exam);
      return examPoolId === pool.id;
    });

    if (poolExams.length === 0) continue;

    const untakenExams = poolExams.filter((exam) => !studentCompletedExamIds.includes(exam.id));
    const completedCount = poolExams.length - untakenExams.length;

    if (untakenExams.length > 0) {
      // Pick a random or sequential untaken exam from this pool
      selectedExam = untakenExams[Math.floor(Math.random() * untakenExams.length)];
      targetPool = pool;
      completedInPoolCount = completedCount;
      totalInPoolCount = poolExams.length;
      poolSwitched = i > 0;
      return {
        exam: selectedExam,
        currentPool: targetPool,
        completedInPool: completedInPoolCount,
        totalInPool: totalInPoolCount,
        isAllPoolsCompleted: false,
        poolSwitched,
      };
    }
  }

  // If student completed all exams across ALL pools:
  // Fall back to first pool and select the least recently completed or random
  const firstPoolExams = allExams.filter((exam) => {
    const examLvl = (exam.exam_category || exam.level || 'N4').toUpperCase();
    return examLvl === normalizedLevel;
  });

  if (firstPoolExams.length > 0) {
    selectedExam = firstPoolExams[Math.floor(Math.random() * firstPoolExams.length)];
  }

  return {
    exam: selectedExam,
    currentPool: sortedPools[0] || DEFAULT_EXAM_POOLS[0],
    completedInPool: firstPoolExams.length,
    totalInPool: firstPoolExams.length,
    isAllPoolsCompleted: true,
    poolSwitched: false,
  };
}

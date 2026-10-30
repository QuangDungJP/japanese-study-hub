// JLPT mastery % (N5–N1) — IRT-style scoring from practice/mock answers.
// Stored locally per user (localStorage) so the practice data never goes to Supabase.
export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
export type SkillGroup = 'vocabulary' | 'grammar' | 'reading' | 'listening';
export interface AnswerItem { level: string; skill?: string; correct: boolean; at?: number }

const rank = (l: string) => Math.max(0, LEVELS.indexOf((l || 'N4').toUpperCase() as JlptLevel));
const key = (uid: string) => `jlpt_mastery_${uid}`;
export const TARGET = 80; // % mastery treated as "nắm vững"

export function skillGroup(s?: string): SkillGroup {
  if (s === 'kanji' || s === 'vocabulary') return 'vocabulary';
  if (s === 'grammar') return 'grammar';
  if (s === 'listening' || s === 'kaiwa') return 'listening';
  return s === 'reading' ? 'reading' : 'vocabulary';
}

export function loadAnswers(uid: string): AnswerItem[] {
  try { return JSON.parse(localStorage.getItem(key(uid)) || '[]'); } catch { return []; }
}
export function recordAnswers(uid: string, items: AnswerItem[]) {
  const all = [...loadAnswers(uid), ...items.map(i => ({ ...i, at: Date.now() }))].slice(-3000);
  localStorage.setItem(key(uid), JSON.stringify(all));
}
export function resetMastery(uid: string) {
  localStorage.removeItem(key(uid));
  localStorage.removeItem(`mock_attempts_${uid}`);
}

/** Rasch (1PL) ability estimate θ. Item difficulty b: N5=-2 … N1=+2. MAP with N(0,1) prior. */
export function estimateTheta(items: AnswerItem[]): number {
  let t = 0;
  for (let it = 0; it < 25; it++) {
    let g = -t, h = -1;
    for (const a of items) {
      const b = rank(a.level) - 2;
      const p = 1 / (1 + Math.exp(-(t - b)));
      g += (a.correct ? 1 : 0) - p; h -= p * (1 - p);
    }
    t -= g / h;
  }
  return Math.max(-4, Math.min(4, t));
}
/** Level the learner currently sits at (θ rounded onto the N-scale). */
export const thetaLevel = (t: number): JlptLevel => LEVELS[Math.max(0, Math.min(4, Math.round(t + 2)))];

/**
 * Asymmetric credit (owner rule): for questions ABOVE the learner's current level,
 * a correct answer earns little credit (could be a guess, 3PL guessing≈0.25),
 * a wrong answer costs a heavy penalty. At/below level: normal 1:1.
 */
function credit(itemRank: number, learnerRank: number, correct: boolean) {
  const gap = itemRank - learnerRank;
  if (gap <= 0) return { earned: correct ? 1 : 0, weight: 1 };
  return correct ? { earned: 0.35 / gap, weight: 0.35 / gap } // small weight → small credit
                 : { earned: 0, weight: 1 + 0.75 * gap };   // heavy penalty
}

export interface LevelMastery { level: JlptLevel; pct: number; answered: number; bySkill: Record<SkillGroup, number | null> }
export function computeMastery(items: AnswerItem[]) {
  const theta = estimateTheta(items);
  const lr = rank(thetaLevel(theta));
  const levels: LevelMastery[] = LEVELS.map(level => {
    const lv = items.filter(a => rank(a.level) === rank(level));
    const agg = (arr: AnswerItem[]) => {
      let e = 0, w = 0;
      arr.forEach(a => { const c = credit(rank(a.level), lr, a.correct); e += c.earned; w += c.weight; });
      return w ? Math.round((e / w) * 100) : null;
    };
    const bySkill = { vocabulary: null, grammar: null, reading: null, listening: null } as Record<SkillGroup, number | null>;
    (Object.keys(bySkill) as SkillGroup[]).forEach(s => (bySkill[s] = agg(lv.filter(a => skillGroup(a.skill) === s))));
    return { level, pct: agg(lv) ?? 0, answered: lv.length, bySkill };
  });
  return { theta, level: thetaLevel(theta), levels, advice: advice(levels) };
}

/** e.g. "Bạn cần nắm vững thêm 40% kiến thức ngữ pháp để cải thiện trình độ N3 và N2." */
export function advice(levels: LevelMastery[]): string | null {
  const weak = levels.filter(l => l.answered >= 5 && l.pct < TARGET).sort((a, b) => b.pct - a.pct).slice(0, 2);
  if (!weak.length) return null;
  const sk: Record<string, number[]> = {};
  weak.forEach(l => Object.entries(l.bySkill).forEach(([s, v]) => v !== null && (sk[s] = [...(sk[s] || []), v])));
  const names: Record<string, string> = { vocabulary: 'từ vựng', grammar: 'ngữ pháp', reading: 'đọc hiểu', listening: 'nghe hiểu' };
  const worst = Object.entries(sk).map(([s, v]) => [s, v.reduce((a, b) => a + b, 0) / v.length] as const).sort((a, b) => a[1] - b[1])[0];
  const gap = Math.max(...weak.map(l => TARGET - l.pct));
  return `Bạn cần nắm vững thêm ${Math.round(gap)}% kiến thức ${worst ? names[worst[0]] : 'từ vựng và ngữ pháp'} để cải thiện trình độ ${weak.map(l => l.level).join(' và ')}.`;
}

/** Predict a real JLPT result for a level from θ (expected proportion correct × 180). */
const PASS: Record<JlptLevel, number> = { N1: 100, N2: 90, N3: 95, N4: 90, N5: 80 };
export function predictExam(theta: number, level: JlptLevel) {
  const p = 1 / (1 + Math.exp(-(theta - (rank(level) - 2))));
  const score = Math.round(180 * p);
  return { level, score, pass: PASS[level], passed: score >= PASS[level], probability: Math.round(p * 100) };
}

// Public practice runner: instant per-question grading + "why" explanations + IRT predicted JLPT score. No login needed.
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PublicExamRunner from '@/pages/public/PublicExamRunner';
import { getPracticePaper, explainQuestion } from '@/data/practicePapers';
import { estimateTheta, predictExam, recordAnswers, computeMastery, loadAnswers, type JlptLevel } from '@/lib/jlptMastery';
import { grantReward, addCoins } from '@/lib/rewards';
import { useAuth } from '@/hooks/useAuth';
import ExamThumb from './ExamThumb';

export function ThiThuRunner() {
  const { id } = useParams();
  return id?.startsWith('practice-') ? <PracticeRunner key={id} id={id} /> : <PublicExamRunner />;
}

const SKILL_VI: Record<string, string> = { vocabulary: 'Từ vựng', kanji: 'Chữ Hán', grammar: 'Ngữ pháp' };
const LETTERS = ['A', 'B', 'C', 'D'];
type Filter = 'all' | 'wrong' | 'right';

function ScoreRing({ value, max, ok }: { value: number; max: number; ok: boolean }) {
  const r = 52, c = 2 * Math.PI * r, pct = max ? value / max : 0;
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        className={`transition-all duration-1000 ${ok ? 'stroke-emerald-500' : 'stroke-rose-500'}`} />
      <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="rotate-90 fill-foreground text-[26px] font-black" style={{ transformOrigin: '60px 60px' }}>{value}/{max}</text>
    </svg>
  );
}

function PracticeRunner({ id }: { id: string }) {
  const paper = useMemo(() => getPracticePaper(id), [id]);
  const explains = useMemo(() => paper?.questions.map(explainQuestion) ?? [], [paper]);
  const { user } = useAuth() as any;
  const [ans, setAns] = useState<Record<number, number>>({});
  const [filter, setFilter] = useState<Filter>('all');
  const [secs, setSecs] = useState(0);
  const [done, setDone] = useState<null | { correct: number; pred: ReturnType<typeof predictExam>; reward: any; bySkill: Record<string, [number, number]> }>(null);
  useEffect(() => { if (done) return; const t = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(t); }, [done]);
  if (!paper) return <div className="p-10 text-center">Không tìm thấy đề. <Link className="underline" to="/thi-thu">Quay lại</Link></div>;

  const level = paper.level as JlptLevel;
  const qs = paper.questions as any[];
  const answered = Object.keys(ans).length;
  const liveCorrect = qs.filter((q, i) => ans[i] === q.correct_index).length;
  const n = Number(id.slice(-4));
  const nextId = `practice-${level}-${String(n % 400 + 1).padStart(4, '0')}`;
  const mmss = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  const pick = (i: number, k: number) => {
    if (ans[i] !== undefined || done) return;
    setAns(a => ({ ...a, [i]: k }));
  };
  const finish = () => {
    const items = qs.map((q, i) => ({ level: q.jlpt_level, skill: q.skill, correct: ans[i] === q.correct_index }));
    const correct = items.filter(x => x.correct).length;
    const bySkill: Record<string, [number, number]> = {};
    items.forEach(x => { const b = (bySkill[x.skill] ??= [0, 0]); b[1]++; if (x.correct) b[0]++; });
    let theta = estimateTheta(items), reward = null;
    if (user) { recordAnswers(user.id, items); addCoins(user.id, correct * 5); theta = computeMastery(loadAnswers(user.id)).theta; }
    const pred = predictExam(theta, level);
    if (user) reward = grantReward(user.id, pred.probability);
    setDone({ correct, pred, reward, bySkill }); setFilter('all'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const visible = (i: number) => !done || filter === 'all' || (filter === 'wrong') === (ans[i] !== qs[i].correct_index);
  const wrongCount = done ? qs.length - done.correct : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/60 via-background to-background dark:from-[#1a1426]">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-24">
        <div className="relative mb-6 overflow-hidden rounded-3xl border-4 border-[#3b2a1e] shadow-xl">
          <div className="aspect-[16/6]"><ExamThumb level={level} n={n} /></div>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">{paper.title_vi}</h1>
        <p className="mt-1 text-sm text-muted-foreground">20 câu · Từ vựng, chữ Hán, ngữ pháp · Chấm ngay & giải thích từng câu · Dự đoán điểm JLPT theo IRT</p>

        {/* sticky progress bar */}
        <div className="sticky top-16 z-20 -mx-4 mt-5 border-b bg-background/85 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-md bg-[#2a1f3d] px-2 py-0.5 font-bold text-amber-200">{level}</span>
            <span className="font-semibold">{answered}/{qs.length}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all" style={{ width: `${(answered / qs.length) * 100}%` }} />
            </div>
            <span className="text-emerald-600 font-semibold">✓ {liveCorrect}</span>
            <span className="text-rose-600 font-semibold">✗ {answered - liveCorrect}</span>
            <span className="tabular-nums text-muted-foreground">⏱ {mmss}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {qs.map((q, i) => { const p = ans[i]; const st = p === undefined ? 'bg-muted text-muted-foreground' : p === q.correct_index ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'; return (
              <a key={i} href={`#q${i + 1}`} className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition hover:scale-110 ${st}`}>{i + 1}</a>); })}
          </div>
        </div>

        {done && (
          <section className={`mt-6 rounded-3xl border-2 p-6 shadow-2xl ${done.pred.passed ? 'border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/30' : 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/30'}`}>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <ScoreRing value={done.correct} max={qs.length} ok={done.pred.passed} />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dự đoán điểm JLPT {level} (IRT)</p>
                <p className="text-4xl font-black">{done.pred.score}<span className="text-xl text-muted-foreground">/180</span></p>
                <p className="text-sm">Điểm đỗ {done.pred.pass} · Xác suất đỗ <b>{done.pred.probability}%</b> — {done.pred.passed ? 'khả năng đỗ cao 🎉' : 'cần luyện thêm 💪'}</p>
                <p className="mt-1 text-xs text-muted-foreground">Thời gian làm bài: {mmss}</p>
                {done.reward && <p className="mt-2 font-semibold text-amber-600">🎁 Nhận {done.reward.icon} {done.reward.name} (hạng {done.reward.tier})</p>}
                {!user && <p className="mt-2 text-xs text-muted-foreground"><Link to="/auth" className="underline">Đăng nhập</Link> để lưu tiến độ, nhận Mon và trang bị.</p>}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {Object.entries(done.bySkill).map(([s, [c, t]]) => (
                <div key={s} className="rounded-2xl bg-background/70 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{SKILL_VI[s] ?? s}</p>
                  <p className="text-xl font-bold">{c}/{t}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-amber-500" style={{ width: `${(c / t) * 100}%` }} /></div>
                </div>))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {([['all', `Tất cả (${qs.length})`], ['wrong', `Câu sai (${wrongCount})`], ['right', `Câu đúng (${done.correct})`]] as [Filter, string][]).map(([f, label]) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${filter === f ? 'bg-[#2a1f3d] text-amber-200' : 'border bg-background hover:bg-muted'}`}>{label}</button>))}
              <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
              <Link to={`/thi-thu/${nextId}`} className="rounded-full bg-amber-400 px-5 py-1.5 font-bold text-[#2a1f3d] shadow hover:bg-amber-300">Đề tiếp theo →</Link>
              <Link to="/thi-thu" className="rounded-full border px-4 py-1.5 text-sm">Kho đề</Link>
            </div>
          </section>
        )}

        <ol className="mt-6 space-y-5">
          {qs.map((q, i) => {
            if (!visible(i)) return null;
            const picked = ans[i]; const graded = picked !== undefined || !!done; const ok = picked === q.correct_index; const ex = explains[i];
            const harder = q.jlpt_level !== level;
            return (
              <li key={q.id} id={`q${i + 1}`} className={`scroll-mt-40 rounded-3xl border-2 bg-card p-5 shadow-sm transition ${!graded ? 'border-border' : ok ? 'border-emerald-300 dark:border-emerald-800' : 'border-rose-300 dark:border-rose-800'}`}>
                <div className="mb-3 flex items-center gap-2 text-xs">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#2a1f3d] text-sm font-black text-amber-200">{i + 1}</span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{SKILL_VI[q.skill] ?? q.skill}</span>
                  <span className={`rounded-full px-2.5 py-0.5 font-semibold ${harder ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200' : 'bg-muted text-muted-foreground'}`}>{q.jlpt_level}{harder ? ' · nâng cao' : ''}</span>
                  {graded && <span className={`ml-auto font-bold ${ok ? 'text-emerald-600' : 'text-rose-600'}`}>{picked === undefined ? 'Chưa trả lời' : ok ? '✓ Chính xác' : '✗ Chưa đúng'}</span>}
                </div>
                <p className="mb-4 whitespace-pre-line text-xl font-medium leading-relaxed" lang="ja">{q.text}</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {q.options.map((o: string, k: number) => {
                    const right = k === q.correct_index; const mine = k === picked;
                    const cls = !graded ? 'border-border hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50 hover:shadow dark:hover:bg-amber-950/20'
                      : right ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                      : mine ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-border opacity-60';
                    const badge = !graded ? 'bg-muted text-foreground' : right ? 'bg-emerald-500 text-white' : mine ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground';
                    return (
                      <button key={k} disabled={graded} onClick={() => pick(i, k)} className={`flex items-start gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition ${cls}`}>
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${badge}`}>{graded && right ? '✓' : graded && mine ? '✗' : LETTERS[k]}</span>
                        <span className="min-w-0">
                          <span className="block text-base font-medium" lang="ja">{o}{graded && mine && <span className="ml-2 text-xs font-semibold text-muted-foreground">(bạn chọn)</span>}</span>
                          {graded && ex?.notes[k] && <span className={`mt-0.5 block text-xs ${right ? 'text-emerald-700 dark:text-emerald-300' : mine ? 'text-rose-700 dark:text-rose-300' : 'text-muted-foreground'}`}>{ex.notes[k]}</span>}
                        </span>
                      </button>);
                  })}
                </div>
                {graded && ex && (
                  <div className={`mt-4 rounded-2xl border-l-4 p-4 text-sm ${ok ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20' : 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/20'}`}>
                    <p className="mb-1 font-bold">{ok ? '💡 Vì sao đúng?' : `💡 Vì sao sai? Đáp án đúng: ${LETTERS[q.correct_index]}. ${q.options[q.correct_index]}`}</p>
                    <p className="whitespace-pre-line leading-relaxed" lang="vi">{ex.why}</p>
                    {!ok && picked !== undefined && <p className="mt-1 text-rose-700 dark:text-rose-300">Bạn chọn 「{q.options[picked]}」: {ex.notes[picked]}</p>}
                  </div>)}
              </li>);
          })}
        </ol>
        {done && filter !== 'all' && qs.every((_, i) => !visible(i)) && <p className="mt-6 text-center text-muted-foreground">Không có câu nào trong mục này 🎉</p>}
        {!done && (
          <button disabled={answered < qs.length} onClick={finish} className="sticky bottom-4 mt-8 w-full rounded-full bg-[#2a1f3d] py-3.5 text-lg font-bold text-amber-200 shadow-2xl transition hover:brightness-125 disabled:opacity-50">
            {answered < qs.length ? `Còn ${qs.length - answered} câu chưa làm` : 'Nộp bài · Xem kết quả & dự đoán điểm'}
          </button>)}
      </div>
      <Footer />
    </main>
  );
}

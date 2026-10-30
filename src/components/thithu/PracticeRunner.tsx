// Public practice runner: instant per-question grading + IRT predicted JLPT score. No login needed.
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PublicExamRunner from '@/pages/public/PublicExamRunner';
import { getPracticePaper } from '@/data/practicePapers';
import { estimateTheta, predictExam, recordAnswers, computeMastery, loadAnswers, type JlptLevel } from '@/lib/jlptMastery';
import { grantReward, addCoins } from '@/lib/rewards';
import { useAuth } from '@/hooks/useAuth';
import ExamThumb from './ExamThumb';

export function ThiThuRunner() {
  const { id } = useParams();
  return id?.startsWith('practice-') ? <PracticeRunner id={id} /> : <PublicExamRunner />;
}

function PracticeRunner({ id }: { id: string }) {
  const paper = useMemo(() => getPracticePaper(id), [id]);
  const { user } = useAuth() as any;
  const [ans, setAns] = useState<Record<number, number>>({});
  const [done, setDone] = useState<null | { correct: number; pred: ReturnType<typeof predictExam>; reward: any }>(null);
  if (!paper) return <div className="p-10 text-center">Không tìm thấy đề. <Link className="underline" to="/thi-thu">Quay lại</Link></div>;
  const level = paper.level as JlptLevel;
  const qs = paper.questions;
  const answered = Object.keys(ans).length;
  const finish = () => {
    const items = qs.map((q: any, i: number) => ({ level: q.jlpt_level, skill: q.skill, correct: ans[i] === q.correct_index }));
    const correct = items.filter(x => x.correct).length;
    let theta = estimateTheta(items), reward = null;
    if (user) { recordAnswers(user.id, items); addCoins(user.id, correct * 5); theta = computeMastery(loadAnswers(user.id)).theta; }
    const pred = predictExam(theta, level);
    if (user) reward = grantReward(user.id, pred.probability);
    setDone({ correct, pred, reward }); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const n = Number(id.slice(-4));
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-24">
        <div className="mb-6 overflow-hidden rounded-2xl border-4 border-[#3b2a1e] shadow-xl"><div className="aspect-[16/6]"><ExamThumb level={level} n={n} /></div></div>
        <h1 className="font-serif text-3xl font-bold">{paper.title_vi}</h1>
        <p className="mb-6 text-sm text-muted-foreground">20 câu · chấm ngay khi chọn · {answered}/{qs.length} đã làm</p>
        {done && (
          <div className={`mb-8 rounded-3xl border-4 p-6 text-center shadow-2xl ${done.pred.passed ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-red-500 bg-red-50 dark:bg-red-950/30'}`}>
            <p className="text-6xl font-black">{done.correct}<span className="text-3xl text-muted-foreground">/{qs.length}</span></p>
            <p className="mt-2 text-lg">Dự đoán điểm thi thật JLPT {level} (IRT): <b>{done.pred.score}/180</b> · điểm đỗ {done.pred.pass}</p>
            <p className="text-sm">Xác suất đỗ ước tính: <b>{done.pred.probability}%</b> — {done.pred.passed ? 'khả năng ĐỖ 🎉' : 'cần luyện thêm 💪'}</p>
            {done.reward && <p className="mt-2 font-semibold text-amber-600">🎁 Nhận {done.reward.icon} {done.reward.name} (hạng {done.reward.tier})</p>}
            {!user && <p className="mt-2 text-xs text-muted-foreground"><Link to="/auth" className="underline">Đăng nhập</Link> để lưu tiến độ, nhận Mon và trang bị.</p>}
            <div className="mt-4 flex justify-center gap-3">
              <Link to={`/thi-thu/practice-${level}-${String(n % 400 + 1).padStart(4, '0')}`} onClick={() => { setAns({}); setDone(null); }} className="rounded-full bg-amber-400 px-5 py-2 font-bold text-[#2a1f3d]">Đề tiếp theo →</Link>
              <Link to="/thi-thu" className="rounded-full border px-5 py-2">Kho đề</Link>
            </div>
          </div>
        )}
        <ol className="space-y-5">
          {qs.map((q: any, i: number) => { const picked = ans[i]; const graded = picked !== undefined; return (
            <li key={q.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-xs"><span className="rounded bg-[#2a1f3d] px-2 py-0.5 font-bold text-amber-200">{q.jlpt_level}</span><span className="text-muted-foreground">Câu {i + 1} · {q.skill}</span></div>
              <p className="mb-3 whitespace-pre-line text-lg font-medium">{q.text}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o: string, k: number) => { const right = k === q.correct_index; const cls = !graded ? 'hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20' : right ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : k === picked ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'opacity-60'; return (
                  <button key={k} disabled={graded || !!done} onClick={() => setAns(a => ({ ...a, [i]: k }))} className={`rounded-xl border-2 px-4 py-2 text-left transition ${cls}`}>{graded && right ? '✓ ' : graded && k === picked ? '✗ ' : ''}{o}</button>); })}
              </div>
            </li>); })}
        </ol>
        {!done && <button disabled={answered < qs.length} onClick={finish} className="mt-8 w-full rounded-full bg-[#2a1f3d] py-3 text-lg font-bold text-amber-200 shadow-lg disabled:opacity-40">{answered < qs.length ? `Làm thêm ${qs.length - answered} câu` : 'Xem kết quả & dự đoán điểm'}</button>}
      </div>
      <Footer />
    </main>
  );
}

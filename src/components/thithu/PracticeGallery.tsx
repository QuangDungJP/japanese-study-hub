import { useState } from 'react';
import { Link } from 'react-router-dom';
import ExamThumb from './ExamThumb';
import { PAPERS_PER_LEVEL, PRACTICE_PAPER_COUNT, BANK_SIZE } from '@/data/practicePapers';
const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
const PER_PAGE = 24;
export default function PracticeGallery() {
  const [lv, setLv] = useState<(typeof LEVELS)[number]>('N4');
  const [page, setPage] = useState(0);
  const pages = Math.ceil(PAPERS_PER_LEVEL / PER_PAGE);
  const nums = Array.from({ length: PER_PAGE }, (_, i) => page * PER_PAGE + i + 1).filter(n => n <= PAPERS_PER_LEVEL);
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="relative mb-6 overflow-hidden rounded-[2rem] border-4 border-[#3b2a1e] bg-gradient-to-r from-[#140f22] via-[#2a1f3d] to-[#3b2a1e] p-6 text-amber-50 shadow-2xl">
        <p className="text-xs tracking-[0.35em] text-amber-300/80">道場 · 模擬試験</p>
        <h2 className="font-serif text-3xl font-bold">Kho {PRACTICE_PAPER_COUNT.toLocaleString('vi-VN')} đề luyện JLPT — chấm điểm ngay</h2>
        <p className="mt-1 text-sm text-amber-100/70">{PAPERS_PER_LEVEL} đề mỗi cấp N5–N1 · chấm từng câu tức thì · dự đoán điểm thi thật bằng IRT. Miễn phí, không cần đăng nhập.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {LEVELS.map(l => <button key={l} onClick={() => { setLv(l); setPage(0); }} className={`rounded-full px-5 py-2 font-bold transition ${lv === l ? 'bg-amber-400 text-[#2a1f3d] shadow-[0_0_20px_rgba(251,191,36,.5)]' : 'bg-white/10 hover:bg-white/20'}`}>{l}<span className="ml-1 text-xs opacity-70">({BANK_SIZE[l]?.words} từ)</span></button>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {nums.map(n => { const id = `practice-${lv}-${String(n).padStart(4, '0')}`; return (
          <Link key={id} to={`/thi-thu/${id}`} className="group overflow-hidden rounded-2xl border border-[#3b2a1e]/40 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="aspect-video overflow-hidden"><div className="h-full w-full transition duration-300 group-hover:scale-105"><ExamThumb level={lv} n={n} /></div></div>
            <div className="flex items-center justify-between px-3 py-2 text-sm"><span className="font-semibold">Đề {lv} #{n}</span><span className="text-xs text-muted-foreground">20 câu · 25′</span></div>
          </Link>); })}
      </div>
      <div className="mt-6 flex items-center justify-center gap-2">
        <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="rounded-full border px-4 py-1.5 disabled:opacity-40">‹</button>
        <span className="text-sm">Trang {page + 1}/{pages}</span>
        <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} className="rounded-full border px-4 py-1.5 disabled:opacity-40">›</button>
      </div>
    </section>
  );
}

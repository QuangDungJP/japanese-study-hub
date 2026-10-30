// HOME: JLPT mastery % (IRT) on a lofi-chill × samurai-dojo study desk (Nhã style).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { computeMastery, loadAnswers, resetMastery, predictExam, LEVELS } from '@/lib/jlptMastery';
import { randomPracticeId, PRACTICE_PAPER_COUNT } from '@/data/practicePapers';
import { claimEduAccount, getMyEduAccount, type EduGameAccount } from '@/lib/eduAccount';

/** Original procedural lofi (Web Audio, generated in-browser) — no third-party recording, no licence needed. */
function useLofi() {
  const ctx = useRef<AudioContext | null>(null); const timer = useRef<number>(); const [on, setOn] = useState(false);
  const stop = () => { window.clearInterval(timer.current); ctx.current?.close(); ctx.current = null; setOn(false); };
  const start = () => {
    const ac = new AudioContext(); ctx.current = ac; const out = ac.createGain(); out.gain.value = 0.08;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200; out.connect(lp).connect(ac.destination);
    const noise = ac.createBufferSource(); const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.15;
    noise.buffer = buf; noise.loop = true; const ng = ac.createGain(); ng.gain.value = 0.25; noise.connect(ng).connect(out); noise.start(); // rain
    const chords = [[220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 349.2], [164.8, 196, 246.9, 293.7]];
    let k = 0;
    const play = () => { const t = ac.currentTime; chords[k++ % 4].forEach(f => { const o = ac.createOscillator(); const g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.4); g.gain.exponentialRampToValueAtTime(0.001, t + 3.8); o.connect(g).connect(out); o.start(t); o.stop(t + 4); }); };
    play(); timer.current = window.setInterval(play, 4000); setOn(true);
  };
  useEffect(() => stop, []);
  return { on, toggle: () => (on ? stop() : start()) };
}

export default function MasteryLofiCard() {
  const { user } = useAuth() as any;
  const [ver, setVer] = useState(0);
  const m = useMemo(() => (user ? computeMastery(loadAnswers(user.id)) : null), [user, ver]);
  const lofi = useLofi();
  const [edu, setEdu] = useState<EduGameAccount | null>(null); const [eduErr, setEduErr] = useState('');
  useEffect(() => { if (user) getMyEduAccount().then(setEdu).catch(() => {}); }, [user]);
  const answered = m?.levels.reduce((a, l) => a + l.answered, 0) ?? 0;
  const pred = m ? predictExam(m.theta, m.level) : null;

  return (
    <section className="relative mx-auto my-12 max-w-6xl overflow-hidden rounded-[2rem] border-4 border-[#3b2a1e] bg-gradient-to-b from-[#1b1530] via-[#2a1f3d] to-[#3b2a1e] p-6 text-amber-50 shadow-2xl md:p-10">
      {/* window: night + rain */}
      <div className="pointer-events-none absolute right-6 top-6 hidden h-40 w-56 rounded-lg border-8 border-[#5a3e2b] bg-gradient-to-b from-indigo-900 to-fuchsia-900/70 md:block">
        <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(100deg,transparent_0_6px,rgba(255,255,255,.35)_6px_7px)] animate-pulse" />
        <div className="absolute right-4 top-3 h-8 w-8 rounded-full bg-amber-100 shadow-[0_0_30px_#fde68a]" />
      </div>
      {/* shoji grid + katana rack */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 opacity-15 [background:linear-gradient(#fff_1px,transparent_1px)_0_0/24px_24px,linear-gradient(90deg,#fff_1px,transparent_1px)_0_0/24px_24px]" />
      <div className="pointer-events-none absolute bottom-24 right-10 hidden md:block">
        <div className="h-1.5 w-52 -rotate-6 rounded-full bg-gradient-to-r from-zinc-300 via-zinc-100 to-[#7f1d1d]" />
        <div className="mt-3 h-1.5 w-44 -rotate-6 rounded-full bg-gradient-to-r from-zinc-300 via-zinc-100 to-[#7f1d1d]" />
        <div className="mt-2 h-3 w-56 rounded bg-[#5a3e2b]" />
      </div>
      <div className="relative z-10 max-w-3xl">
        <p className="text-sm tracking-[0.3em] text-amber-300/80">道場 · 勉強机 · LOFI</p>
        <h2 className="mt-1 font-serif text-3xl font-bold md:text-4xl">Bàn học võ đường của bạn</h2>
        {!user && <p className="mt-4 text-amber-100/80">Đăng nhập và làm đề luyện để xem mức độ nắm vững N5–N1 (chấm theo IRT).</p>}
        {user && answered === 0 && <p className="mt-4 text-amber-100/80">Chưa có dữ liệu — hãy làm 1 đề luyện (có {PRACTICE_PAPER_COUNT} đề trên site).</p>}
        {user && answered > 0 && m && (
          <>
            <p className="mt-4 text-lg">Bạn đang nắm vững: {m.levels.filter(l => l.answered).map(l => `${l.pct}% kiến thức ${l.level}`).join(' / ')}</p>
            {m.advice && <p className="mt-1 text-amber-300">→ {m.advice}</p>}
            <div className="mt-5 grid grid-cols-5 gap-3">
              {[...LEVELS].reverse().map(lv => { const l = m.levels.find(x => x.level === lv)!; return (
                <div key={lv} className="rounded-xl bg-black/30 p-3 text-center ring-1 ring-amber-200/20">
                  <div className="font-serif text-xl">{lv}</div>
                  <div className="mx-auto mt-2 h-20 w-3 overflow-hidden rounded-full bg-white/10"><div className="w-full bg-gradient-to-t from-red-700 to-amber-300" style={{ height: `${l.pct}%`, marginTop: `${100 - l.pct}%` }} /></div>
                  <div className="mt-1 text-sm">{l.answered ? `${l.pct}%` : '—'}</div>
                </div>); })}
            </div>
            {pred && <p className="mt-4 text-sm text-amber-100/80">Dự đoán thi thật JLPT {pred.level}: ~{pred.score}/180 (đỗ ≥ {pred.pass}) — {pred.passed ? 'khả năng ĐỖ' : 'chưa đủ, cần luyện thêm'}.</p>}
          </>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {user && <Link to={`/learn/mock-exams/${randomPracticeId(m?.level ?? 'N4')}`} className="rounded-full bg-amber-400 px-5 py-2 font-semibold text-[#2a1f3d] hover:bg-amber-300">Làm đề luyện ngẫu nhiên</Link>}
          <button onClick={lofi.toggle} className="rounded-full border border-amber-200/40 px-5 py-2 hover:bg-white/10">{lofi.on ? '⏸ Tắt nhạc lofi' : '♪ Nhạc lofi + mưa (tự tạo, miễn phí bản quyền)'}</button>
          {user && answered > 0 && <button onClick={() => { if (confirm('Xoá toàn bộ tiến độ luyện đề trên máy này?')) { resetMastery(user.id); setVer(v => v + 1); } }} className="rounded-full border border-red-300/40 px-5 py-2 text-red-200 hover:bg-red-900/30">Đặt lại tiến độ</button>}
          {user && (edu ? <span className="rounded-full bg-emerald-900/40 px-5 py-2 text-emerald-200">Game NihongoLife: {edu.game_username} · mã liên kết {edu.link_code}</span>
            : <button onClick={() => claimEduAccount().then(setEdu).catch(e => setEduErr(String(e.message || e)))} className="rounded-full border border-emerald-300/40 px-5 py-2 text-emerald-200 hover:bg-emerald-900/30">🎮 Nhận 1 tài khoản game miễn phí</button>)}
        </div>
        {eduErr && <p className="mt-2 text-xs text-red-300">{eduErr}</p>}
      </div>
    </section>
  );
}

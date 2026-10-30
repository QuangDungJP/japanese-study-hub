// Shared lofi × samurai-dojo banner for /admin and /teacher (pure CSS, no assets).
export default function RoleBanner({ role }: { role: 'admin' | 'teacher' }) {
  const h = new Date().getHours();
  const greet = h < 11 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const meta = role === 'admin'
    ? { kanji: '将', title: 'Bảng điều khiển Shōgun', sub: 'Quản trị toàn bộ võ đường Quang Dũng' }
    : { kanji: '師', title: 'Phòng giảng Sensei', sub: 'Lớp học, bài tập và học viên của bạn' };
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border-2 border-[#3b2a1e] bg-gradient-to-r from-[#140f22] via-[#2a1f3d] to-[#3b2a1e] px-5 py-4 text-amber-50 shadow-lg">
      <div className="pointer-events-none absolute inset-0 opacity-10 [background:linear-gradient(#fff_1px,transparent_1px)_0_0/22px_22px,linear-gradient(90deg,#fff_1px,transparent_1px)_0_0/22px_22px]" />
      <div className="pointer-events-none absolute -right-4 -top-6 select-none font-serif text-[7rem] leading-none text-red-700/30">{meta.kanji}</div>
      <div className="pointer-events-none absolute right-28 top-3 h-6 w-6 rounded-full bg-amber-100 shadow-[0_0_24px_#fde68a]" />
      <p className="relative text-xs tracking-[0.3em] text-amber-300/80">{greet.toUpperCase()} · 道場</p>
      <h1 className="relative font-serif text-2xl font-bold">{meta.title}</h1>
      <p className="relative text-sm text-amber-100/70">{meta.sub}</p>
    </div>
  );
}
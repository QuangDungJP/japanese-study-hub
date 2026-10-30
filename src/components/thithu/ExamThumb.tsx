// Lightweight SVG thumbnail (lofi night window + dojo + level kanji). No image files → 0 bandwidth.
const PAL: Record<string, [string, string, string]> = {
  N5: ['#0f766e', '#34d399', '五'], N4: ['#1d4ed8', '#60a5fa', '四'], N3: ['#7c3aed', '#c084fc', '三'],
  N2: ['#b91c1c', '#f87171', '二'], N1: ['#92400e', '#fbbf24', '一'],
};
export default function ExamThumb({ level, n }: { level: string; n?: number }) {
  const [a, b, k] = PAL[level] ?? PAL.N4;
  const id = `g${level}${n ?? ''}`;
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" role="img" aria-label={`JLPT ${level}`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#140f22" /><stop offset=".6" stopColor="#2a1f3d" /><stop offset="1" stopColor={a} /></linearGradient></defs>
      <rect width="320" height="180" fill={`url(#${id})`} />
      <g opacity=".12" stroke="#fff">{Array.from({ length: 14 }, (_, i) => <line key={i} x1={i * 24} y1="0" x2={i * 24} y2="180" />)}{Array.from({ length: 8 }, (_, i) => <line key={'h' + i} x1="0" y1={i * 24} x2="320" y2={i * 24} />)}</g>
      <rect x="196" y="18" width="104" height="70" rx="6" fill="#1e1b4b" stroke="#5a3e2b" strokeWidth="6" />
      <circle cx="276" cy="38" r="10" fill="#fef3c7" />
      {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1={204 + i * 16} y1="26" x2={198 + i * 16} y2="84" stroke="#fff" strokeOpacity=".25" />)}
      <rect x="0" y="146" width="320" height="34" fill="#3b2a1e" />
      <rect x="150" y="132" width="120" height="14" rx="3" fill="#5a3e2b" />
      <line x1="160" y1="122" x2="262" y2="112" stroke="#e5e7eb" strokeWidth="4" strokeLinecap="round" /><line x1="160" y1="122" x2="178" y2="120" stroke="#7f1d1d" strokeWidth="6" strokeLinecap="round" />
      <text x="20" y="118" fontSize="96" fontFamily="serif" fill={b} opacity=".9">{k}</text>
      <text x="22" y="40" fontSize="22" fontWeight="800" fill="#fef3c7" fontFamily="system-ui">JLPT {level}</text>
      {n !== undefined && <text x="22" y="62" fontSize="14" fill="#fde68a" fontFamily="system-ui">Đề số {n}</text>}
    </svg>
  );
}

import { useState } from 'react';
import { CATALOG, TIER_STYLE, equip, itemByCode, loadWardrobe } from '@/lib/rewards';
/** 2D samurai avatar wearing equipped cosmetics + wardrobe grid (homepage card / profile). */
export default function WardrobeAvatar({ userId, compact = false }: { userId: string; compact?: boolean }) {
  const [w, setW] = useState(() => loadWardrobe(userId));
  const h = itemByCode(w.equipped.helmet), a = itemByCode(w.equipped.armor), wp = itemByCode(w.equipped.weapon);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-40 w-32 rounded-2xl bg-gradient-to-b from-[#2a1f3d] to-[#3b2a1e] ring-2 ring-amber-300/40 shadow-[0_0_40px_rgba(251,191,36,.25)]">
        <div className="absolute left-1/2 top-6 h-10 w-10 -translate-x-1/2 rounded-full bg-[#f1c27d]" />
        {h && <div className="absolute left-1/2 top-1 -translate-x-1/2 text-4xl drop-shadow" title={h.name}>{h.icon}</div>}
        <div className="absolute left-1/2 top-16 h-16 w-16 -translate-x-1/2 rounded-xl" style={{ background: a?.color ?? '#334155' }} />
        {a && <div className="absolute left-1/2 top-[4.5rem] -translate-x-1/2 text-3xl" title={a.name}>{a.icon}</div>}
        {wp && <div className="absolute right-0 top-12 rotate-12 text-4xl drop-shadow" title={wp.name}>{wp.icon}</div>}
      </div>
      {!compact && (
        <div className="grid grid-cols-6 gap-2">
          {CATALOG.map(i => { const own = w.owned.includes(i.code); const on = Object.values(w.equipped).includes(i.code); return (
            <button key={i.code} disabled={!own} onClick={() => setW(equip(userId, i.code))} title={`${i.name} · ${i.tier}`}
              className={`relative h-11 w-11 rounded-lg bg-gradient-to-br text-xl transition hover:scale-110 ${own ? TIER_STYLE[i.tier] : 'from-zinc-800 to-zinc-700 opacity-40 grayscale'} ${on ? 'ring-2 ring-white' : ''}`}>
              {own ? i.icon : '🔒'}<span className="absolute -bottom-1 -right-1 rounded bg-black/70 px-1 text-[9px] text-white">{i.tier}</span>
            </button>); })}
        </div>
      )}
    </div>
  );
}

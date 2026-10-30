// Samurai Armory shop: buy cosmetics with Mon coins earned from practice exams (local, no DB).
import { useMemo, useState } from 'react';
import { CATALOG, TIER_STYLE, type Tier, type Slot, loadWardrobe, equip, buyItem, loadCoins, PRICE } from '@/lib/rewards';
import { useAuth } from '@/hooks/useAuth';
import WardrobeAvatar from './WardrobeAvatar';

const TIER_LABEL: Record<Tier, string> = { A: 'Thường', S: 'Hiếm', SS: 'Sử thi', SSR: 'Huyền thoại' };
const SLOT_LABEL: Record<Slot | 'all', string> = { all: 'Tất cả', helmet: 'Mũ', armor: 'Giáp', weapon: 'Vũ khí' };

export default function ArmoryShop() {
  const { user } = useAuth() as any;
  const [slot, setSlot] = useState<Slot | 'all'>('all');
  const [tier, setTier] = useState<Tier | 'all'>('all');
  const [tick, setTick] = useState(0);
  const [msg, setMsg] = useState('');
  const w = useMemo(() => (user ? loadWardrobe(user.id) : { owned: [], equipped: {} }), [user, tick]);
  const coins = useMemo(() => (user ? loadCoins(user.id) : 0), [user, tick]);
  const items = CATALOG.filter(i => (slot === 'all' || i.slot === slot) && (tier === 'all' || i.tier === tier));
  const act = (code: string) => {
    if (!user) return setMsg('Đăng nhập để mua trang bị.');
    if (w.owned.includes(code)) equip(user.id, code);
    else { const r = buyItem(user.id, code); setMsg(r.ok ? `Đã mua ${r.item?.icon} ${r.item?.name}!` : r.error || ''); }
    setTick(t => t + 1);
  };
  return (
    <section className="relative overflow-hidden rounded-[2rem] border-4 border-[#3b2a1e] bg-gradient-to-br from-[#140f22] via-[#2a1f3d] to-[#3b2a1e] p-6 text-amber-50 shadow-2xl md:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-red-700/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
        <div className="md:w-60">
          <p className="text-xs tracking-[0.35em] text-amber-300/80">武具店 · ARMORY</p>
          <h2 className="mt-1 font-serif text-3xl font-bold">Kho võ cụ Samurai</h2>
          <p className="mt-2 text-sm text-amber-100/70">Làm đề luyện để nhận đồng Mon (5 Mon/câu đúng) và trang bị miễn phí khi dự đoán đỗ ≥60%.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-lg font-bold ring-1 ring-amber-300/40">🪙 {coins} Mon</div>
          {user && <div className="mt-6"><WardrobeAvatar key={tick} userId={user.id} compact /></div>}
        </div>
        <div className="flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            {(['all', 'helmet', 'armor', 'weapon'] as const).map(s => <button key={s} onClick={() => setSlot(s)} className={`rounded-full px-4 py-1.5 text-sm transition ${slot === s ? 'bg-amber-400 text-[#2a1f3d]' : 'bg-white/10 hover:bg-white/20'}`}>{SLOT_LABEL[s]}</button>)}
            <span className="mx-2 w-px bg-white/20" />
            {(['all', 'A', 'S', 'SS', 'SSR'] as const).map(t => <button key={t} onClick={() => setTier(t)} className={`rounded-full px-4 py-1.5 text-sm transition ${tier === t ? 'bg-amber-400 text-[#2a1f3d]' : 'bg-white/10 hover:bg-white/20'}`}>{t === 'all' ? 'Mọi hạng' : t}</button>)}
          </div>
          {msg && <p className="mb-3 rounded-lg bg-black/30 px-3 py-2 text-sm text-amber-200">{msg}</p>}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map(i => { const own = w.owned.includes(i.code); const on = Object.values(w.equipped).includes(i.code); return (
              <div key={i.code} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br p-[2px] transition hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(251,191,36,.25)] ${TIER_STYLE[i.tier]}`}>
                <div className="flex h-full flex-col items-center rounded-[14px] bg-[#1b1530]/95 p-4 text-amber-50">
                  <span className={`absolute left-2 top-2 rounded-md bg-gradient-to-r px-2 py-0.5 text-[10px] font-black ${TIER_STYLE[i.tier]}`}>{i.tier}</span>
                  <div className="my-3 flex h-16 w-16 items-center justify-center rounded-full text-4xl transition group-hover:scale-110" style={{ background: `radial-gradient(circle, ${i.color}55, transparent 70%)` }}>{i.icon}</div>
                  <p className="text-center text-sm font-semibold leading-tight">{i.name}</p>
                  <p className="text-[11px] text-amber-200/60">{TIER_LABEL[i.tier]} · {SLOT_LABEL[i.slot]}</p>
                  <button onClick={() => act(i.code)} className={`mt-3 w-full rounded-full py-1.5 text-sm font-bold transition ${own ? (on ? 'bg-emerald-500 text-white' : 'bg-white/15 hover:bg-white/25') : coins >= PRICE[i.tier] ? 'bg-amber-400 text-[#2a1f3d] hover:bg-amber-300' : 'bg-white/10 text-white/50'}`}>
                    {own ? (on ? '✓ Đang mặc' : 'Mặc vào') : `🪙 ${PRICE[i.tier]}`}
                  </button>
                </div>
              </div>); })}
          </div>
        </div>
      </div>
    </section>
  );
}

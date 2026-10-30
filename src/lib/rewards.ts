// Cosmetic rewards for practice exams: predicted pass ≥60% → item by tier (A/S/SS/SSR). Stored locally per user.
export type Tier = 'A' | 'S' | 'SS' | 'SSR';
export type Slot = 'helmet' | 'armor' | 'weapon';
export interface Item { code: string; name: string; slot: Slot; tier: Tier; icon: string; color: string }
export const TIER_STYLE: Record<Tier, string> = {
  A: 'from-slate-400 to-slate-200 text-slate-900', S: 'from-sky-500 to-cyan-300 text-sky-950',
  SS: 'from-violet-600 to-fuchsia-400 text-white', SSR: 'from-amber-500 via-yellow-300 to-red-500 text-red-950 animate-pulse',
};
export const CATALOG: Item[] = [
  { code: 'helm_iron', name: 'Mũ sắt Ashigaru', slot: 'helmet', tier: 'A', icon: '⛑️', color: '#9ca3af' },
  { code: 'armor_leather', name: 'Giáp da luyện tập', slot: 'armor', tier: 'A', icon: '🦺', color: '#92400e' },
  { code: 'weapon_bokken', name: 'Kiếm gỗ Bokken', slot: 'weapon', tier: 'A', icon: '🪵', color: '#a16207' },
  { code: 'helm_kabuto', name: 'Mũ Kabuto thép', slot: 'helmet', tier: 'S', icon: '🪖', color: '#475569' },
  { code: 'armor_dou', name: 'Giáp ngực Dō', slot: 'armor', tier: 'S', icon: '🛡️', color: '#1e3a8a' },
  { code: 'weapon_yari', name: 'Giáo Yari', slot: 'weapon', tier: 'S', icon: '🔱', color: '#64748b' },
  { code: 'helm_oni', name: 'Mặt nạ Oni', slot: 'helmet', tier: 'SS', icon: '👹', color: '#b91c1c' },
  { code: 'armor_osode', name: 'Giáp Ō-yoroi đỏ', slot: 'armor', tier: 'SS', icon: '🥋', color: '#991b1b' },
  { code: 'weapon_katana', name: 'Katana Masamune', slot: 'weapon', tier: 'SS', icon: '🗡️', color: '#e5e7eb' },
  { code: 'helm_dragon', name: 'Kabuto Rồng Vàng', slot: 'helmet', tier: 'SSR', icon: '🐉', color: '#f59e0b' },
  { code: 'armor_shogun', name: 'Giáp Shōgun', slot: 'armor', tier: 'SSR', icon: '🏯', color: '#fbbf24' },
  { code: 'weapon_kusanagi', name: 'Thần kiếm Kusanagi', slot: 'weapon', tier: 'SSR', icon: '⚔️', color: '#fde68a' },
];

// Extra variants (generated): 4 tiers x 3 slots x 4 materials
const MATS: Record<Tier, [string, string][]> = {
  A: [['Đồng', '#b45309'], ['Sắt', '#9ca3af'], ['Tre', '#65a30d'], ['Vải chàm', '#1e40af']],
  S: [['Thép lam', '#0369a1'], ['Bạc', '#cbd5e1'], ['Sơn mài', '#7f1d1d'], ['Gió', '#0891b2']],
  SS: [['Hắc thiết', '#18181b'], ['Huyết ngọc', '#be123c'], ['Lôi thần', '#7c3aed'], ['Anh đào', '#f472b6']],
  SSR: [['Hoàng kim', '#f59e0b'], ['Phượng hoàng', '#ea580c'], ['Nguyệt quang', '#e0e7ff'], ['Long vương', '#facc15']],
};
const BASE: Record<Slot, [string, string]> = { helmet: ['Kabuto', '🪖'], armor: ['Giáp', '🛡️'], weapon: ['Katana', '🗡️'] };
const WEAPON_ALT = ['🗡️', '🔱', '🏹', '⚔️'];
(Object.keys(MATS) as Tier[]).forEach(t => MATS[t].forEach(([m, color], vi) => (Object.keys(BASE) as Slot[]).forEach(slot => {
  const [n, icon] = BASE[slot];
  CATALOG.push({ code: `${slot}_${t}_${vi}`.toLowerCase(), name: `${slot === 'weapon' ? ['Katana', 'Yari', 'Cung Yumi', 'Song kiếm'][vi] : n} ${m}`, slot, tier: t, icon: slot === 'weapon' ? WEAPON_ALT[vi] : icon, color });
})));
export const tierFor = (passPct: number): Tier | null => passPct >= 90 ? 'SSR' : passPct >= 80 ? 'SS' : passPct >= 70 ? 'S' : passPct >= 60 ? 'A' : null;
export interface Wardrobe { owned: string[]; equipped: Partial<Record<Slot, string>> }
const k = (u: string) => `qd_wardrobe_${u}`;
export function loadWardrobe(u: string): Wardrobe { try { return { owned: [], equipped: {}, ...JSON.parse(localStorage.getItem(k(u)) || '{}') }; } catch { return { owned: [], equipped: {} }; } }
const save = (u: string, w: Wardrobe) => localStorage.setItem(k(u), JSON.stringify(w));
/** Grant one random item of the earned tier (prefers unowned). Returns the item or null if <60%. */
export function grantReward(u: string, passPct: number): Item | null {
  const t = tierFor(passPct); if (!t) return null;
  const w = loadWardrobe(u); const pool = CATALOG.filter(i => i.tier === t);
  const fresh = pool.filter(i => !w.owned.includes(i.code)); const it = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length || pool.length))];
  if (!w.owned.includes(it.code)) w.owned.push(it.code);
  if (!w.equipped[it.slot]) w.equipped[it.slot] = it.code;
  save(u, w); return it;
}
export function equip(u: string, code: string) { const w = loadWardrobe(u); const it = CATALOG.find(i => i.code === code); if (it && w.owned.includes(code)) { w.equipped[it.slot] = w.equipped[it.slot] === code ? undefined : code; save(u, w); } return loadWardrobe(u); }
export const itemByCode = (c?: string) => CATALOG.find(i => i.code === c);

// Mon coins (local) + shop
export const PRICE: Record<Tier, number> = { A: 100, S: 250, SS: 600, SSR: 1500 };
const ck = (u: string) => `qd_mon_${u}`;
export const loadCoins = (u: string) => Number(localStorage.getItem(ck(u)) || 0);
export const addCoins = (u: string, n: number) => localStorage.setItem(ck(u), String(Math.max(0, loadCoins(u) + Math.round(n))));
export function buyItem(u: string, code: string): { ok: boolean; item?: Item; error?: string } {
  const it = itemByCode(code); if (!it) return { ok: false, error: 'Không tìm thấy vật phẩm' };
  const w = loadWardrobe(u); if (w.owned.includes(code)) return { ok: true, item: it };
  if (loadCoins(u) < PRICE[it.tier]) return { ok: false, error: `Cần ${PRICE[it.tier]} Mon — làm thêm đề luyện nhé!` };
  addCoins(u, -PRICE[it.tier]); w.owned.push(code); if (!w.equipped[it.slot]) w.equipped[it.slot] = code; save(u, w);
  return { ok: true, item: it };
}

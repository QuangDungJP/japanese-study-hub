// Profile hero: round static 2D logo + CSS-3D samurai wearing all equipped skins + wardrobe.
import { useState } from 'react';
import { loadWardrobe } from '@/lib/rewards';
import Samurai3D from './Samurai3D';
import WardrobeAvatar from './WardrobeAvatar';

export default function ProfileHero3D({ userId, name, avatarUrl }: { userId: string; name?: string; avatarUrl?: string }) {
  const [w, setW] = useState(() => loadWardrobe(userId));
  return (
    <section className="relative overflow-hidden rounded-[2rem] border-4 border-[#3b2a1e] bg-gradient-to-br from-[#140f22] via-[#2a1f3d] to-[#3b2a1e] p-6 text-amber-50 shadow-2xl md:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-10 [background:linear-gradient(#fff_1px,transparent_1px)_0_0/28px_28px,linear-gradient(90deg,#fff_1px,transparent_1px)_0_0/28px_28px]" />
      <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-amber-300 to-red-700 p-1 shadow-[0_0_30px_rgba(251,191,36,.35)]">
            {avatarUrl ? <img src={avatarUrl} alt="" loading="lazy" decoding="async" className="h-full w-full rounded-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1b1530] font-serif text-5xl">{(name || '侍').slice(0, 1).toUpperCase()}</div>}
          </div>
          <p className="font-serif text-xl font-bold">{name || 'Samurai'}</p>
          <p className="text-xs tracking-[0.3em] text-amber-300/70">道場 · PROFILE</p>
        </div>
        <Samurai3D wardrobe={w} />
        <div onClick={() => setTimeout(() => setW(loadWardrobe(userId)), 0)}>
          <p className="mb-2 text-center text-sm text-amber-200/80">🎒 Tủ đồ — bấm để mặc / tháo</p>
          <WardrobeAvatar userId={userId} grid />
        </div>
      </div>
    </section>
  );
}

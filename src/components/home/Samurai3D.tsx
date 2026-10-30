// Lightweight "3D" samurai: pure CSS 3D transforms (no WebGL, no model files, 0 KB assets).
// GPU-composited rotation only (transform), so it stays smooth on low-end phones; respects reduced-motion.
import { memo, type CSSProperties } from 'react';
import { itemByCode, type Wardrobe } from '@/lib/rewards';

function shade(hex: string, f: number) {
  const n = parseInt(hex.replace('#', ''), 16); const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}
const Cube = memo(({ w, h, d, x, y, z, color }: { w: number; h: number; d: number; x: number; y: number; z: number; color: string }) => {
  const face = (t: string, fw: number, fh: number, f: number): CSSProperties => ({ position: 'absolute', width: fw, height: fh, left: (w - fw) / 2, top: (h - fh) / 2, background: shade(color, f), transform: t, backfaceVisibility: 'hidden', borderRadius: 2 });
  return (
    <div style={{ position: 'absolute', width: w, height: h, transformStyle: 'preserve-3d', transform: `translate3d(${x - w / 2}px,${y - h / 2}px,${z}px)` }}>
      <div style={face(`translateZ(${d / 2}px)`, w, h, 1)} />
      <div style={face(`rotateY(180deg) translateZ(${d / 2}px)`, w, h, 0.6)} />
      <div style={face(`rotateY(90deg) translateZ(${w / 2}px)`, d, h, 0.8)} />
      <div style={face(`rotateY(-90deg) translateZ(${w / 2}px)`, d, h, 0.75)} />
      <div style={face(`rotateX(90deg) translateZ(${h / 2}px)`, w, d, 1.15)} />
      <div style={face(`rotateX(-90deg) translateZ(${h / 2}px)`, w, d, 0.5)} />
    </div>
  );
});

export default function Samurai3D({ wardrobe, size = 220 }: { wardrobe: Wardrobe; size?: number }) {
  const h = itemByCode(wardrobe.equipped.helmet), a = itemByCode(wardrobe.equipped.armor), wp = itemByCode(wardrobe.equipped.weapon);
  const skin = '#f1c27d', cloth = '#1f2937', armor = a?.color ?? '#475569', helm = h?.color ?? null, blade = wp?.color ?? null;
  return (
    <div style={{ width: size, height: size * 1.25, perspective: 700 }} className="relative mx-auto select-none">
      <style>{`@keyframes qdspin{from{transform:rotateX(-12deg) rotateY(0)}to{transform:rotateX(-12deg) rotateY(360deg)}}@media (prefers-reduced-motion:reduce){.qd-spin{animation:none!important}}`}</style>
      <div className="absolute bottom-2 left-1/2 h-4 w-32 -translate-x-1/2 rounded-full bg-black/40 blur-md" />
      <div className="qd-spin absolute left-1/2 top-[55%]" style={{ transformStyle: 'preserve-3d', animation: 'qdspin 14s linear infinite', willChange: 'transform', transform: `scale(${size / 220})` }}>
        {/* legs */}
        <Cube w={18} h={50} d={18} x={-12} y={55} z={0} color={cloth} />
        <Cube w={18} h={50} d={18} x={12} y={55} z={0} color={cloth} />
        {/* torso + armor */}
        <Cube w={52} h={60} d={30} x={0} y={0} z={0} color={armor} />
        {a && <Cube w={60} h={16} d={34} x={0} y={-22} z={0} color={armor} />}
        <Cube w={58} h={14} d={34} x={0} y={30} z={0} color={a ? armor : cloth} />
        {/* arms */}
        <Cube w={14} h={52} d={14} x={-34} y={4} z={0} color={a ? armor : cloth} />
        <Cube w={14} h={52} d={14} x={34} y={4} z={0} color={a ? armor : cloth} />
        {/* head */}
        <Cube w={34} h={34} d={32} x={0} y={-52} z={0} color={skin} />
        {helm && <><Cube w={42} h={14} d={40} x={0} y={-70} z={0} color={helm} /><Cube w={56} h={4} d={50} x={0} y={-62} z={0} color={helm} /><Cube w={6} h={18} d={4} x={0} y={-84} z={16} color="#fbbf24" /></>}
        {/* weapon in right hand */}
        {blade && <><Cube w={4} h={90} d={4} x={46} y={-18} z={10} color={blade} /><Cube w={10} h={4} d={10} x={46} y={26} z={10} color="#111827" /><Cube w={5} h={20} d={5} x={46} y={38} z={10} color="#7f1d1d" /></>}
      </div>
    </div>
  );
}

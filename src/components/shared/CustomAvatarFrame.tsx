import { CustomFrameConfig } from '@/lib/customAvatarFrames';

interface Props {
  config: CustomFrameConfig;
  scale?: number; // scale factor for small avatars
}

/**
 * Renders an admin-designed avatar frame purely from config values.
 * Colors here come from user-authored data, so inline styles are intentional.
 */
export const CustomAvatarFrame = ({ config: c, scale = 1 }: Props) => {
  const gap = Math.max(2, Math.round(c.gap * scale));
  const thickness = Math.max(1, Math.round(c.thickness * scale));
  const glow = Math.round(c.glow * scale);
  const emojiSize = Math.max(9, Math.round(14 * scale));

  const gradient = `conic-gradient(from 0deg, ${c.ringFrom}, ${c.ringVia}, ${c.ringTo}, ${c.ringFrom})`;
  const linear = `linear-gradient(135deg, ${c.ringFrom}, ${c.ringVia}, ${c.ringTo})`;

  const animationClass = [c.spin ? 'animate-spin' : '', c.pulse ? 'animate-pulse' : ''].join(' ').trim();

  const emoji = (value: string, position: React.CSSProperties, delay = '0s') =>
    value ? (
      <span
        className={c.bounceEmoji ? 'animate-bounce' : ''}
        style={{
          position: 'absolute',
          fontSize: emojiSize,
          lineHeight: 1,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.45))',
          animationDelay: delay,
          ...position,
        }}
      >
        {value}
      </span>
    ) : null;

  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{ inset: -gap }}
      aria-hidden
    >
      {/* Ring layers */}
      {c.style === 'aura' && (
        <div
          className={animationClass}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '9999px',
            background: gradient,
            filter: `blur(${Math.max(2, glow / 3)}px)`,
            opacity: 0.9,
            animationDuration: `${c.spinSpeed}s`,
          }}
        />
      )}

      {c.style !== 'image' && c.style !== 'aura' && (
        <div
          className={animationClass}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '9999px',
            borderWidth: thickness,
            borderStyle: c.style === 'dashed' ? 'dashed' : 'solid',
            borderColor: c.ringFrom,
            borderImage: c.style === 'dashed' ? undefined : `${linear} 1`,
            boxShadow: glow ? `0 0 ${glow}px ${c.ringVia}` : undefined,
            animationDuration: `${c.spinSpeed}s`,
          }}
        />
      )}

      {c.style === 'double' && (
        <div
          style={{
            position: 'absolute',
            inset: Math.round(gap / 2),
            borderRadius: '9999px',
            border: `${Math.max(1, thickness - 1)}px solid ${c.ringTo}`,
            opacity: 0.85,
          }}
        />
      )}

      {c.style === 'aura' && (
        <div
          style={{
            position: 'absolute',
            inset: 1,
            borderRadius: '9999px',
            border: `${thickness}px solid ${c.ringVia}`,
          }}
        />
      )}

      {/* Overlay PNG frame */}
      {c.overlayImage && (
        <img
          src={c.overlayImage}
          alt=""
          style={{
            position: 'absolute',
            inset: -gap,
            width: `calc(100% + ${gap * 2}px)`,
            height: `calc(100% + ${gap * 2}px)`,
            objectFit: 'contain',
          }}
        />
      )}

      {/* Decorative emojis */}
      {emoji(c.emojiTop, { top: -emojiSize * 0.8, left: '50%', transform: 'translateX(-50%)' })}
      {emoji(c.emojiBottom, { bottom: -emojiSize * 0.8, left: '50%', transform: 'translateX(-50%)' }, '.2s')}
      {emoji(c.emojiLeft, { left: -emojiSize * 0.7, top: '50%', transform: 'translateY(-50%)' }, '.1s')}
      {emoji(c.emojiRight, { right: -emojiSize * 0.7, top: '50%', transform: 'translateY(-50%)' }, '.3s')}

      {/* Name plate */}
      {c.labelText && (
        <span
          style={{
            position: 'absolute',
            bottom: -Math.round(9 * scale),
            left: '50%',
            transform: 'translateX(-50%)',
            background: `linear-gradient(90deg, ${c.labelFrom}, ${c.labelTo})`,
            color: '#fff',
            fontSize: Math.max(7, Math.round(9 * scale)),
            fontWeight: 900,
            padding: `${Math.max(1, Math.round(2 * scale))}px ${Math.max(3, Math.round(6 * scale))}px`,
            borderRadius: 9999,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(0,0,0,.35)',
          }}
        >
          {c.labelText}
        </span>
      )}
    </div>
  );
};

export default CustomAvatarFrame;

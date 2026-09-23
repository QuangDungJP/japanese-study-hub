import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

const SeasonalEffects = () => {
  const { seasonalTheme } = useTheme();
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (!seasonalTheme || seasonalTheme === 'none') {
      setParticles([]);
      return;
    }

    // Generate random particles
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20 - Math.random() * 100,
      size: Math.random() * 15 + 10,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    }));
    setParticles(newParticles);
  }, [seasonalTheme]);

  if (!seasonalTheme || seasonalTheme === 'none') return null;

  const renderParticle = (p: any) => {
    let content = '❄️';
    if (seasonalTheme === 'spring') content = '🌸';
    if (seasonalTheme === 'tet') content = '🧧';
    if (seasonalTheme === 'halloween') content = '🎃';
    if (seasonalTheme === 'autumn') content = '🍁';
    if (seasonalTheme === 'valentine') content = '💖';

    return (
      <motion.div
        key={p.id}
        initial={{ y: `${p.y}vh`, x: `${p.x}vw`, opacity: 0, rotate: 0 }}
        animate={{
          y: '120vh',
          x: `${p.x + (Math.random() * 20 - 10)}vw`,
          opacity: [0, 1, 1, 0],
          rotate: 360,
        }}
        transition={{
          duration: p.duration,
          delay: p.delay,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          fontSize: `${p.size}px`,
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        {content}
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(renderParticle)}
    </div>
  );
};

export default SeasonalEffects;

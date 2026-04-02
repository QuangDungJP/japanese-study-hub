import { ReactNode } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  delay?: number;
  duration?: number;
  className?: string;
}

const ScrollReveal = ({ children, direction = 'up', delay = 0, duration = 600, className }: ScrollRevealProps) => {
  const { ref, isVisible } = useScrollAnimation();

  const directionStyles: Record<string, string> = {
    up: 'translate-y-[30px]',
    down: 'translate-y-[-30px]',
    left: 'translate-x-[30px]',
    right: 'translate-x-[-30px]',
    fade: '',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out',
        isVisible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${directionStyles[direction]}`,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;

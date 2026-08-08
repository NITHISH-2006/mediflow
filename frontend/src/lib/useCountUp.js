import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';

/**
 * useCountUp — animates a number from 0 → target using anime.js
 * @param {number} target - Final value
 * @param {number} duration - Animation duration in ms (default 1200)
 * @param {boolean} trigger - Start animation when true
 */
export function useCountUp(target, duration = 1200, trigger = true) {
  const [value, setValue] = useState(0);
  const obj = useRef({ val: 0 });
  const animRef = useRef(null);

  useEffect(() => {
    if (!trigger || target === undefined || target === null) return;
    obj.current.val = 0;
    if (animRef.current) animRef.current.pause();

    animRef.current = anime({
      targets: obj.current,
      val: Number(target),
      duration,
      easing: 'easeOutExpo',
      round: 1,
      update: () => setValue(Math.round(obj.current.val)),
    });

    return () => animRef.current?.pause();
  }, [target, trigger, duration]);

  return value;
}

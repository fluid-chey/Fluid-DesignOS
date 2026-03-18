import { useRef, useState, useEffect } from 'react';
import { SCROLL_EDGE } from './constants';

export function usePillsOverflow() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(false);

  const update = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setLeft(scrollLeft > SCROLL_EDGE);
    setRight(scrollLeft + clientWidth < scrollWidth - SCROLL_EDGE);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };
  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return { scrollRef, showLeft: left, showRight: right, scrollLeft, scrollRight };
}

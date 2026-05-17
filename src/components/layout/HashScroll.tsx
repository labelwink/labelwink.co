'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function scrollToHash() {
  const id = window.location.hash.replace('#', '');
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/** Scrolls to in-page anchors after client navigations (e.g. /#collections). */
export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (!window.location.hash) return;
    requestAnimationFrame(scrollToHash);
  }, [pathname]);

  return null;
}

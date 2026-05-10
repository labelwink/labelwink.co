'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { createClient } from '@/lib/supabase/client';

export function AbandonedCartTracker() {
  const { items, getTotals } = useCartStore();
  const supabase = createClient();
  const lastSyncRef = useRef<string | null>(null);

  useEffect(() => {
    // Restore cart from cookie if present (from recovery link)
    const restored = document.cookie.split('; ').find(row => row.startsWith('restored_cart='));
    if (restored) {
      try {
        const cartItems = JSON.parse(decodeURIComponent(restored.split('=')[1]));
        const params = new URLSearchParams(window.location.search);
        if (params.get('cart_restored') && Array.isArray(cartItems)) {
          useCartStore.setState({ items: cartItems, isOpen: true });
          // Clear cookie
          document.cookie = 'restored_cart=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      } catch (e) {
        console.error('Failed to restore cart:', e);
      }
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    async function syncCart() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { subtotal } = getTotals();
        if (items.length === 0) return;

        const currentSyncKey = JSON.stringify({ items, subtotal, email: user.email });
        if (lastSyncRef.current === currentSyncKey) return;

        const res = await fetch('/api/storefront/cart/abandon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            cart_items: items,
            cart_total: subtotal,
            user_id: user.id
          })
        });

        if (res.ok) {
          lastSyncRef.current = currentSyncKey;
        }
      } catch (err) {
        console.error('Abandoned cart sync failed:', err);
      }
    }

    if (items.length > 0) {
      // Debounce sync by 5 seconds
      timeoutId = setTimeout(syncCart, 5000);
    }

    return () => clearTimeout(timeoutId);
  }, [items, getTotals, supabase]);

  return null;
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

interface WishlistButtonProps {
  productId: string;
  variantId?: string;
  initialWishlisted?: boolean;
  /** Optional CSS class override for the wrapper button */
  className?: string;
}

export function WishlistButton({
  productId,
  variantId,
  initialWishlisted = false,
  className,
}: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    if (isLoading) return;

    const previousState = isWishlisted;
    // Optimistic update
    setIsWishlisted(!isWishlisted);
    setIsLoading(true);

    try {
      const method = previousState ? 'DELETE' : 'POST';
      const body: Record<string, string> = { product_id: productId };
      if (!previousState && variantId) body.variant_id = variantId;

      const res = await fetch('/api/storefront/wishlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        // Revert and redirect to login
        setIsWishlisted(previousState);
        router.push('/account/login');
        return;
      }

      if (!res.ok) {
        // Revert on any other error
        setIsWishlisted(previousState);
      }
    } catch {
      // Revert on network error
      setIsWishlisted(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      disabled={isLoading}
      className={
        className ??
        'p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all shadow-sm disabled:opacity-50'
      }
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className="w-5 h-5 transition-colors"
        fill={isWishlisted ? 'red' : 'none'}
        stroke={isWishlisted ? 'red' : 'currentColor'}
      />
    </button>
  );
}

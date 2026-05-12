'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

interface WishlistRemoveButtonProps {
  productId: string;
}

export function WishlistRemoveButton({ productId }: WishlistRemoveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/storefront/wishlist?product_id=${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        // Refresh the server component to reflect the removal
        router.refresh();
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isLoading}
      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm text-destructive hover:bg-destructive hover:text-white transition-all z-10 shadow-sm disabled:opacity-50"
      aria-label="Remove from wishlist"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}

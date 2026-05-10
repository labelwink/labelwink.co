'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import { Minus, Plus, Trash2, X, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getProductImageUrl } from '@/lib/utils/cloudinary';
import { EmptyState } from '@/components/ui/EmptyState';

export function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, getTotals } = useCartStore();
  const { subtotal, totalQuantity } = getTotals();
  const [threshold, setThreshold] = useState(999);
  const supabase = createClient();

  useEffect(() => {
    async function fetchThreshold() {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'free_shipping_threshold')
        .single();
      if (data?.value?.amount) setThreshold(data.value.amount);
    }
    fetchThreshold();
  }, []);

  const progress = Math.min((subtotal / threshold) * 100, 100);
  const remainingForFreeShipping = threshold - subtotal;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full sm:w-[450px] bg-cream p-0 flex flex-col border-l border-sage/20 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-sage/30 flex justify-between items-center bg-cream z-10">
          <SheetTitle className="font-heading text-3xl font-semibold tracking-tight text-charcoal">
            Your Cart <span className="text-xs font-sans text-teal font-bold uppercase tracking-widest ml-2">[{totalQuantity}]</span>
          </SheetTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-sage/10 rounded-full">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Shipping progress bar */}
        <div className="bg-white/50 p-6 border-b border-sage/10">
          <p className="text-[10px] text-charcoal font-bold text-center mb-3 uppercase tracking-[0.2em]">
            {remainingForFreeShipping > 0 
              ? `Add ₹${remainingForFreeShipping.toLocaleString()} more to waive shipping charges` 
              : "Shipping charges waived!"}
          </p>
          <div className="w-full h-1 bg-sage/10 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${remainingForFreeShipping <= 0 ? 'bg-teal' : 'bg-charcoal'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          {items.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState 
                icon="👜" 
                title="Your cart is waiting" 
                description="Explore our latest collection and find something beautiful." 
                action={{ label: "Shop All", href: "/collections/all" }}
              />
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-5 group">
                <div className="w-24 h-32 bg-sage/5 rounded-lg overflow-hidden flex-shrink-0 border border-sage/10 relative">
                  <Image
                    src={getProductImageUrl(item.publicId || item.image, 'thumb')}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <Link 
                        href={`/products/${item.slug}`} 
                        className="font-semibold text-sm text-charcoal hover:text-teal transition-colors line-clamp-2" 
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                      <button onClick={() => removeItem(item.id)} className="text-charcoal/20 hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 font-bold">
                      {item.color} &bull; {item.size}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center bg-sage/5 border border-sage/10 rounded-none h-9">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-9 h-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold font-sans">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-9 h-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-bold text-sm text-charcoal">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-8 border-t border-sage/20 bg-white z-10 space-y-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Subtotal</span>
                <span className="font-bold text-charcoal">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Shipping</span>
                <span className={subtotal >= threshold ? "text-teal font-bold" : ""}>
                  {subtotal >= threshold ? "Complimentary" : "Calculated at checkout"}
                </span>
              </div>
            </div>
            <Link href="/checkout" onClick={() => setIsOpen(false)} className={buttonVariants({ className: "w-full h-16 bg-charcoal hover:bg-teal text-cream rounded-none text-xs font-bold tracking-[0.3em] uppercase transition-all shadow-xl flex items-center justify-center" })}>Checkout Securely</Link>
            <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest font-bold">
              Secure Checkout &bull; Shipping charges waived over ₹{threshold}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

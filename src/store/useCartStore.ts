import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // variant id
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  publicId?: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  getTotals: () => { subtotal: number; totalQuantity: number };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(i => i.id === item.id);
          if (existingItemIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += (item.quantity || 1);
            return { items: newItems, isOpen: true };
          }
          return { items: [...state.items, { ...item, quantity: item.quantity || 1 }], isOpen: true };
        });
      },
      removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: quantity <= 0 
          ? state.items.filter(i => i.id !== id) 
          : state.items.map(i => i.id === id ? { ...i, quantity } : i)
      })),
      clearCart: () => set({ items: [] }),
      setIsOpen: (isOpen) => set({ isOpen }),
      getTotals: () => {
        const { items } = get();
        return items.reduce((acc, item) => ({
          subtotal: acc.subtotal + (item.price * item.quantity),
          totalQuantity: acc.totalQuantity + item.quantity
        }), { subtotal: 0, totalQuantity: 0 });
      }
    }),
    {
      name: 'labelwink-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

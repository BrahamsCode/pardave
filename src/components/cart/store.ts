"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  /** Identificador estable: productId + opción. */
  key: string;
  productId: string;
  optionId: string;
  optionKind: "price" | "variant";
  optionLabel: string;
  slug: string;
  name: string;
  presentation: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "key" | "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export const MAX_QUANTITY = 9999;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) =>
        set((state) => {
          const key = `${item.productId}:${item.optionId}`;
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + quantity) } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, key, quantity }] };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: Math.max(1, Math.min(MAX_QUANTITY, quantity)) } : i,
          ),
        })),
      remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "pardave-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function cartTotals(items: CartItem[]) {
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  return { count, subtotal: Math.round(subtotal * 100) / 100 };
}

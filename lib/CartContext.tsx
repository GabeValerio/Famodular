"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  // Generic fields that can be extended for specific product types
  [key: string]: any;
}

interface CartContextType {
  cart: CartItem[];
  totalAmount: number;
  itemCount: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        setCart([]);
      }
    }
    setIsLoading(false);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isLoading]);

  // Calculate total amount
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Calculate total item count
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (newItem: CartItem) => {
    setCart(currentCart => {
      const existingItemIndex = currentCart.findIndex(item => item.id === newItem.id);

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedCart = [...currentCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + newItem.quantity
        };
        return updatedCart;
      } else {
        // Add new item
        return [...currentCart, newItem];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(currentCart => currentCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }

    setCart(currentCart => {
      return currentCart.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const value: CartContextType = {
    cart,
    totalAmount,
    itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isLoading
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

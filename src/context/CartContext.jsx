import React, { createContext, useContext, useReducer, useEffect } from 'react';

// ─── 1. Load Initial State ──────────────────────────────────────────────
const loadInitialCart = () => {
  try {
    const stored = sessionStorage.getItem("basque_delivery_cart");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Ensure price and qty are always numbers when rehydrating from sessionStorage
    return parsed.map(item => ({
      ...item,
      price: Number(item.price) || 0,
      qty: Number(item.qty) || 1,
    }));
  } catch (error) {
    console.error("Failed to load delivery cart from session storage:", error);
    return [];
  }
};

// ─── 2. Reducer Logic ───────────────────────────────────────────────────
const cartReducer = (state, action) => {
  switch (action.type) {

    case 'ADD_ITEM': {
      const existingItemIndex = state.findIndex(item => item.name === action.payload.name);

      if (existingItemIndex >= 0) {
        const updatedCart = [...state];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          qty: updatedCart[existingItemIndex].qty + 1
        };
        return updatedCart;
      }

      // Coerce price to number on first add
      return [
        ...state,
        {
          ...action.payload,
          price: Number(action.payload.price) || 0,
          qty: 1
        }
      ];
    }

    case 'REMOVE_ITEM':
      return state.filter(item => item.name !== action.payload.name);

    case 'UPDATE_QTY': {
      return state
        .map(item =>
          item.name === action.payload.name
            ? { ...item, qty: Number(action.payload.qty) }
            : item
        )
        .filter(item => item.qty > 0);
    }

    case 'CLEAR_CART':
      return [];

    default:
      return state;
  }
};

// ─── 3. Context Creation ────────────────────────────────────────────────
const CartContext = createContext();

// ─── 4. Provider Component ──────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const [cartItems, dispatch] = useReducer(cartReducer, [], loadInitialCart);

  // Persist to sessionStorage on every state change
  useEffect(() => {
    sessionStorage.setItem("basque_delivery_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Derived values — Number() coercion ensures no NaN ever
  const cartCount = cartItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0);

  // Actions
  const addToCart    = (item) => dispatch({ type: 'ADD_ITEM',    payload: item });
  const removeFromCart = (name) => dispatch({ type: 'REMOVE_ITEM', payload: { name } });
  const updateQty    = (name, qty) => dispatch({ type: 'UPDATE_QTY',  payload: { name, qty } });
  const clearCart    = ()     => dispatch({ type: 'CLEAR_CART' });

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      cartTotal,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

// ─── 5. Custom Hook ─────────────────────────────────────────────────────
export const useCart = () => useContext(CartContext);
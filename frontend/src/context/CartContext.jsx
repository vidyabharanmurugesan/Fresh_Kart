import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartSellerId, setCartSellerId] = useState(null);

  // Load from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('freshkart_cart');
    const savedSellerId = localStorage.getItem('freshkart_cart_seller');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
      setCartSellerId(savedSellerId);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('freshkart_cart', JSON.stringify(cartItems));
    if (cartSellerId) {
      localStorage.setItem('freshkart_cart_seller', cartSellerId);
    } else {
      localStorage.removeItem('freshkart_cart_seller');
    }
  }, [cartItems, cartSellerId]);

  const addToCart = (product, sellerId) => {
    // If adding a product from a different seller, clear the cart first
    if (cartSellerId && cartSellerId !== sellerId) {
      if (!window.confirm("Adding a product from a different shop will clear your current cart. Continue?")) {
        return;
      }
      setCartItems([]);
    }

    setCartSellerId(sellerId);

    setCartItems(prev => {
      const existing = prev.find(item => item.product_id === product.product_id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.product_id !== productId);
      if (updated.length === 0) setCartSellerId(null);
      return updated;
    });
  };

  const updateQuantity = (productId, delta) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item.product_id === productId) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : item;
        }
        return item;
      });
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setCartSellerId(null);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cartItems, cartSellerId, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

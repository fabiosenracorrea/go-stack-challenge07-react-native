import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartProducts = await AsyncStorage.getItem('@go:cartProducts');

      if (cartProducts) {
        setProducts(JSON.parse(cartProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const cartItem = { ...product, quantity: 1 };

      const newCartItems = [...products, cartItem];

      setProducts(newCartItems);

      await AsyncStorage.setItem(
        '@go:cartProducts',
        JSON.stringify(newCartItems),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const oldProducts = [...products];
      const updatedProducts = oldProducts.map(product => {
        if (product.id !== id) {
          return product;
        }

        const newProduct = { ...product };

        newProduct.quantity += 1;

        return newProduct;
      });

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@go:cartProducts',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const oldProducts = [...products];
      const updatedProducts = oldProducts.reduce(
        (cartItems: Product[], currentProduct) => {
          if (currentProduct.id !== id) {
            return [...cartItems, currentProduct];
          }

          if (currentProduct.quantity === 1) {
            return cartItems;
          }

          const toDecrementProduct = { ...currentProduct };
          toDecrementProduct.quantity -= 1;

          return [...cartItems, toDecrementProduct];
        },
        [],
      );

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@go:cartProducts',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

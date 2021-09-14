import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const newCart = [...cart];
      const stockResponse = await api.get("/stock");
      const currentStock = stockResponse.data.amount;
      const foundProduct = newCart.find((product) => product.id === productId);
      if(foundProduct){
        foundProduct.amount += 1;

        if(foundProduct.amount > currentStock){
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      }else{
        const productResponse = await api.get(`/products/${productId}`);
        const newProduct = {
          ...productResponse.data,
          amount: 1
        }

        newCart.push(newProduct);
      }

      
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      
      const newCart = [...cart];
      const productIndex = newCart.findIndex((product) => product.id === productId);

      if(productIndex > 0){
        newCart.splice(productIndex, 1); 
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }else{
        throw new Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 0){
        return;
      }

      const stockResponse = await api.get(`/stocks/${productId}`);
      const stockAmount = stockResponse.data.amount;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const foundProduct = updatedCart.find((product) => product.id === productId);
      
      if(foundProduct){
        foundProduct.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }else{
        throw new Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`);

      if (!response.data) {
        toast.error("Erro na adição do produto");
        return;
      }

      const productExists = cart.find((product) => product.id === productId);

      const stock: Stock = response.data;

      const currentAmount = productExists ? productExists.amount : 0;

      const amount = currentAmount + 1;

      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        const newCart = cart.map((product) =>
          product.id === productId
            ? {
                ...product,
                amount,
              }
            : product
        );

        setCart(newCart);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        const response = await api.get(`/products/${productId}`);

        if (!response.data) {
          toast.error("Erro na adição do produto");
          return;
        }

        const product = {
          ...response.data,
          amount,
        };

        const newCart = [...cart, product];

        setCart(newCart);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex === -1) {
        toast.error("Erro na remoção do produto");
        return;
      }

      const cartFiltered = cart.filter((product) => product.id !== productId);

      setCart(cartFiltered);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartFiltered));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const response = await api.get(`/stock/${productId}`);

      const stock: Stock = response.data;

      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const newCart = cart.map((product) =>
        product.id === productId
          ? {
              ...product,
              amount,
            }
          : product
      );

      setCart(newCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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

import { addOrIncrementItem, calculateCartTotal, removeItemById } from "../domain/cart";
import { deleteCart, readCart, writeCart } from "../infrastructure/cartStorage";

export const getCart = () => readCart();
export const addCartItem = (item) => writeCart(addOrIncrementItem(readCart(), item));
export const removeCartItem = (id) => writeCart(removeItemById(readCart(), id));
export const clearCart = () => deleteCart();
export const getCartTotal = (items = readCart()) => calculateCartTotal(items);

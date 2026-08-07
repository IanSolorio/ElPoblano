const CART_KEY = "cart";

export const readCart = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    return [...stored.reduce((items, item) => {
      const previous = items.get(item.id);
      items.set(item.id, previous
        ? { ...previous, quantity: (previous.quantity || 1) + (item.quantity || 1) }
        : { ...item, quantity: item.quantity || 1 });
      return items;
    }, new Map()).values()];
  } catch {
    return [];
  }
};

export const writeCart = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items));
export const deleteCart = () => localStorage.removeItem(CART_KEY);

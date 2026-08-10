export const calculateCartTotal = (items) =>
  items.reduce((total, item) => total + Number(item.precio) * (item.quantity || 1), 0);

export const addOrIncrementItem = (items, product) => {
  const existing = items.some((item) => item.id === product.id);
  return existing
    ? items.map((item) => item.id === product.id ? {
      ...item,
      ...product,
      precio: Math.min(Number(item.precio), Number(product.precio)),
      quantity: Math.min((item.quantity || 1) + 1, Number(product.stock || item.stock) || Number.MAX_SAFE_INTEGER),
    } : item)
    : [...items, { ...product, quantity: 1 }];
};

export const setItemQuantity = (items, id, quantity) => items
  .map((item) => item.id === id ? {
    ...item,
    quantity: Math.max(1, Math.min(quantity, Number(item.stock) || Number.MAX_SAFE_INTEGER)),
  } : item);

export const removeItemById = (items, id) =>
  items.filter((item) => item.id !== id);

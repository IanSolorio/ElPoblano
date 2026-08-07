export const calculateCartTotal = (items) =>
  items.reduce((total, item) => total + Number(item.precio) * (item.quantity || 1), 0);

export const addOrIncrementItem = (items, product) => {
  const existing = items.find((item) => item.id === product.id);
  return existing
    ? items.map((item) => item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item)
    : [...items, { ...product, quantity: 1 }];
};

export const removeItemById = (items, id) =>
  items.filter((item) => item.id !== id);

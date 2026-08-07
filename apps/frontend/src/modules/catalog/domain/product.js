export const normalizeProduct = (product) => ({
  ...product,
  precio: Number(product.precio),
});

export const normalizeProducts = (products) => products.map(normalizeProduct);

import {
  deleteProductoId,
  getProductoId,
  getProductos,
  getProductosAdmin,
  postProductos,
  putProductoId,
} from "../infrastructure/productApi";
import { uploadFile } from "../infrastructure/imageStorage";
import { normalizeProduct, normalizeProducts } from "../domain/product";

export const listProducts = async () => normalizeProducts(await getProductos());
export const listAdminProducts = async () => normalizeProducts(await getProductosAdmin());
export const getProduct = async (id) => normalizeProduct(await getProductoId(id));
export const createProduct = (product) => postProductos(product);
export const updateProduct = (id, product) => putProductoId(id, product);
export const deleteProduct = (id) => deleteProductoId(id);
export const uploadProductImage = (file, onProgress) => uploadFile(file, onProgress);

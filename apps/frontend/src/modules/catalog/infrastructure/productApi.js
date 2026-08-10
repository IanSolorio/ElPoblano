/* eslint-disable no-useless-catch */
import axios from "axios";
import { deleteFile } from "./imageStorage";

const URL = import.meta.env.VITE_ENDPOINT_BASE || "/api";
const config = { withCredentials: true };

const getProductos = async () => {
  try{
    const respuesta = await axios.get(`${URL}/productos`, config);
    console.log(respuesta);
    if (respuesta.status === 200) {
      return respuesta.data;
    }
    throw new Error("Error al obtener los productos");
  }catch(error) {
    throw error;
  }
};

const getProductosAdmin = async () => (await axios.get(`${URL}/productos/admin/todos`, config)).data;
const getCategorias = async () => (await axios.get(`${URL}/categorias`, config)).data;

const postProductos = async (producto) => {
  try {
    const respuesta = await axios.post(`${URL}/productos`, producto, config);
    if (respuesta.status === 201) {
      return respuesta.data;
    }
    throw new Error("Error al agregar un producto");
  } catch (error) {
    throw error;
  }
};

const getProductoId = async (id) => {
  try {
    const respuesta = await axios.get(`${URL}/productos/${id}`, config);
    if (respuesta.status === 200) {
      return respuesta.data;
    }
    throw new Error("Error al obtener el producto");
  } catch (error) {
    throw error;
  }
};

const putProductoId = async (id, producto) => {
  try {
    const respuesta = await axios.put(`${URL}/productos/${id}`, producto, config);
    if (respuesta.status === 200) {
      return respuesta.data;
    }
    throw new Error("Error al actualizar el producto");
  } catch (error) {
    throw error;
  }
};

const deleteProductoId = async (id) => {
  try {
    // Obtener el producto por su ID
    const { data: producto } = await axios.get(`${URL}/productos/${id}`, config);
    const { imagen: imageStorageUrl } = producto;

    // Validar si hay una URL de imagen antes de intentar eliminarla
    if (imageStorageUrl) {
      try {
        await deleteFile(imageStorageUrl);
      } catch {
        throw new Error("No se pudo eliminar la imagen del almacenamiento.");
      }
    }

    // Eliminar el producto
    const respuesta = await axios.delete(`${URL}/productos/${id}`, config);
    if (respuesta.status === 200) {
      console.log(`Producto eliminado correctamente: ${id}`);
      return respuesta.data;
    } else {
      console.error("Error inesperado al eliminar el producto:", respuesta);
      throw new Error("No se pudo eliminar el producto.");
    }
  } catch (error) {
    console.error(`Error en deleteProductoId para el ID: ${id}`, error);
    throw new Error("Ocurrió un error al intentar eliminar el producto.");
  }
};


export {
  getProductos,
  getProductosAdmin,
  getCategorias,
  postProductos,
  getProductoId,
  putProductoId,
  deleteProductoId,
};

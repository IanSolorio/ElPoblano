/* eslint-disable no-useless-catch */
import axios from "axios";
import { deleteFile } from "./storageService";

const URL = import.meta.env.VITE_ENDPOINT_BASE;

const getProductos = async () => {
  try{
    const respuesta = await axios.get(`${URL}/productos`);
    console.log(respuesta);
    if (respuesta.status === 200) {
      return respuesta.data;
    }
    throw new Error("Error al obtener los productos");
  }catch(error) {
    throw error;
  }
};

const postProductos = async (producto) => {
  try {
    const respuesta = await axios.post(`${URL}/productos`, producto);
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
    const respuesta = await axios.get(`${URL}/productos/${id}`);
    console.log("Respuesta del API:", respuesta.data);
    if (respuesta.status === 200) {
      return respuesta.data;
    }
    throw new Error("Error al obtener el producto");
  } catch (error) {
    console.error("Error en getProductoId:", error);
    throw error;
  }
};

const putProductoId = async (id, producto) => {
  try {
    const respuesta = await axios.put(`${URL}/productos/${id}`, producto);
    console.log(respuesta);
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
    const { data: producto } = await axios.get(`${URL}/productos/${id}`);
    const { imagen: imageStorageUrl } = producto;

    // Validar si hay una URL de imagen antes de intentar eliminarla
    if (imageStorageUrl) {
      try {
        await deleteFile(imageStorageUrl);
        console.log(`Imagen eliminada correctamente: ${imageStorageUrl}`);
      } catch (error) {
        console.error(`Error al eliminar la imagen (${imageStorageUrl}):`, error);
        throw new Error("No se pudo eliminar la imagen del almacenamiento.");
      }
    }

    // Eliminar el producto
    const respuesta = await axios.delete(`${URL}/productos/${id}`);
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
  postProductos,
  getProductoId,
  putProductoId,
  deleteProductoId,
};

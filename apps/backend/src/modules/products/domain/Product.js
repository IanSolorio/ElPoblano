export class Product {
  constructor({ id, nombre, descripcion, categoriaId, precio, imagen = "", stock = 0, activo = true }) {
    if (!nombre || !descripcion || !Number.isInteger(Number(categoriaId)) || Number(categoriaId) <= 0) {
      throw new Error("Nombre, descripción y categoría son obligatorios.");
    }

    const numericPrice = Number(precio);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      throw new Error("El precio debe ser un número mayor o igual a cero.");
    }

    const numericStock = Number(stock);
    if (!Number.isInteger(numericStock) || numericStock < 0) {
      throw new Error("El stock debe ser un número entero mayor o igual a cero.");
    }

    this.id = id;
    this.nombre = nombre.trim();
    this.descripcion = descripcion.trim();
    this.categoriaId = Number(categoriaId);
    this.precio = numericPrice;
    this.imagen = imagen;
    this.stock = numericStock;
    this.activo = activo;
  }
}

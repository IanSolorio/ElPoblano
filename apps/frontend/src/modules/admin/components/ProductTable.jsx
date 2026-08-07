 
 
import { useState } from "react";
import {  Link } from "react-router-dom"
import { FaTriangleExclamation } from "react-icons/fa6";

const ProductsTable = ({ productos, handleDelete }) => {

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Dividir productos en páginas
  const paginatedProducts = productos.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handlePageChange = (pageIndex) => {
    setCurrentPage(pageIndex);
  };

  return (
    <div>
    <table className="table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Stock</th>
          <th colSpan="2">Acciones</th>
        </tr>
      </thead>
      <tbody>
      {paginatedProducts.map(({ id, nombre, descripcion, categoria, precio, stock }) => {
        const isOutOfStock = Number(stock) === 0;
        return (
            <tr key={id} className={isOutOfStock ? "table-warning" : ""}>
              <td>
                {isOutOfStock && (
                  <FaTriangleExclamation
                    className="text-danger me-2"
                    title="Producto sin stock"
                    aria-label="Producto sin stock"
                  />
                )}
                {nombre}
              </td>
              <td>{descripcion}</td>
              <td>{categoria}</td>
              <td>S/.{Number(precio).toFixed(2)}</td>
              <td>
                <span className={isOutOfStock ? "badge bg-danger" : "badge bg-success"}>
                  {isOutOfStock ? "Agotado" : stock}
                </span>
              </td>
              <td>
                <Link className="btn btn-primary btn-sm" to = {`/editarproducto/${id}`}>
                  <i className="fa-solid fa-pen-to-square"></i>
                </Link>
              </td>
              <td>
                <button className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(id)}
                >
                  <i className="fa-sharp fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          );
      })}
      </tbody>
    </table>

    {/* Controles de Paginación */}
      <nav>
        <ul className="pagination justify-content-center">
          {Array.from({ length: Math.ceil(productos.length / itemsPerPage) }).map(
            (_, index) => (
              <li
                key={index}
                className={`page-item ${index === currentPage ? "active" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(index)}
                >
                  {index + 1}
                </button>
              </li>
            )
          )}
        </ul>
      </nav>
    </div>
  );
};

export default ProductsTable;

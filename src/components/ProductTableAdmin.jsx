/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/prop-types */
import { useState } from "react";
import {  Link } from "react-router-dom"

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
        </tr>
      </thead>
      <tbody>
      {paginatedProducts.map(({ id, nombre, descripcion, categoria, precio }) => (
            <tr key={id}>
              <td>{nombre}</td>
              <td>{descripcion}</td>
              <td>{categoria}</td>
              <td>S/.{precio}</td>
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
          ))}
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

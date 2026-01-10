import React from 'react';
import "../css/Conocenos.css";
import Rating from 'react-rating-stars-component';
import cocinero1 from '../assets/image/cocinero.jpeg';
import cocinero2 from '../assets/image/cocinero2.jpg';
import mesero1 from '../assets/image/Mesero.jpg';
import mesero2 from '../assets/image/mesero2.jpg';
import mesero3 from '../assets/image/mesero3.jpg';

const Empleados = () => {
  const empleados = [
    {
      nombre: 'Juan Pérez',
      puesto: 'Chef Principal',
      descripcion: 'Experto en cocina poblana con más de 10 años de experiencia.',
      imagen: cocinero1,
      calificacion: 5,
    },
    {
      nombre: 'María Gómez',
      puesto: 'Gerente General',
      descripcion: 'Liderando el equipo para garantizar un servicio de excelencia.',
      imagen: cocinero2,
      calificacion: 4,
    },
    {
      nombre: 'Carlos López',
      puesto: 'Encargado de Ventas',
      descripcion: 'Asegurándose de que cada cliente se sienta como en casa.',
      imagen: mesero1,
      calificacion: 4.5,
    },
    {
      nombre: 'Ana Sánchez',
      puesto: 'Mesera',
      descripcion: 'Siempre con una sonrisa para atender a nuestros clientes.',
      imagen: mesero2,
      calificacion: 4,
    },
    {
      nombre: 'Luis Torres',
      puesto: 'Ayudante de Cocina',
      descripcion: 'Apoyando al equipo en la creación de los mejores tacos.',
      imagen: mesero3,
      calificacion: 4.2,
    },
  ];

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4" style={{ color: '#8B0000' }}>Nuestro Equipo</h2>
      <div className="row">
        {empleados.map((empleado, index) => (
          <div className="col-md-4 mb-4" key={index}>
            <div className="card empleado-card text-center">
              <img
                src={empleado.imagen}
                alt={empleado.nombre}
                className="card-img-top empleado-img"
              />
              <div className="card-body">
                <h5 className="card-title">{empleado.nombre}</h5>
                <h6 className="card-subtitle mb-2 text-muted">{empleado.puesto}</h6>
                <p className="card-text">{empleado.descripcion}</p>
                <div className="rating-stars">
                  <Rating
                    count={5}
                    size={24}
                    activeColor="#ffd700"
                    value={empleado.calificacion}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Empleados;

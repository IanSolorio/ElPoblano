import React from 'react';
import "../css/Conocenos.css";
import Fondo from '../assets/image/fondo-papel-tapiz-vintage_53876-25249.jpg'; 
import Empleados from '../components/ConocenosEmpleados'; 

const MisionVision = () => {
  return (
    <div>
      <div
        className="mision-vision-container"
        style={{
          backgroundImage: `url(${Fondo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "50px 0", 
        }}
      >
        <div className="container">
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                  <h3 className="card-title">Misión</h3>
                  <p className="card-text">
                    Ofrecer tacos auténticos y de calidad, resaltando los sabores y tradiciones de la cocina poblana en un ambiente acogedor.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                  <h3 className="card-title">Visión</h3>
                  <p className="card-text">
                    Ser el restaurante de tacos favorito, reconocido por su autenticidad y excelencia, llevando el sabor mexicano al mundo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="empleados-section mt-5">
        <Empleados /> 
      </div>
    </div>
  );
};

export default MisionVision;

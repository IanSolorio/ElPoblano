import React from "react";
import { Modal, Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";

const PaymentModal = ({ open, handleClose, productPrice }) => {
  const [amountToPay, setAmountToPay] = React.useState(0); 

  const handleSubmit = (event) => {
    event.preventDefault();

    if (amountToPay < productPrice) {
      Swal.fire({
        icon: "error",
        title: "Compra no completada",
        text: `El monto ingresado es menor al precio total de ${productPrice.toFixed(
          2
        )}.`, 
        confirmButtonText: "Intentar de nuevo",
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Compra completada",
        text: `¡Gracias por tu compra! El monto total fue ${amountToPay.toFixed(
          2
        )}.`, 
        confirmButtonText: "Aceptar",
      });
    }

    handleClose(); 
  };

  return (
    <Modal show={open} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Formulario de Pago</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nombre del titular</Form.Label>
            <Form.Control type="text" placeholder="Juan Pérez" required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Número de tarjeta</Form.Label>
            <Form.Control
              type="text"
              placeholder="1234 5678 9012 3456"
              maxLength="16"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Fecha de expiración</Form.Label>
            <Form.Control type="text" placeholder="MM/AA" required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>CVC</Form.Label>
            <Form.Control
              type="text"
              placeholder="123"
              maxLength="3"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Dirección de facturación</Form.Label>
            <Form.Control type="text" placeholder="Calle Falsa 123" required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Monto a pagar</Form.Label>
            <Form.Control
              type="number"
              value={amountToPay}
              onChange={(e) => setAmountToPay(Number(e.target.value))}
              min="0"
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Confirmar Pago
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PaymentModal;

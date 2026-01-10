import React, { useState } from "react";
import { Modal, Box, TextField, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const LoginModal = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Datos del usuario admin
  const adminUser = {
    email: "admin@example.com",
    password: "123456",
  };

  // Manejar el inicio de sesión
  const handleLogin = () => {
    if (email === adminUser.email && password === adminUser.password) {
      onClose(); // Cerrar el modal
      navigate("/admin"); // Redirigir a /admin
    } else {
      alert("Correo o contraseña incorrectos"); // Mensaje de error
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          borderRadius: "10px",
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Iniciar Sesión
        </Typography>
        <TextField
          label="Correo Electrónico"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Contraseña"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleLogin}
        >
          Ingresar
        </Button>
      </Box>
    </Modal>
  );
};

export default LoginModal;

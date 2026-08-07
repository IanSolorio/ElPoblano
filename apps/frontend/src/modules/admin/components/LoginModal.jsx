import { useState } from "react";
import { Modal, Box, TextField, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/application/AuthContext";

const LoginModal = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      setError("");
      const user = await login({ email, password });
      onClose();
      if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) navigate("/admin");
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, bgcolor: "background.paper", borderRadius: "10px", boxShadow: 24, p: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Iniciar sesión</Typography>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        <TextField label="Correo electrónico" type="email" fullWidth value={email} onChange={(event) => setEmail(event.target.value)} sx={{ mb: 2 }} />
        <TextField label="Contraseña" type="password" fullWidth value={password} onChange={(event) => setPassword(event.target.value)} sx={{ mb: 3 }} />
        <Button variant="contained" color="primary" fullWidth onClick={handleLogin}>Ingresar</Button>
        <Button fullWidth sx={{ mt: 1 }} onClick={() => { onClose(); navigate("/registro"); }}>Crear cuenta de cliente</Button>
      </Box>
    </Modal>
  );
};

export default LoginModal;

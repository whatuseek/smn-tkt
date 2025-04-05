// frontend/src/components/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  // Box,
} from "@mui/material";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Read credentials from environment variables
    const hardcodedAdminId = import.meta.env.VITE_ADMIN_ID;
    const hardcodedPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (adminId === hardcodedAdminId && password === hardcodedPassword) {
      alert("Login successful!");
      // Store authentication status in local storage
      localStorage.setItem("adminLoggedIn", "true");
      navigate("/admin-dashboard");
    } else {
      alert("Invalid credentials. Please try again.");
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Typography component="h1" variant="h5" align="center" mb={4} gutterBottom style={{ fontFamily: "raleway" }}>
        Admin Login
      </Typography>
      <TextField
        margin="normal"
        required
        fullWidth
        id="adminId"
        label="Admin ID"
        name="adminId"
        autoComplete="adminId"
        autoFocus
        // InputLabelProps={{
        //   style: {
        //     fontFamily: "Raleway",
        //   },
        // }}
        slotProps={{
          input: {
            style: {
              fontFamily: "Raleway",
            },
          },
          inputLabel: {
            style: {
              fontFamily: "Raleway",
            },
          },
        }}
        value={adminId}
        onChange={(e) => setAdminId(e.target.value)}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="current-password"
        slotProps={{
          input: {
            style: {
              fontFamily: "Raleway",
            },
          },
          inputLabel: {
            style: {
              fontFamily: "Raleway",
            },
          },
        }}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        fullWidth
        variant="contained"
        // color="primary"
        sx={{ mt: 3, mb: 2, backgroundColor: "#047857" }}
        className="font-raleway"
        onClick={handleLogin}
        style={{ fontFamily: "raleway" }}
      >
        Login
      </Button>
    </Container>
  );
};

export default AdminLogin;
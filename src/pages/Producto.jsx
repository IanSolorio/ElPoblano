import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Slider,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Paper,
} from "@mui/material";
import { getProductos } from "../services/ProductoService";
import Swal from "sweetalert2";

const Producto = () => {
  const CATEGORIAS = [
    "Todas",
    "Promociones",
    "Tacos",
    "Nachos",
    "Quesadilla",
    "Bebidas",
  ];
  const MAX_PRICE = 30;

  const [priceRange, setPriceRange] = useState([0, MAX_PRICE]);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState([]); // Productos originales
  const [filteredProducts, setFilteredProducts] = useState([]); // Productos filtrados

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const productos = await getProductos();
        const validatedProducts = productos.map((product) => ({
          ...product,
          precio: Number(product.precio),
        }));
        setProducts(validatedProducts);
        setFilteredProducts(validatedProducts);
      } catch (error) {
        console.error("Error al cargar los productos:", error);
      }
    };
    fetchProductos();
  }, []);

  // Filtrar productos por rango de precios, categoría y búsqueda
  const filterProducts = useCallback(() => {
    const filtered = products.filter((product) => {
      const isWithinPrice =
        product.precio >= priceRange[0] && product.precio <= priceRange[1];
      const isInCategory =
        selectedCategory === "Todas" || product.categoria === selectedCategory;
      const matchesSearch = product.nombre
        .toLowerCase()
        .includes(searchText.toLowerCase());
      return isWithinPrice && isInCategory && matchesSearch;
    });
    setFilteredProducts(filtered);
  }, [priceRange, selectedCategory, searchText, products]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const updatedCart = [...cart, product];
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    Swal.fire({
      title: "¡Producto añadido!",
      text: `${product.nombre} se agregó al carrito con éxito.`,
      icon: "success",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#a52a2a",
    });
  };

  return (
    <Box sx={{ padding: "20px", backgroundColor: "#ece5dd" }}>
      {/* Barra de búsqueda */}
      <Paper
        sx={{
          display: "flex",
          gap: "10px",
          padding: "10px",
          marginBottom: "20px",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <TextField
          label="Buscar producto"
          variant="outlined"
          fullWidth
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#a52a2a",
              },
            },
          }}
        />
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              padding: "20px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              position: "sticky",
              top: "20px",
            }}
          >
            <Box sx={{ marginBottom: "20px" }}>
              <Typography sx={{ fontWeight: "bold", marginBottom: "10px" }}>
                Filtrar por precio
              </Typography>
              <Slider
                value={priceRange}
                min={0}
                max={MAX_PRICE}
                step={1}
                valueLabelDisplay="auto"
                onChange={(e, newValue) => setPriceRange(newValue)}
                sx={{
                  color: "#a52a2a",
                  "& .MuiSlider-thumb": {
                    backgroundColor: "#4a1f1f",
                  },
                }}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography> S/.{priceRange[0]}</Typography>
                <Typography> S/.{priceRange[1]}</Typography>
              </Box>
            </Box>

            <Typography sx={{ fontWeight: "bold", marginBottom: "10px" }}>
              Categorías
            </Typography>
            <Box>
              {CATEGORIAS.map((category) => (
                <Typography
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  sx={{
                    color:
                      category === selectedCategory ? "#4a1f1f" : "#a52a2a",
                    fontWeight:
                      category === selectedCategory ? "bold" : "normal",
                    cursor: "pointer",
                    marginBottom: "8px",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  {category}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Productos */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={3}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card
                    sx={{
                      backgroundColor: "#fff",
                      border: "1px solid #a52a2a",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      "&:hover": {
                        transform: "scale(1.05)",
                        transition: "0.3s",
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={product.imagen}
                      alt={product.nombre}
                    />
                    <CardContent>
                      <Typography variant="h6" sx={{ color: "#4a1f1f" }}>
                        {product.nombre}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#4a1f1f" }}>
                        {product.descripcion}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#a52a2a" }}>
                      S/.{product.precio.toFixed(2)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          backgroundColor: "#a52a2a",
                          "&:hover": { backgroundColor: "#4a1f1f" },
                        }}
                        onClick={() => addToCart(product)}
                      >
                        Añadir al Carrito
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
             ) : (
              <Typography sx={{ textAlign: "center", width: "100%" }}>
                No se encontraron productos en esta categoría o rango de precio.
              </Typography>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Producto;

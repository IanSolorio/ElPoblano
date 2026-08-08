import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCartPlus, FaMagnifyingGlass, FaSliders, FaUtensils } from "react-icons/fa6";
import Swal from "sweetalert2";
import { listProducts } from "../application/productService";
import { getCategorias } from "../infrastructure/productApi";
import { addCartItem } from "../../cart/application/cartService";
import "../../../css/Producto.css";

export default function ProductCatalogPage() {
  const [maxPrice, setMaxPrice] = useState(100);
  const [selectedPrice, setSelectedPrice] = useState(100);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productData, categoryData] = await Promise.all([listProducts(), getCategorias()]);
        const normalized = productData.map((product) => ({ ...product, precio: Number(product.precio) }));
        const highestPrice = Math.max(10, Math.ceil(Math.max(...normalized.map((item) => item.precio), 0) / 5) * 5);
        setProducts(normalized);
        setCategories(categoryData);
        setMaxPrice(highestPrice);
        setSelectedPrice(highestPrice);
      } catch (error) {
        console.error("Error al cargar los productos:", error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const categoryMatches = selectedCategory === "Todas" || product.categoria === selectedCategory;
    const searchMatches = product.nombre.toLowerCase().includes(searchText.trim().toLowerCase());
    return product.precio <= selectedPrice && categoryMatches && searchMatches;
  }), [products, selectedCategory, searchText, selectedPrice]);

  const addToCart = useCallback((product) => {
    addCartItem(product);
    Swal.fire({
      title: "¡Agregado al carrito!",
      text: `${product.nombre} ya está listo en tu selección.`,
      icon: "success",
      confirmButtonText: "Continuar",
      confirmButtonColor: "#a62b25",
    });
  }, []);

  const clearFilters = () => {
    setSelectedCategory("Todas");
    setSearchText("");
    setSelectedPrice(maxPrice);
  };

  return (
    <main className="catalog-page">
      <header className="catalog-hero">
        <div className="container">
          <span className="catalog-eyebrow"><FaUtensils aria-hidden="true" /> Nuestra carta</span>
          <h1>Encuentra tu próximo favorito</h1>
          <p>Tacos, quesadillas, bebidas y más sabores preparados al momento.</p>
        </div>
      </header>

      <section className="container catalog-content">
        <div className="catalog-toolbar">
          <label className="catalog-search">
            <FaMagnifyingGlass aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar tacos, bebidas, quesadillas..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>
          <span className="catalog-result-count">
            {loading ? "Preparando la carta..." : `${filteredProducts.length} productos disponibles`}
          </span>
        </div>

        <div className="catalog-layout">
          <aside className="catalog-filters" aria-label="Filtros del catálogo">
            <div className="catalog-filters__title">
              <FaSliders aria-hidden="true" /><h2>Filtrar carta</h2>
            </div>
            <div className="catalog-filter-group">
              <div className="catalog-filter-label">
                <span>Precio máximo</span><strong>S/ {selectedPrice}</strong>
              </div>
              <input
                className="catalog-range"
                type="range"
                min="0"
                max={maxPrice}
                step="1"
                value={selectedPrice}
                onChange={(event) => setSelectedPrice(Number(event.target.value))}
              />
              <div className="catalog-range-labels"><span>S/ 0</span><span>S/ {maxPrice}</span></div>
            </div>

            <div className="catalog-filter-group">
              <span className="catalog-filter-group__heading">Categorías</span>
              <div className="catalog-categories">
                {["Todas", ...categories.map((category) => category.nombre)].map((category) => (
                  <button
                    className={category === selectedCategory ? "active" : ""}
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <span>{category}</span>
                    {category === "Todas" && <small>{products.length}</small>}
                  </button>
                ))}
              </div>
            </div>
            <button className="catalog-clear" onClick={clearFilters}>Limpiar filtros</button>
          </aside>

          <div className="catalog-products">
            {loading ? (
              <div className="catalog-grid" aria-label="Cargando productos">
                {[1, 2, 3, 4, 5, 6].map((item) => <div className="catalog-skeleton" key={item} />)}
              </div>
            ) : loadError ? (
              <div className="catalog-empty"><h2>No pudimos cargar la carta</h2><p>Intenta nuevamente dentro de unos momentos.</p></div>
            ) : filteredProducts.length > 0 ? (
              <div className="catalog-grid">
                {filteredProducts.map((product) => (
                  <article className="catalog-card" key={product.id}>
                    <div className="catalog-card__image">
                      {product.imagen ? <img src={product.imagen} alt={product.nombre} /> : <FaUtensils aria-label="Producto sin imagen" />}
                      <span>{product.categoria}</span>
                    </div>
                    <div className="catalog-card__body">
                      <div className="catalog-card__heading">
                        <h2>{product.nombre}</h2>
                        <strong>S/ {product.precio.toFixed(2)}</strong>
                      </div>
                      <p>{product.descripcion}</p>
                      <div className="catalog-card__footer">
                        <span><i aria-hidden="true" /> {product.stock} disponibles</span>
                        <button onClick={() => addToCart(product)}>
                          <FaCartPlus aria-hidden="true" /> Agregar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="catalog-empty">
                <span><FaMagnifyingGlass aria-hidden="true" /></span>
                <h2>No encontramos coincidencias</h2>
                <p>Prueba otra categoría, búsqueda o rango de precio.</p>
                <button onClick={clearFilters}>Mostrar toda la carta</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

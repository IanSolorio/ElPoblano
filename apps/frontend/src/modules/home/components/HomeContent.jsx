import { Link } from "react-router-dom";
import { FaArrowRight, FaBowlFood, FaHeart, FaLeaf } from "react-icons/fa6";
import restaurantImage from "../../../assets/image/409395599_320815934213044_2490934735527099993_n.jpg";
import "../../../css/Principal.css";

const values = [
  {
    icon: FaLeaf,
    title: "Ingredientes frescos",
    text: "Seleccionamos cada ingrediente para entregar color, aroma y sabor en cada pedido.",
  },
  {
    icon: FaBowlFood,
    title: "Preparado al momento",
    text: "Cocinamos cuando ordenas para que disfrutes la textura y temperatura correctas.",
  },
  {
    icon: FaHeart,
    title: "Sabor para compartir",
    text: "Porciones y combinaciones pensadas para disfrutar solo, en familia o con amigos.",
  },
];

export default function HomeContent() {
  return (
    <>
      <section className="home-values" aria-labelledby="values-title">
        <div className="container">
          <div className="home-section-heading home-section-heading--center">
            <span className="home-eyebrow">Nuestra manera de cocinar</span>
            <h2 id="values-title">Sencillo, fresco y lleno de sabor</h2>
            <p>Una experiencia honesta que empieza en la cocina y termina en tu mesa.</p>
          </div>
          <div className="home-values__grid">
            {values.map(({ icon: Icon, title, text }, index) => (
              <article className="home-value-card" key={title}>
                <span className="home-value-card__number">0{index + 1}</span>
                <span className="home-value-card__icon"><Icon aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-story">
        <div className="container home-story__grid">
          <div className="home-story__image">
            <img src={restaurantImage} alt="Ambiente y equipo de El Poblano" />
            <div className="home-story__stamp" aria-hidden="true">
              <strong>Hecho</strong><span>con pasión</span>
            </div>
          </div>
          <div className="home-story__content">
            <span className="home-eyebrow">La experiencia El Poblano</span>
            <h2>Más que una comida, un momento para recordar</h2>
            <p>
              Creemos en las mesas que reúnen personas. Por eso combinamos recetas
              mexicanas, atención cercana y un ambiente cálido para que siempre
              encuentres una buena razón para volver.
            </p>
            <p>
              Explora nuestra carta, elige tus favoritos y prepara tu próximo antojo.
            </p>
            <Link className="home-text-link" to="/nosotros">
              Conoce nuestra historia <FaArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div className="container home-cta__content">
          <div>
            <span className="home-eyebrow">¿Se te antojó?</span>
            <h2>Tu próximo taco está a unos clics.</h2>
          </div>
          <Link className="home-button home-button--light" to="/productos">
            Explorar productos <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}

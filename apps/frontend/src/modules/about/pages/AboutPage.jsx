import { FaBullseye, FaEye, FaPepperHot } from "react-icons/fa6";
import coverImage from "../../../assets/image/Portada-Puesto-de-tacos.jpg";
import Employees from "../components/Employees";
import "../../../css/Conocenos.css";

export default function AboutPage() {
  return (
    <main className="about-page">
      <header className="about-hero">
        <div className="container about-hero__grid">
          <div>
            <span className="about-eyebrow"><FaPepperHot aria-hidden="true" /> Nuestra esencia</span>
            <h1>Una cocina con raíces y mucho corazón</h1>
            <p>
              El Poblano nace del gusto por reunir personas alrededor de recetas
              mexicanas, ingredientes frescos y una atención que se siente cercana.
            </p>
          </div>
          <div className="about-hero__image">
            <img src={coverImage} alt="Puesto y ambiente de inspiración mexicana" />
            <span>Tradición • Sabor • Familia</span>
          </div>
        </div>
      </header>

      <section className="container about-purpose">
        <div className="about-purpose__intro">
          <span className="about-eyebrow">Lo que nos mueve</span>
          <h2>Sabores auténticos, momentos memorables</h2>
          <p>
            Trabajamos para que cada visita tenga la calidez de una mesa compartida
            y el carácter de una receta preparada con dedicación.
          </p>
        </div>
        <div className="about-purpose__cards">
          <article>
            <span><FaBullseye aria-hidden="true" /></span>
            <small>01</small>
            <h3>Misión</h3>
            <p>Ofrecer tacos auténticos y de calidad, resaltando los sabores de la cocina poblana en un ambiente acogedor.</p>
          </article>
          <article>
            <span><FaEye aria-hidden="true" /></span>
            <small>02</small>
            <h3>Visión</h3>
            <p>Ser una taquería reconocida por su autenticidad, excelencia y capacidad de llevar el sabor mexicano a más personas.</p>
          </article>
        </div>
      </section>

      <Employees />
    </main>
  );
}

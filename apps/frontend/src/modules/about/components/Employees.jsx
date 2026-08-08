import { FaQuoteLeft } from "react-icons/fa6";
import cookOne from "../../../assets/image/cocinero.jpeg";
import cookTwo from "../../../assets/image/cocinero2.jpg";
import waiterOne from "../../../assets/image/Mesero.jpg";
import waiterTwo from "../../../assets/image/mesero2.jpg";
import waiterThree from "../../../assets/image/mesero3.jpg";
import "../../../css/Conocenos.css";

const team = [
  { name: "Juan Pérez", role: "Chef principal", description: "Convierte recetas tradicionales en platos llenos de carácter.", image: cookOne },
  { name: "María Gómez", role: "Gerencia", description: "Cuida cada detalle para que la experiencia sea cálida y consistente.", image: cookTwo },
  { name: "Carlos López", role: "Atención al cliente", description: "Hace que cada visitante se sienta bienvenido desde el primer momento.", image: waiterOne },
  { name: "Ana Sánchez", role: "Servicio de mesa", description: "Comparte nuestra carta con cercanía, alegría y atención.", image: waiterTwo },
  { name: "Luis Torres", role: "Equipo de cocina", description: "Aporta energía y precisión en la preparación de cada pedido.", image: waiterThree },
];

export default function Employees() {
  return (
    <section className="about-team" aria-labelledby="team-title">
      <div className="container">
        <div className="about-team__heading">
          <div>
            <span className="about-eyebrow">Las personas detrás del sabor</span>
            <h2 id="team-title">Nuestro equipo</h2>
          </div>
          <p>Una cocina funciona mejor cuando cada persona aporta su talento y pasión.</p>
        </div>
        <div className="about-team__grid">
          {team.map((member, index) => (
            <article className={`about-member${index === 0 ? " about-member--featured" : ""}`} key={member.name}>
              <div className="about-member__image"><img src={member.image} alt={member.name} /></div>
              <div className="about-member__content">
                <FaQuoteLeft aria-hidden="true" />
                <span>{member.role}</span>
                <h3>{member.name}</h3>
                <p>{member.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

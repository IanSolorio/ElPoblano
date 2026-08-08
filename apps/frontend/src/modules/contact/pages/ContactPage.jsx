import { useState } from "react";
import { FaClock, FaEnvelope, FaLocationDot, FaPhone, FaWhatsapp } from "react-icons/fa6";
import "../../../css/Contacto.css";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const sendWhatsApp = (event) => {
    event.preventDefault();
    const text = `Hola, soy ${form.name}. Mi teléfono es ${form.phone || "no indicado"}. ${form.message}`;
    window.open(`https://wa.me/51998123456?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="contact-page">
      <header className="contact-hero">
        <div className="container">
          <span className="contact-eyebrow">Hablemos</span>
          <h1>Siempre hay lugar para una buena conversación</h1>
          <p>¿Tienes una consulta sobre nuestra carta o atención? Escríbenos y te responderemos por WhatsApp.</p>
        </div>
      </header>

      <section className="container contact-layout">
        <div className="contact-details">
          <span className="contact-eyebrow">Información de contacto</span>
          <h2>Estamos para ayudarte</h2>
          <p className="contact-details__lead">Elige el canal que prefieras o completa el formulario para iniciar una conversación.</p>
          <div className="contact-detail-list">
            <article><span><FaWhatsapp aria-hidden="true" /></span><div><small>WhatsApp</small><strong>+51 998 123 456</strong></div></article>
            <article><span><FaLocationDot aria-hidden="true" /></span><div><small>Ubicación</small><strong>Puerto Maldonado, Perú</strong></div></article>
            <article><span><FaClock aria-hidden="true" /></span><div><small>Horario de atención</small><strong>Lun–Sáb, 11:00–22:00</strong></div></article>
            <article><span><FaEnvelope aria-hidden="true" /></span><div><small>Correo</small><strong>contacto@elpoblano.com</strong></div></article>
          </div>
          <div className="contact-direct">
            <FaPhone aria-hidden="true" />
            <div><span>¿Prefieres llamar?</span><strong>+51 998 123 456</strong></div>
          </div>
        </div>

        <form className="contact-form" onSubmit={sendWhatsApp}>
          <div className="contact-form__heading"><span><FaWhatsapp aria-hidden="true" /></span><div><h2>Envíanos un mensaje</h2><p>Se abrirá WhatsApp con tu consulta preparada.</p></div></div>
          <label>Nombre completo<input name="name" value={form.name} onChange={updateField} placeholder="¿Cómo te llamas?" required /></label>
          <label>Número de teléfono<input name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="Ej. 998 123 456" /></label>
          <label>Tu mensaje<textarea name="message" value={form.message} onChange={updateField} rows="5" placeholder="Cuéntanos cómo podemos ayudarte..." required /></label>
          <button type="submit"><FaWhatsapp aria-hidden="true" /> Continuar en WhatsApp</button>
          <small>Este proyecto es una demostración académica y no recibe pedidos reales.</small>
        </form>
      </section>
    </main>
  );
}

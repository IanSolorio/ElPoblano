import { FaCircleInfo } from "react-icons/fa6";

export default function AcademicNotice() {
  return (
    <aside className="academic-notice" role="note" aria-label="Aviso de proyecto académico">
      <FaCircleInfo aria-hidden="true" />
      <span>
        <strong>Proyecto académico de demostración.</strong>{" "}
        No corresponde al sitio oficial del establecimiento y no acepta pedidos reales.
      </span>
    </aside>
  );
}

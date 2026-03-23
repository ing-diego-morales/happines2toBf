import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import "./RecargaModal.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const MONTOS = [
  { valor: 5000, etiqueta: "$5.000", comision: true },
  { valor: 10000, etiqueta: "$10.000", comision: true },
  { valor: 20000, etiqueta: "$20.000", comision: false },
  { valor: 50000, etiqueta: "$50.000", comision: false },
];

export default function RecargaModal({ isOpen, onClose }: Props) {
  const { user, refreshUser } = useContext(AuthContext);
  const [montoSeleccionado, setMontoSeleccionado] = useState<number | null>(
    null,
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleRecargar = async () => {
    if (!montoSeleccionado) {
      setError("Selecciona un monto");
      return;
    }
    setCargando(true);
    setError("");
    setExito(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/pagos/crear-transaccion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id, monto: montoSeleccionado }),
        },
      );
      const data = await res.json();
      if (!data.referencia) {
        setError("Error al crear transacción");
        return;
      }
      const sim = await fetch(
        `${import.meta.env.VITE_API_URL}/api/pagos/simular-aprobado`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referencia: data.referencia }),
        },
      );
      if (!sim.ok) {
        setError("Error al simular el pago");
        return;
      }

      await refreshUser();
      setExito(montoSeleccionado);
      setMontoSeleccionado(null);

      setTimeout(() => {
        setExito(null);
        onClose();
      }, 2500);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-box" onClick={(e) => e.stopPropagation()}>
        {exito !== null ? (
          <div className="rm-exito">
            <div className="rm-exito-icono">✓</div>
            <p className="rm-exito-titulo">¡Saldo acreditado!</p>
            <p className="rm-exito-monto">
              +{" "}
              {exito.toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              })}
            </p>
            <p className="rm-exito-sub">Tu saldo ha sido actualizado</p>
          </div>
        ) : (
          <>
            <div className="rm-header">
              <div className="rm-header-left">
                <span className="rm-icono">💳</span>
                <div>
                  <h2 className="rm-titulo">Recargar saldo</h2>
                  <p className="rm-sub">Elige el monto a agregar</p>
                </div>
              </div>
              <button className="rm-close" onClick={onClose}>
                ✕
              </button>
            </div>
            <div className="rm-montos">
              {MONTOS.map((m) => (
                <button
                  key={m.valor}
                  className={`rm-monto${montoSeleccionado === m.valor ? " rm-monto--activo" : ""}`}
                  onClick={() => {
                    setMontoSeleccionado(m.valor);
                    setError("");
                  }}
                >
                  <span className="rm-monto-valor">{m.etiqueta}</span>
                  <span
                    className={`rm-monto-badge${m.comision ? "" : " rm-monto-badge--gratis"}`}
                  >
                    {m.comision ? "+ comisión" : "Sin comisión 🎉"}
                  </span>
                </button>
              ))}
            </div>
            <div className="rm-metodos">
              <p className="rm-metodos-titulo">Métodos aceptados</p>
              <div className="rm-metodos-chips">
                {["Nequi", "QR", "Breve", "PSE", "Tarjeta"].map((m) => (
                  <span key={m} className="rm-chip">
                    {m}
                  </span>
                ))}
              </div>
              <p className="rm-metodos-nota">
                Daviplata disponible vía QR o Breve en el checkout
              </p>
            </div>
            {error && (
              <div className="rm-error">
                <span>⚠</span> {error}
              </div>
            )}

            <button
              className="rm-btn"
              onClick={handleRecargar}
              disabled={!montoSeleccionado || cargando}
            >
              {cargando ? (
                <span className="rm-spinner" />
              ) : (
                <>
                  {montoSeleccionado
                    ? `Pagar ${montoSeleccionado.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })}`
                    : "Selecciona un monto"}
                  {!cargando && <span className="rm-btn-arrow">→</span>}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

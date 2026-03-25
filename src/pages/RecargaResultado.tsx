import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./RecargaResultado.css";

export default function RecargaResultado() {
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);
  const [estado, setEstado] = useState<"verificando" | "ok" | "pendiente" | "error">("verificando");
  const [monto, setMonto] = useState<number | null>(null);

  useEffect(() => {
    const verificar = async () => {
      const referencia = localStorage.getItem("recarga_ref");
      if (!referencia) {
        navigate("/home");
        return;
      }

      let intentos = 0;
      const MAX_INTENTOS = 15;

      const intervalo = setInterval(async () => {
        intentos++;
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/pagos/estado/${referencia}`
          );
          const data = await res.json();

          if (data.estado === "completada") {
            clearInterval(intervalo);
            localStorage.removeItem("recarga_ref");
            setMonto(Number(data.monto));
            await refreshUser();
            setEstado("ok");
            setTimeout(() => navigate("/home"), 3000);
          } else if (data.estado === "fallida") {
            clearInterval(intervalo);
            localStorage.removeItem("recarga_ref");
            setEstado("error");
          } else if (intentos >= MAX_INTENTOS) {
            clearInterval(intervalo);
            setEstado("pendiente");
          }
        } catch {
          clearInterval(intervalo);
          setEstado("error");
        }
      }, 2000);

      return () => clearInterval(intervalo);
    };

    verificar();
  }, []);

  return (
    <div className="rr-wrap">
      {estado === "verificando" && (
        <div className="rr-card">
          <div className="rr-spinner" />
          <p className="rr-titulo">Verificando pago...</p>
          <p className="rr-sub">Esto puede tomar unos segundos</p>
        </div>
      )}

      {estado === "ok" && (
        <div className="rr-card rr-card--ok">
          <div className="rr-icono rr-icono--ok">✓</div>
          <p className="rr-titulo">¡Pago exitoso!</p>
          {monto && (
            <p className="rr-monto">
              +{" "}
              {monto.toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              })}
            </p>
          )}
          <p className="rr-sub">Saldo acreditado · Redirigiendo...</p>
        </div>
      )}

      {estado === "pendiente" && (
        <div className="rr-card rr-card--pendiente">
          <div className="rr-icono rr-icono--pendiente">🕐</div>
          <p className="rr-titulo">Pago en proceso</p>
          <p className="rr-sub">
            Tu saldo se acreditará automáticamente en los próximos minutos.
            No necesitas hacer nada más.
          </p>
          <button className="rr-btn" onClick={() => navigate("/home")}>
            Volver al inicio
          </button>
        </div>
      )}

      {estado === "error" && (
        <div className="rr-card rr-card--error">
          <div className="rr-icono rr-icono--error">✕</div>
          <p className="rr-titulo">Pago no completado</p>
          <p className="rr-sub">
            El pago fue rechazado o cancelado. No se realizó ningún cobro.
          </p>
          <button className="rr-btn" onClick={() => navigate("/home")}>
            Volver al inicio
          </button>
        </div>
      )}
    </div>
  );
}

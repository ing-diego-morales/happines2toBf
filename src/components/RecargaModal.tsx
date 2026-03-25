import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import "./RecargaModal.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const MONTOS_FIJOS = [
  { valor: 5000,  etiqueta: "$5.000",  comision: true  },
  { valor: 10000, etiqueta: "$10.000", comision: true  },
  { valor: 20000, etiqueta: "$20.000", comision: false },
  { valor: 50000, etiqueta: "$50.000", comision: false },
];

export default function RecargaModal({ isOpen, onClose }: Props) {
  const { user } = useContext(AuthContext);
  const [montoSeleccionado, setMontoSeleccionado] = useState<number | null>(null);

  // montoLibreRaw guarda SOLO dígitos sin formato ("20000", no "20.000")
  const [montoLibreRaw, setMontoLibreRaw] = useState<string>("");
  const [usarMontoLibre, setUsarMontoLibre] = useState(false);
  const [cargando, setCargando]             = useState(false);
  const [error, setError]                   = useState("");

  if (!isOpen) return null;

  // Monto efectivo siempre como número puro
  const montoEfectivo: number | null = usarMontoLibre
    ? (montoLibreRaw.length > 0 ? parseInt(montoLibreRaw, 10) : null)
    : montoSeleccionado;

  const tieneComision = montoEfectivo !== null && montoEfectivo < 20000;

  const handleMontoLibreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Elimina TODO lo que no sea dígito del valor crudo del input
    const soloDigitos = e.target.value.replace(/[^0-9]/g, "");
    // Limita a 6 dígitos (máximo $500.000)
    const limitado = soloDigitos.slice(0, 6);
    setMontoLibreRaw(limitado);
    setError("");
  };

  // Lo que se muestra en el input: formateado con separadores de miles
  const montoLibreDisplay = montoLibreRaw
    ? parseInt(montoLibreRaw, 10).toLocaleString("es-CO")
    : "";

  const handleRecargar = async () => {
    if (!montoEfectivo) {
      setError("Selecciona o ingresa un monto");
      return;
    }
    if (montoEfectivo < 2000) {
      setError("El monto mínimo es $2.000");
      return;
    }
    if (montoEfectivo > 500000) {
      setError("El monto máximo es $500.000");
      return;
    }

    setCargando(true);
    setError("");

    // Enviamos el número puro al backend (nunca string formateado)
    console.log("Enviando monto al backend:", montoEfectivo, typeof montoEfectivo);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/pagos/crear-transaccion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id, monto: montoEfectivo }),
        },
      );
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }
      if (!data.url_pago) {
        setError("No se pudo iniciar el pago");
        return;
      }

      // Redirige al checkout de Wompi
      sessionStorage.setItem("recarga_ref", data.referencia);
      window.location.href = data.url_pago;

    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-box" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="rm-header">
          <div className="rm-header-left">
            <span className="rm-icono">💳</span>
            <div>
              <h2 className="rm-titulo">Recargar saldo</h2>
              <p className="rm-sub">Elige el monto a agregar</p>
            </div>
          </div>
          <button className="rm-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="rm-tabs">
          <button
            className={`rm-tab${!usarMontoLibre ? " rm-tab--activo" : ""}`}
            onClick={() => { setUsarMontoLibre(false); setError(""); }}
          >
            Montos rápidos
          </button>
          <button
            className={`rm-tab${usarMontoLibre ? " rm-tab--activo" : ""}`}
            onClick={() => {
              setUsarMontoLibre(true);
              setMontoSeleccionado(null);
              setMontoLibreRaw("");
              setError("");
            }}
          >
            Monto libre
          </button>
        </div>

        {/* Montos fijos */}
        {!usarMontoLibre && (
          <div className="rm-montos">
            {MONTOS_FIJOS.map((m) => (
              <button
                key={m.valor}
                className={`rm-monto${montoSeleccionado === m.valor ? " rm-monto--activo" : ""}`}
                onClick={() => { setMontoSeleccionado(m.valor); setError(""); }}
              >
                <span className="rm-monto-valor">{m.etiqueta}</span>
                <span className={`rm-monto-badge${m.comision ? "" : " rm-monto-badge--gratis"}`}>
                  {m.comision ? "+ comisión" : "Sin comisión 🎉"}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Monto libre */}
        {usarMontoLibre && (
          <div className="rm-libre">
            <label className="rm-libre-label">Ingresa el monto (COP)</label>
            <div className="rm-libre-input-wrap">
              <span className="rm-libre-prefix">$</span>
              <input
                className="rm-libre-input"
                type="text"
                inputMode="numeric"
                placeholder="Ej: 35.000"
                value={montoLibreDisplay}
                onChange={handleMontoLibreChange}
                autoFocus
              />
            </div>
            <p className="rm-libre-hint">
              Mínimo $2.000 · Máximo $500.000
              {montoLibreRaw && parseInt(montoLibreRaw, 10) >= 2000 && parseInt(montoLibreRaw, 10) < 20000 && (
                <span className="rm-libre-comision"> · Se cobrará comisión Wompi</span>
              )}
              {montoLibreRaw && parseInt(montoLibreRaw, 10) >= 20000 && (
                <span className="rm-libre-gratis"> · Sin comisión 🎉</span>
              )}
            </p>
          </div>
        )}

        {/* Métodos de pago */}
        <div className="rm-metodos">
          <p className="rm-metodos-titulo">Métodos aceptados</p>
          <div className="rm-metodos-chips">
            {["Nequi", "QR", "Breve", "PSE", "Tarjeta"].map((m) => (
              <span key={m} className="rm-chip">{m}</span>
            ))}
          </div>
          <p className="rm-metodos-nota">
            Daviplata disponible vía QR o Breve en el checkout
          </p>
        </div>

        {/* Aviso comisión */}
        {tieneComision && (
          <div className="rm-aviso-comision">
            ⚠️ Montos menores a $20.000 incluyen comisión Wompi (~2.49% + $900)
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rm-error">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Botón pagar */}
        <button
          className="rm-btn"
          onClick={handleRecargar}
          disabled={
            !montoEfectivo ||
            cargando ||
            (usarMontoLibre && (!montoLibreRaw || parseInt(montoLibreRaw, 10) < 2000))
          }
        >
          {cargando ? (
            <span className="rm-spinner" />
          ) : (
            <>
              {montoEfectivo && montoEfectivo >= 2000
                ? `Pagar ${montoEfectivo.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  })}`
                : "Selecciona un monto"}
              <span className="rm-btn-arrow">→</span>
            </>
          )}
        </button>

        <p className="rm-wompi-badge">
          🔒 Pagos procesados por <strong>Wompi</strong>
        </p>
      </div>
    </div>
  );
}

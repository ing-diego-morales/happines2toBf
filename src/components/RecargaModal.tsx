import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import "./RecargaModal.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Misma lógica que el backend — mantener sincronizadas
function calcularSaldoNeto(monto: number): number {
  if (monto < 20000) {
    const comisionBase = monto * 0.0265 + 700;
    const comisionConIva = comisionBase * 1.19;
    return Math.floor(monto - comisionConIva);
  } else {
    return monto - 1000;
  }
}

function formatCOP(n: number) {
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });
}

const MONTOS_FIJOS = [
  { valor: 5000,  etiqueta: "$5.000"  },
  { valor: 10000, etiqueta: "$10.000" },
  { valor: 20000, etiqueta: "$20.000" },
  { valor: 50000, etiqueta: "$50.000" },
];

export default function RecargaModal({ isOpen, onClose }: Props) {
  const { user } = useContext(AuthContext);
  const [tab, setTab]                     = useState<"rapido" | "libre">("rapido");
  const [montoSeleccionado, setMontoSel]  = useState<number | null>(null);
  const [montoLibreRaw, setMontoLibreRaw] = useState("");
  const [cargando, setCargando]           = useState(false);
  const [error, setError]                 = useState("");

  if (!isOpen) return null;

  const montoEfectivo: number | null =
    tab === "libre"
      ? montoLibreRaw.length > 0 ? parseInt(montoLibreRaw, 10) : null
      : montoSeleccionado;

  const saldoNeto = montoEfectivo && montoEfectivo >= 2000
    ? calcularSaldoNeto(montoEfectivo)
    : null;

  const tieneComision = montoEfectivo !== null && montoEfectivo < 20000;
  const sinComision   = montoEfectivo !== null && montoEfectivo >= 20000;

  const handleLibreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setMontoLibreRaw(raw);
    setError("");
  };

  const displayLibre = montoLibreRaw
    ? parseInt(montoLibreRaw, 10).toLocaleString("es-CO")
    : "";

  const switchTab = (t: "rapido" | "libre") => {
    setTab(t);
    setMontoSel(null);
    setMontoLibreRaw("");
    setError("");
  };

  const handlePagar = async () => {
    if (!montoEfectivo)         { setError("Selecciona o ingresa un monto"); return; }
    if (montoEfectivo < 2000)   { setError("Monto mínimo: $2.000"); return; }
    if (montoEfectivo > 500000) { setError("Monto máximo: $500.000"); return; }

    setCargando(true);
    setError("");
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
      if (data.error)     { setError(data.error); return; }
      if (!data.url_pago) { setError("No se pudo iniciar el pago"); return; }
      localStorage.setItem("recarga_ref", data.referencia);
      window.location.href = data.url_pago;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-box" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="rm-header">
          <div className="rm-header-left">
            <div className="rm-header-icon">💳</div>
            <div>
              <h2 className="rm-titulo">Recargar saldo</h2>
              <p className="rm-sub">Selecciona el monto que deseas agregar</p>
            </div>
          </div>
          <button className="rm-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Tabs ── */}
        <div className="rm-tabs">
          <button
            className={`rm-tab${tab === "rapido" ? " active" : ""}`}
            onClick={() => switchTab("rapido")}
          >⚡ Montos rápidos</button>
          <button
            className={`rm-tab${tab === "libre" ? " active" : ""}`}
            onClick={() => switchTab("libre")}
          >✏️ Monto personalizado</button>
        </div>

        {/* ── Montos fijos ── */}
        {tab === "rapido" && (
          <div className="rm-montos">
            {MONTOS_FIJOS.map(m => {
              const neto = calcularSaldoNeto(m.valor);
              const conCom = m.valor < 20000;
              return (
                <button
                  key={m.valor}
                  className={`rm-monto${montoSeleccionado === m.valor ? " active" : ""}`}
                  onClick={() => { setMontoSel(m.valor); setError(""); }}
                >
                  <span className="rm-monto-valor">{m.etiqueta}</span>
                  <span className={`rm-monto-neto${conCom ? " warn" : " ok"}`}>
                    Recibes {formatCOP(neto)}
                  </span>
                  {conCom
                    ? <span className="rm-badge rm-badge--warn">+ comisión Wompi</span>
                    : <span className="rm-badge rm-badge--ok">Tarifa fija $1.000</span>
                  }
                </button>
              );
            })}
          </div>
        )}

        {/* ── Monto libre ── */}
        {tab === "libre" && (
          <div className="rm-libre">
            <p className="rm-libre-label">¿Cuánto quieres recargar?</p>
            <div className={`rm-libre-field${montoLibreRaw ? " has-value" : ""}`}>
              <span className="rm-libre-currency">COP $</span>
              <input
                className="rm-libre-input"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={displayLibre}
                onChange={handleLibreChange}
                autoFocus
              />
              {sinComision && <span className="rm-libre-ok-icon">✓</span>}
            </div>
            <div className="rm-libre-hints">
              <span>Mín. $2.000</span>
              <span>Máx. $500.000</span>
            </div>

            {/* Preview saldo neto en tiempo real */}
            {saldoNeto !== null && montoEfectivo && montoEfectivo >= 2000 && (
              <div className={`rm-neto-preview${tieneComision ? " warn" : " ok"}`}>
                <div className="rm-neto-row">
                  <span>Pagas</span>
                  <span>{formatCOP(montoEfectivo)}</span>
                </div>
                <div className="rm-neto-row">
                  <span>{tieneComision ? "Comisión Wompi (2.65% + $700 + IVA)" : "Tarifa fija"}</span>
                  <span className="rm-neto-descuento">− {formatCOP(montoEfectivo - saldoNeto)}</span>
                </div>
                <div className="rm-neto-divider" />
                <div className="rm-neto-row rm-neto-total">
                  <span>Recibes en saldo</span>
                  <span className={tieneComision ? "rm-warn-color" : "rm-ok-color"}>
                    {formatCOP(saldoNeto)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Métodos ── */}
        <div className="rm-metodos">
          <p className="rm-metodos-titulo">Métodos disponibles</p>
          <div className="rm-chips">
            {[
              { label: "Nequi",   emoji: "📱" },
              { label: "QR",      emoji: "📷" },
              { label: "Bre-B",   emoji: "⚡" },
              { label: "PSE",     emoji: "🏦" },
              { label: "Tarjeta", emoji: "💳" },
            ].map(m => (
              <span key={m.label} className="rm-chip">{m.emoji} {m.label}</span>
            ))}
          </div>
          <p className="rm-metodos-nota">Daviplata: usa QR o Breve en el checkout</p>
        </div>

        {/* ── Error ── */}
        {error && <div className="rm-error">⚠ {error}</div>}

        {/* ── Botón ── */}
        <button
          className="rm-btn"
          onClick={handlePagar}
          disabled={!montoEfectivo || cargando || montoEfectivo < 2000}
        >
          {cargando ? (
            <><span className="rm-spinner" /> Procesando...</>
          ) : montoEfectivo && montoEfectivo >= 2000 && saldoNeto ? (
            <>Pagar {formatCOP(montoEfectivo)} · Recibes {formatCOP(saldoNeto)} <span className="rm-arrow">→</span></>
          ) : (
            <>Selecciona un monto <span className="rm-arrow">→</span></>
          )}
        </button>

        <p className="rm-footer">
          <span>🔒</span> Pagos seguros procesados por <strong>Wompi</strong>
        </p>
      </div>
    </div>
  );
}

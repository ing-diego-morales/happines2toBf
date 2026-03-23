import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import "./ConfirmReset.css";

const API = import.meta.env.VITE_API_URL;

const toastOpts = {
  style: {
    background: "#1a1d27",
    color: "#e8e8f0",
    border: "1px solid #2a2d3e",
  },
};


const IconEyeOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
             a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8
             a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function ConfirmReset() {
  const [searchParams]          = useSearchParams();
  const token                   = searchParams.get("token") || "";
  const email                   = searchParams.get("email") || "";
  const [newPassword, setNew]   = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.", toastOpts);
      return;
    }
    if (newPassword !== confirm) {
      toast.error("Las contraseñas no coinciden.", toastOpts);
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`${API}/resetPassword/confirm`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Token inválido o expirado.", toastOpts);
        return;
      }

      toast.success("Contraseña actualizada. Inicia sesión.", {
        ...toastOpts,
        duration: 3000,
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      toast.error("Error de conexión.", toastOpts);
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="cr-bg">
        <div className="cr-card">
          <p className="cr-invalid">
            Enlace inválido. Solicita uno nuevo desde{" "}
            <a href="/reset-password" className="cr-link">aquí</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-bg">
      <div className="cr-card">
        <h2 className="cr-title">Nueva contraseña</h2>
        <p className="cr-sub">Ingresa y confirma tu nueva contraseña.</p>
        <hr className="cr-hr" />

        <form onSubmit={handleSubmit} className="cr-form">
          <label className="cr-label">Nueva contraseña</label>
          <div className="cr-input-wrap">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNew(e.target.value)}
              required
              className="cr-input"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="cr-eye"
              aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPass ? <IconEyeOff /> : <IconEyeOpen />}
            </button>
          </div>

          <label className="cr-label">Confirmar contraseña</label>
          <input
            type={showPass ? "text" : "password"}
            placeholder="Repite la contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="cr-input"
          />

          <button type="submit" disabled={loading} className="cr-btn">
            {loading ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>

        <p className="cr-footer">
          <a href="/login" className="cr-link">Volver a iniciar sesión</a>
        </p>
      </div>
    </div>
  );
}

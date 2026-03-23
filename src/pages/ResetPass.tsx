import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./ResetPass.css";

const API = import.meta.env.VITE_API_URL;

export default function ResetPass() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  const toastOpts = {
    style: {
      background: "#1a1d27",
      color: "#e8e8f0",
      border: "1px solid #2a2d3e",
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res  = await fetch(`${API}/resetPassword`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.status === 404) {
        toast.error(
          data.message || "Usuario no encontrado. Verifica tu correo.",
          { ...toastOpts, duration: 4000 }
        );
        return;
      }

      if (!res.ok) {
        toast.error(data.message || "Error al enviar el correo.", toastOpts);
        return;
      }

      toast.success("Correo enviado. Revisa tu bandeja de entrada.", {
        ...toastOpts,
        duration: 4000,
      });
      setTimeout(() => navigate("/login"), 2500);
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.", toastOpts);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-bg">
      <div className="rp-card">
        <h2 className="rp-title">Recuperar contraseña</h2>
        <p className="rp-sub">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <hr className="rp-hr" />

        <form onSubmit={handleSubmit} className="rp-form">
          <label className="rp-label">Correo electrónico</label>
          <input
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            className="rp-input"
          />
          <button type="submit" disabled={loading} className="rp-btn">
            {loading ? "Enviando..." : "Enviar correo"}
          </button>
        </form>

        <p className="rp-footer">
          ¿Ya la recuperaste?{" "}
          <a href="/login" className="rp-link">
            Volver a iniciar sesión
          </a>
        </p>
      </div>
    </div>
  );
}

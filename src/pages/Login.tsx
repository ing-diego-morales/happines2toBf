import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./Login.css";

const IconEyeOpen = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18" height="18"
    viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18" height="18"
    viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      toast.success("Bienvenido 👋");
      navigate("/home");
    } catch (err: any) {
      // Muestra el mensaje de error del backend si está disponible
      const message =
        err?.data?.message ||
        err?.message ||
        "Credenciales incorrectas";

      // ✅ Si era un error de sesión anterior, no mostrar "Sesión expirada"
      //    en la pantalla de login — mostrar mensaje genérico
      if (message === "Sesión expirada") {
        toast.error("Credenciales incorrectas");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Iniciar Sesión</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPass(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <IconEyeOff /> : <IconEyeOpen />}
            </button>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading || !email || !password}
          >
            {loading ? <span className="spinnerLogin" /> : "Ingresar"}
          </button>
        </form>

        <div className="login-contact">
          Si necesitas acceso,{" "}
          <a
            href="https://wa.me/573024824806?text=Hola,%20quiero%20acceso%20al%20panel%20de%20codigos"
            target="_blank"
            rel="noopener noreferrer"
          >
            contáctame aquí
          </a>
        </div>

        <div className="resetLink">
          <a href="/reset-password">¿Olvidaste tu contraseña?</a>
        </div>
      </div>
    </div>
  );
}

export default Login;

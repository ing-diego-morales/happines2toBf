import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function RecargaResultado() {
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);
  const [estado, setEstado] = useState<"verificando" | "ok" | "pendiente" | "error">("verificando");

  useEffect(() => {
    const verificar = async () => {
      const referencia = sessionStorage.getItem("recarga_ref");
      if (!referencia) { navigate("/home"); return; }

      let intentos = 0;
      const intervalo = setInterval(async () => {
        intentos++;
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/pagos/estado/${referencia}`
          );
          const data = await res.json();

          if (data.estado === "completada") {
            clearInterval(intervalo);
            sessionStorage.removeItem("recarga_ref");
            await refreshUser();
            setEstado("ok");
            setTimeout(() => navigate("/home"), 2500);
          } else if (intentos >= 5) {
            clearInterval(intervalo);
            setEstado("pendiente");
          }
        } catch {
          clearInterval(intervalo);
          setEstado("error");
        }
      }, 2000);
    };
    verificar();
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
      {estado === "verificando" && <><p style={{fontSize:"2rem"}}>⏳</p><p>Verificando pago...</p></>}
      {estado === "ok"          && <><p style={{fontSize:"2rem"}}>✅</p><p>¡Saldo acreditado! Redirigiendo...</p></>}
      {estado === "pendiente"   && <><p style={{fontSize:"2rem"}}>🕐</p><p>Pago en proceso. Tu saldo se acreditará pronto.</p><button onClick={() => navigate("/home")}>Volver al inicio</button></>}
      {estado === "error"       && <><p style={{fontSize:"2rem"}}>❌</p><p>No pudimos verificar el pago. Contacta soporte.</p><button onClick={() => navigate("/home")}>Volver al inicio</button></>}
    </div>
  );
}
import { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import "./Historial.css";

interface Venta {
  id_venta: number;
  id_historial?: number;
  fecha_venta: string;
  nombre_producto: string;
  nombre_usuario?: string;
  correo_cuenta: string;
  contrasena_cuenta: string;
  nombre_perfil?: string;
  pin_seguridad?: string;
  precio_unitario: number;
  tipo_producto?: string;
  duracion_dias?: number;
}

const PER_PAGE = 10;

export default function Historial() {
  const { user } = useContext(AuthContext);
  const esAdmin = user?.role === "admin";

  const [ventas, setVentas]           = useState<Venta[]>([]);
  const [searchTerm, setSearchTerm]   = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDiario, setTotalDiario] = useState(0);
  const [totalMensual, setTotalMensual] = useState(0);
  const [maxPages, setMaxPages]       = useState(window.innerWidth <= 768 ? 5 : 9);

  useEffect(() => {
    const onResize = () => setMaxPages(window.innerWidth <= 768 ? 5 : 9);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const endpoint = esAdmin ? "/api/tienda/ventas" : "/historial-compras";
    apiFetch(endpoint)
      .then((data: any) => {
        if (esAdmin) {
          setVentas(Array.isArray(data.ventas) ? data.ventas : []);
          setTotalDiario(data.total_diario || 0);
          setTotalMensual(data.total_mensual || 0);
        } else {
          setVentas(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => toast.error("Error al cargar el historial"));
  }, [esAdmin]);

  const filtered = ventas.filter(v => {
    const q = searchTerm.toLowerCase();
    return (
      v.nombre_producto?.toLowerCase().includes(q) ||
      v.correo_cuenta?.toLowerCase().includes(q) ||
      v.nombre_usuario?.toLowerCase().includes(q) ||
      v.nombre_perfil?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current    = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const getPages = () => {
    if (totalPages <= maxPages) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | string)[] = [1];
    if (currentPage > Math.floor(maxPages / 2) + 1) pages.push("...");
    let start = Math.max(2, currentPage - Math.floor(maxPages / 2));
    let end   = Math.min(totalPages - 1, start + maxPages - 3);
    if (end - start < maxPages - 3) start = Math.max(2, end - maxPages + 3);
    for (let i = start; i <= end; i++) pages.push(i);
    pages.push(totalPages);
    return pages;
  };

  const diasRestantes = (fechaVenta: string, duracion: number = 30) => {
    const compra = new Date(fechaVenta);
    const corte  = new Date(compra);
    corte.setDate(corte.getDate() + duracion);
    const diff = Math.ceil((corte.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const copiarDatos = (v: Venta) => {
    const texto = [
      `📦 ${v.nombre_producto}`,
      `📧 Correo: ${v.correo_cuenta}`,
      `🔑 Contraseña: ${v.contrasena_cuenta}`,
      v.nombre_perfil ? `👤 Perfil: ${v.nombre_perfil}` : "",
      v.pin_seguridad ? `🔢 PIN: ${v.pin_seguridad}` : "",
      `💰 Valor: $${Number(v.precio_unitario).toLocaleString("es-CO")}`,
      `📅 Fecha: ${new Date(v.fecha_venta).toLocaleDateString("es-CO")}`,
      `\n📌 Reglas:\n1️⃣ Uso exclusivo un dispositivo\n2️⃣ No compartir credenciales\n3️⃣ Problemas → soporte`,
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(texto)
      .then(() => toast.success("Datos copiados al portapapeles"))
      .catch(() => toast.error("No se pudo copiar"));
  };

  const formatCOP = (v: number) =>
    Number(v).toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 });

  return (
    <div className="hist-wrapper">
      <div className="hist-container">
        <div className="hist-header">
          <div className="hist-title-row">
            <h2>{esAdmin ? "Ventas realizadas" : "Mis compras"}</h2>
            {esAdmin && (
              <div className="hist-totales">
                <div className="hist-total-card">
                  <span>Hoy</span>
                  <strong>{formatCOP(totalDiario)}</strong>
                </div>
                <div className="hist-total-card">
                  <span>Este mes</span>
                  <strong>{formatCOP(totalMensual)}</strong>
                </div>
              </div>
            )}
          </div>
          <input
            type="text"
            placeholder={esAdmin ? "Buscar por producto, usuario, correo..." : "Buscar por producto o correo..."}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="hist-table-wrap">
          <table className="hist-table">
            <thead>
              <tr>
                {esAdmin && <th>Usuario</th>}
                <th>Producto</th>
                <th>Fecha</th>
                <th>Correo</th>
                <th>Contraseña</th>
                <th>Perfil</th>
                <th>PIN</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Días rest.</th>
                <th>Copiar</th>
              </tr>
            </thead>
            <tbody>
              {current.length === 0 && (
                <tr>
                  <td colSpan={esAdmin ? 11 : 10} className="hist-empty">
                    No hay registros
                  </td>
                </tr>
              )}
              {current.map((v, i) => {
                const dias = diasRestantes(v.fecha_venta, v.duracion_dias || 30);
                return (
                  <tr key={`${v.id_venta}-${i}`}>
                    {esAdmin && <td>{v.nombre_usuario || "—"}</td>}
                    <td translate="no" className="hist-nombre">{v.nombre_producto}</td>
                    <td>{new Date(v.fecha_venta).toLocaleDateString("es-CO")}</td>
                    <td className="hist-mono">{v.correo_cuenta || "—"}</td>
                    <td className="hist-mono">{v.contrasena_cuenta || "—"}</td>
                    <td>{v.nombre_perfil || "—"}</td>
                    <td>{v.pin_seguridad || "—"}</td>
                    <td>
                      <span className={`hist-badge ${v.tipo_producto === "pantalla" ? "badge-blue" : "badge-green"}`}>
                        {v.tipo_producto || "—"}
                      </span>
                    </td>
                    <td className="hist-precio">{formatCOP(v.precio_unitario)}</td>
                    <td>
                      <span className={`hist-dias ${dias > 5 ? "dias-ok" : dias > 0 ? "dias-warn" : "dias-out"}`}>
                        {dias > 0 ? `${dias}d` : "Vencido"}
                      </span>
                    </td>
                    <td>
                      <button className="hist-copy-btn" onClick={() => copiarDatos(v)} title="Copiar datos">
                        <i className="bi bi-clipboard" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="hist-cards">
          {current.length === 0 && (
            <p className="hist-empty">No hay registros</p>
          )}
          {current.map((v, i) => {
            const dias = diasRestantes(v.fecha_venta, v.duracion_dias || 30);
            return (
              <div key={`card-${v.id_venta}-${i}`} className="hist-card">
                <div className="hist-card-top">
                  <p className="hist-card-nombre" translate="no">{v.nombre_producto}</p>
                  <div className="hist-card-badges">
                    <span className={`hist-badge ${v.tipo_producto === "pantalla" ? "badge-blue" : "badge-green"}`}>
                      {v.tipo_producto || "—"}
                    </span>
                    <span className={`hist-dias ${dias > 5 ? "dias-ok" : dias > 0 ? "dias-warn" : "dias-out"}`}>
                      {dias > 0 ? `${dias}d` : "Vencido"}
                    </span>
                  </div>
                </div>
                {esAdmin && <p className="hist-card-row"><span>Usuario</span><span>{v.nombre_usuario || "—"}</span></p>}
                <p className="hist-card-row"><span>Fecha</span><span>{new Date(v.fecha_venta).toLocaleDateString("es-CO")}</span></p>
                <p className="hist-card-row"><span>Correo</span><span className="hist-mono">{v.correo_cuenta || "—"}</span></p>
                <p className="hist-card-row"><span>Contraseña</span><span className="hist-mono">{v.contrasena_cuenta || "—"}</span></p>
                {v.nombre_perfil && <p className="hist-card-row"><span>Perfil</span><span>{v.nombre_perfil}</span></p>}
                {v.pin_seguridad && <p className="hist-card-row"><span>PIN</span><span>{v.pin_seguridad}</span></p>}
                <div className="hist-card-bottom">
                  <span className="hist-precio">{formatCOP(v.precio_unitario)}</span>
                  <button className="hist-copy-btn" onClick={() => copiarDatos(v)}>
                    <i className="bi bi-clipboard" /> Copiar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="hist-pagination">
          {getPages().map((pg, i) => (
            <button
              key={i}
              className={currentPage === pg ? "active" : ""}
              disabled={pg === "..."}
              onClick={() => typeof pg === "number" && setCurrentPage(pg)}
            >
              {pg}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import "./ModificarCuentas.css";

interface Perfil {
  id_perfil: number;
  nombre_perfil: string;
  pin_seguridad: string;
  estado_perfil: string;
}

interface Cuenta {
  id_cuenta: number;
  nombre_producto: string;
  correo: string;
  contrasena: string;
  estado: string;
  perfiles: Perfil[];
}

export default function ModificarCuentas() {
  const { user } = useContext(AuthContext);
  const esAdmin = user?.role === "admin";

  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editCuenta, setEditCuenta] = useState<Cuenta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 8;

  useEffect(() => {
    if (!esAdmin) return;
    setLoading(true);
    apiFetch("/api/tienda/cuentas-todas")
      .then((data: any[]) => {
        const map = new Map<number, Cuenta>();
        data.forEach((row) => {
          if (!map.has(row.id_cuenta)) {
            map.set(row.id_cuenta, {
              id_cuenta: row.id_cuenta,
              nombre_producto: row.nombre_producto,
              correo: row.correo,
              contrasena: row.contrasena,
              estado: row.estado,
              perfiles: [],
            });
          }
          if (row.id_perfil) {
            map.get(row.id_cuenta)!.perfiles.push({
              id_perfil: row.id_perfil,
              nombre_perfil: row.nombre_perfil,
              pin_seguridad: row.pin_seguridad ?? "",
              estado_perfil: row.estado_perfil,
            });
          }
        });
        setCuentas(Array.from(map.values()));
      })
      .catch(() => toast.error("Error al cargar las cuentas"))
      .finally(() => setLoading(false));
  }, [esAdmin]);

  if (!esAdmin) return <p className="mc-no-access">Acceso denegado.</p>;

  const filtered = cuentas.filter((c) =>
    c.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.nombre_producto.toLowerCase().includes(busqueda.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleSave = async () => {
    if (!editCuenta) return;
    try {
      await apiFetch(`/api/tienda/cuentas/${editCuenta.id_cuenta}`, {
        method: "PUT",
        body: JSON.stringify({
          correo: editCuenta.correo,
          contrasena: editCuenta.contrasena,
          perfiles: editCuenta.perfiles.map((p) => ({
            id_perfil: p.id_perfil,
            nombre_perfil: p.nombre_perfil,
            pin_seguridad: p.pin_seguridad,
          })),
        }),
      });
      setCuentas((prev) =>
        prev.map((c) => (c.id_cuenta === editCuenta.id_cuenta ? editCuenta : c))
      );
      setEditCuenta(null);
      toast.success("Cuenta actualizada correctamente");
    } catch {
      toast.error("Error al guardar los cambios");
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Eliminar la cuenta "${nombre}"? Esta acción no se puede revertir.`)) return;
    try {
      await apiFetch(`/api/tienda/cuentas/${id}`, { method: "DELETE" });
      setCuentas((prev) => prev.filter((c) => c.id_cuenta !== id));
      toast.success("Cuenta eliminada");
    } catch {
      toast.error("Error al eliminar la cuenta");
    }
  };

  return (
    <div className="mc-wrapper">
      <div className="mc-header">
        <div className="mc-header-left">
          <h1 className="mc-title">
            <i className="bi bi-pencil-square" /> Modificar Cuentas
          </h1>
          <span className="mc-count">{filtered.length} cuenta{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="mc-search-wrap">
          <i className="bi bi-search" />
          <input
            type="text"
            placeholder="Buscar por correo o producto…"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {editCuenta && (
        <div className="mc-modal-overlay" onClick={() => setEditCuenta(null)}>
          <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-header">
              <h3>✏️ Editar Cuenta</h3>
              <button className="mc-modal-close" onClick={() => setEditCuenta(null)}>✕</button>
            </div>

            <div className="mc-modal-body">
              <label className="mc-label">
                Producto
                <input
                  className="mc-input mc-input-readonly"
                  value={editCuenta.nombre_producto}
                  readOnly
                />
              </label>
              <label className="mc-label">
                Correo
                <input
                  className="mc-input"
                  value={editCuenta.correo}
                  onChange={(e) => setEditCuenta({ ...editCuenta, correo: e.target.value })}
                  autoComplete="off"
                />
              </label>
              <label className="mc-label">
                Contraseña
                <input
                  className="mc-input"
                  value={editCuenta.contrasena}
                  onChange={(e) => setEditCuenta({ ...editCuenta, contrasena: e.target.value })}
                  autoComplete="off"
                />
              </label>

              {editCuenta.perfiles.length > 0 && (
                <div className="mc-perfiles">
                  <p className="mc-perfiles-title">Perfiles</p>
                  {editCuenta.perfiles.map((perfil, i) => (
                    <div key={perfil.id_perfil} className="mc-perfil-row">
                      <label className="mc-label mc-label-inline">
                        Perfil {i + 1}
                        <input
                          className="mc-input"
                          value={perfil.nombre_perfil}
                          onChange={(e) => {
                            const updated = [...editCuenta.perfiles];
                            updated[i] = { ...updated[i], nombre_perfil: e.target.value };
                            setEditCuenta({ ...editCuenta, perfiles: updated });
                          }}
                        />
                      </label>
                      <label className="mc-label mc-label-inline">
                        PIN {i + 1}
                        <input
                          className="mc-input"
                          value={perfil.pin_seguridad}
                          maxLength={6}
                          onChange={(e) => {
                            if (!/^\d{0,6}$/.test(e.target.value)) return;
                            const updated = [...editCuenta.perfiles];
                            updated[i] = { ...updated[i], pin_seguridad: e.target.value };
                            setEditCuenta({ ...editCuenta, perfiles: updated });
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mc-modal-footer">
              <button className="mc-btn mc-btn-cancel" onClick={() => setEditCuenta(null)}>
                Cancelar
              </button>
              <button className="mc-btn mc-btn-save" onClick={handleSave}>
                <i className="bi bi-check-lg" /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mc-table-wrap">
        {loading ? (
          <div className="mc-loading">
            <div className="mc-spinner" />
            <span>Cargando cuentas…</span>
          </div>
        ) : paginated.length === 0 ? (
          <p className="mc-empty">No se encontraron cuentas.</p>
        ) : (
          <table className="mc-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Correo</th>
                <th>Contraseña</th>
                <th>Perfiles</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((cuenta) => (
                <tr key={cuenta.id_cuenta}>
                  <td className="mc-td-id">#{cuenta.id_cuenta}</td>
                  <td className="mc-td-producto" translate="no">{cuenta.nombre_producto}</td>
                  <td className="mc-td-correo">{cuenta.correo}</td>
                  <td className="mc-td-pass">{cuenta.contrasena}</td>
                  <td className="mc-td-perfiles">
                    {cuenta.perfiles.length > 0
                      ? cuenta.perfiles.map((p) => (
                          <span key={p.id_perfil} className="mc-perfil-badge">
                            {p.nombre_perfil}
                            {p.pin_seguridad ? ` · ${p.pin_seguridad}` : ""}
                          </span>
                        ))
                      : <span className="mc-perfil-completa">Completa</span>
                    }
                  </td>
                  <td>
                    <span className={`mc-estado ${cuenta.estado === "Disponible" ? "mc-disponible" : "mc-vendido"}`}>
                      {cuenta.estado}
                    </span>
                  </td>
                  <td className="mc-td-acciones">
                    <button
                      className="mc-btn-edit"
                      onClick={() => setEditCuenta({ ...cuenta, perfiles: [...cuenta.perfiles] })}
                      title="Editar"
                    >
                      <i className="bi bi-pencil" />
                    </button>
                    <button
                      className="mc-btn-delete"
                      onClick={() => handleDelete(cuenta.id_cuenta, cuenta.correo)}
                      title="Eliminar"
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mc-pagination">
          <button
            className="mc-page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`mc-page-btn ${currentPage === p ? "active" : ""}`}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="mc-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { apiFetch } from "../services/api";
import "./Tienda.css";
import { useTranslation } from "react-i18next";

interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
  descripcion?: string;
  image_url?: string;
}

interface Producto {
  id_producto: number;
  id_categoria: number;
  nombre_producto: string;
  descripcion?: string;
  disponibilidad: number;
  precio: number;
  duracion_dias: number;
  tipo_producto: string;
  nombre_categoria?: string;
  categoria_image_url?: string;
}

interface CuentaComprada {
  correo: string;
  contrasena: string;
  perfil?: string;
  pin_seguridad?: string;
  duracion?: number;
}

const PlaceholderImg = () => (
  <div className="tienda-placeholder">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  </div>
);

type Vista = "verProductos" | "subirProducto" | "crearProducto";

export default function Tienda() {
  const { user } = useContext(AuthContext);
  const esAdmin = user?.role === "admin";
  const [moneda, setMoneda] = useState<"COP" | "USD">("COP");
  const USD_RATE = 3950;
  const [compraTarget, setCompraTarget] = useState<Producto | null>(null);
  const [vista, setVista] = useState<Vista>("verProductos");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [formSubir, setFormSubir] = useState({
    email: "",
    contrasena: "",
    perfil: "",
    pin: "",
  });
  const [productoSubir, setProductoSubir] = useState("");
  const [catSubir, setCatSubir] = useState("");

  const [formCrear, setFormCrear] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    tipo_producto: "",
    duracion_dias: "",
  });
  const [catCrear, setCatCrear] = useState("");
  const [eliminarTarget, setEliminarTarget] = useState<Producto | null>(null);
  useEffect(() => {
    apiFetch("/categorias")
      .then((data: Categoria[]) => {
        setCategorias(data);
        if (data.length && !categoriaActiva)
          setCategoriaActiva(data[0].nombre_categoria);
      })
      .catch(() => toast.error(t("tienda.errors.loadCategories")));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (categoriaActiva) params.set("categoria", categoriaActiva);
    if (busqueda) params.set("buscar", busqueda);

    apiFetch(`/productos?${params}`)
      .then((data: Producto[]) => {
        if (Array.isArray(data)) {
          const unique = Array.from(
            new Map(data.map((p) => [p.id_producto, p])).values(),
          );
          setProductos(unique);
        }
      })
      .catch(() => setProductos([]));
  }, [categoriaActiva, busqueda]);

  useEffect(() => {
    apiFetch("/categorias")
      .then((data: Categoria[]) => {
        setCategorias(data);
      })
      .catch(() => toast.error(t("tienda.errors.loadCategories")));
  }, []);

  const formatPrecio = (precio: number) => {
    if (moneda === "USD") {
      return (precio / USD_RATE).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return parseFloat(String(precio)).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const resetVista = (v: Vista) => {
    setVista(v);
    setSidebarVisible(false);
    setFormSubir({ email: "", contrasena: "", perfil: "", pin: "" });
    setFormCrear({
      nombre: "",
      descripcion: "",
      precio: "",
      tipo_producto: "",
      duracion_dias: "",
    });
    setCatSubir("");
    setProductoSubir("");
    setCatCrear("");
  };

  const handleComprar = async (producto: Producto) => {
    if (producto.disponibilidad <= 0) {
      toast.error(`${producto.nombre_producto} no está disponible.`);
      return;
    }
    setCompraTarget(producto);
  };

  const confirmarCompra = async () => {
    if (!compraTarget) return;
    const producto = compraTarget;
    setCompraTarget(null);
    setLoading(true);
    try {
      const data = await apiFetch(`/comprar-producto/${producto.id_producto}`, {
        method: "POST",
      });
      const c: CuentaComprada = data.cuenta;

      const diasDuracion = producto.duracion_dias || 30;
      const fechaCorte = new Date();
      fechaCorte.setDate(fechaCorte.getDate() + diasDuracion);
      const corteStr = fechaCorte.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const toCopy = [
        `✅ ${producto.nombre_producto}`,
        `📧 Correo: ${c.correo}`,
        `🔑 Contraseña: ${c.contrasena}`,
        c.perfil ? `👤 Perfil: ${c.perfil}` : "",
        c.pin_seguridad ? `🔢 PIN: ${c.pin_seguridad}` : "",
        `📅 Corte: ${corteStr}`,
        `\n📌 Reglas:\n1️⃣ Uso exclusivo un dispositivo\n2️⃣ No compartir credenciales\n3️⃣ Problemas → soporte`,
      ]
        .filter(Boolean)
        .join("\n");

      navigator.clipboard
        .writeText(toCopy)
        .then(() =>
          toast.success(
            "¡Compra exitosa! Detalles copiados al portapapeles 📋",
            { duration: 6000 },
          ),
        )
        .catch(() => toast.success("¡Compra exitosa!", { duration: 5000 }));

      setProductos((prev) =>
        prev.map((p) =>
          p.id_producto === producto.id_producto
            ? { ...p, disponibilidad: p.disponibilidad - 1 }
            : p,
        ),
      );
    } catch (err: any) {
      const msg = err?.error || err?.message || "Error al realizar la compra";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!eliminarTarget) return;
    const producto = eliminarTarget;
    setEliminarTarget(null);
    try {
      await apiFetch(`/api/tienda/productos/${producto.id_producto}`, {
        method: "DELETE",
      });
      toast.success("Producto eliminado");
      setProductos((prev) =>
        prev.filter((p) => p.id_producto !== producto.id_producto),
      );
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar");
    }
  };

  const handleSubir = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/subir-cuenta", {
        method: "POST",
        body: JSON.stringify({
          id_producto: productoSubir,
          correo: formSubir.email,
          contrasena: formSubir.contrasena,
          perfil: formSubir.perfil,
          pin: formSubir.pin,
        }),
      });
      toast.success("Cuenta subida exitosamente");
      setFormSubir({ email: "", contrasena: "", perfil: "", pin: "" });
    } catch {
      toast.error("Error al subir la cuenta");
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/crear-producto", {
        method: "POST",
        body: JSON.stringify({ categoria: catCrear, ...formCrear }),
      });
      toast.success("Producto creado exitosamente");
      setFormCrear({
        nombre: "",
        descripcion: "",
        precio: "",
        tipo_producto: "",
        duracion_dias: "",
      });
      setCatCrear("");
    } catch {
      toast.error("Error al crear el producto");
    }
  };

  const productosCategoria = productos;

  return (
    <div className="tienda-container">
      <div className="tienda-header">
        <div className="tienda-search-row">
          <button
            className={`tienda-sidebar-toggle ${sidebarVisible ? "active" : ""}`}
            onClick={() => setSidebarVisible(!sidebarVisible)}
            title="Categorías"
          >
            <i className="bi bi-grid" />
          </button>
          <div className="tienda-search-wrap">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                if (e.target.value) setCategoriaActiva("");
              }}
            />
            <i className="bi bi-search" />
          </div>
        </div>

        <nav className="tienda-nav">
          <button
            className={vista === "verProductos" ? "active" : ""}
            onClick={() => resetVista("verProductos")}
          >
            Ver productos
          </button>
          {esAdmin && (
            <>
              <button
                className={vista === "subirProducto" ? "active" : ""}
                onClick={() => resetVista("subirProducto")}
              >
                Subir producto
              </button>
              <button
                className={vista === "crearProducto" ? "active" : ""}
                onClick={() => resetVista("crearProducto")}
              >
                Crear producto
              </button>
            </>
          )}

          <button
            className="tienda-btn-moneda"
            onClick={() => setMoneda((m) => (m === "COP" ? "USD" : "COP"))}
            title="Cambiar moneda"
          >
            {moneda === "COP" ? "🇨🇴 COP" : "🇺🇸 USD"}
          </button>
        </nav>
      </div>

      <div className="tienda-body">
        <aside className={`tienda-sidebar ${sidebarVisible ? "visible" : ""}`}>
          <button
            className={`tienda-cat-item ${categoriaActiva === "" ? "active" : ""}`}
            onClick={() => {
              setCategoriaActiva("");
              setSidebarVisible(false);
            }}
          >
            <i
              className="bi bi-grid-3x3-gap"
              style={{ fontSize: "18px", flexShrink: 0 }}
            />
            <span>Ver Todos</span>
          </button>

          {categorias.map((cat) => (
            <button
              key={cat.id_categoria}
              className={`tienda-cat-item ${categoriaActiva === cat.nombre_categoria ? "active" : ""}`}
              onClick={() => {
                setCategoriaActiva(cat.nombre_categoria);
                setSidebarVisible(false);
              }}
            >
              {cat.image_url && (
                <img
                  src={cat.image_url}
                  alt={cat.nombre_categoria}
                  className="tienda-cat-img"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              )}
              <span>{cat.nombre_categoria}</span>
            </button>
          ))}
        </aside>

        <main className="tienda-main">
          {vista === "verProductos" && (
            <div className="tienda-grid">
              {productosCategoria.length === 0 && (
                <p className="tienda-empty">
                  No hay productos en esta categoría.
                </p>
              )}
              {productosCategoria.map((producto) => (
                <div
                  key={producto.id_producto}
                  className={`tienda-card ${esAdmin ? "admin" : ""}`}
                >
                  <button
                    className="tienda-info-btn"
                    title={producto.descripcion || "Sin descripción"}
                    onClick={() =>
                      toast(producto.descripcion || "Sin descripción", {
                        icon: "ℹ️",
                        duration: 5000,
                      })
                    }
                  >
                    !
                  </button>

                  <p className="tienda-card-nombre" translate="no">
                    {producto.nombre_producto}
                  </p>

                  {producto.categoria_image_url ? (
                    <img
                      src={producto.categoria_image_url}
                      alt={producto.nombre_categoria}
                      className="tienda-card-img"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "";
                      }}
                    />
                  ) : (
                    <PlaceholderImg />
                  )}

                  {esAdmin ? (
                    <p className="tienda-card-disp">
                      Disponibles:{" "}
                      <span
                        className={
                          producto.disponibilidad > 0 ? "disp-ok" : "disp-no"
                        }
                      >
                        {producto.disponibilidad}
                      </span>
                    </p>
                  ) : (
                    <span
                      className={`tienda-badge-disp ${producto.disponibilidad > 0 ? "disp-badge-ok" : "disp-badge-no"}`}
                    >
                      {producto.disponibilidad > 0 ? "Disponible" : "Agotado"}
                    </span>
                  )}

                  <p className="tienda-card-precio">
                    {formatPrecio(producto.precio)}
                  </p>

                  {!esAdmin ? (
                    <button
                      className="tienda-btn-comprar"
                      onClick={() => handleComprar(producto)}
                      disabled={loading || producto.disponibilidad <= 0}
                    >
                      Comprar
                    </button>
                  ) : (
                    <div className="tienda-admin-btns">
                      <button
                        className="tienda-btn-eliminar"
                        onClick={() => setEliminarTarget(producto)}
                      >
                        <i className="bi bi-trash" /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {vista === "subirProducto" && esAdmin && (
            <div className="tienda-form-card">
              <h2>Subir cuenta</h2>
              <form onSubmit={handleSubir} className="tienda-form">
                <select
                  value={catSubir}
                  onChange={(e) => {
                    setCatSubir(e.target.value);
                    setProductoSubir("");
                  }}
                  required
                >
                  <option value="">Selecciona categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id_categoria} value={c.nombre_categoria}>
                      {c.nombre_categoria}
                    </option>
                  ))}
                </select>
                <select
                  value={productoSubir}
                  onChange={(e) => setProductoSubir(e.target.value)}
                  disabled={!catSubir}
                  required
                >
                  <option value="">Selecciona producto</option>
                  {productos
                    .filter((p) => p.nombre_categoria === catSubir)
                    .map((p) => (
                      <option key={p.id_producto} value={p.id_producto}>
                        {p.nombre_producto}
                      </option>
                    ))}
                </select>
                <input
                  placeholder="Correo"
                  value={formSubir.email}
                  onChange={(e) =>
                    setFormSubir({ ...formSubir, email: e.target.value })
                  }
                  autoComplete="off"
                />
                <input
                  placeholder="Contraseña"
                  value={formSubir.contrasena}
                  onChange={(e) =>
                    setFormSubir({ ...formSubir, contrasena: e.target.value })
                  }
                  autoComplete="off"
                />
                <input
                  placeholder="Perfil (separar por espacio si son varios)"
                  value={formSubir.perfil}
                  onChange={(e) =>
                    setFormSubir({ ...formSubir, perfil: e.target.value })
                  }
                  autoComplete="off"
                />
                <input
                  placeholder="PIN (separar por espacio si son varios)"
                  value={formSubir.pin}
                  onChange={(e) =>
                    setFormSubir({ ...formSubir, pin: e.target.value })
                  }
                  autoComplete="off"
                />
                <button type="submit">Subir cuenta</button>
              </form>
            </div>
          )}

          {vista === "crearProducto" && esAdmin && (
            <div className="tienda-form-card">
              <h2>Crear producto</h2>
              <form onSubmit={handleCrear} className="tienda-form">
                <select
                  value={catCrear}
                  onChange={(e) => setCatCrear(e.target.value)}
                  required
                >
                  <option value="">Selecciona categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id_categoria} value={c.nombre_categoria}>
                      {c.nombre_categoria}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Nombre del producto"
                  value={formCrear.nombre}
                  onChange={(e) =>
                    setFormCrear({
                      ...formCrear,
                      nombre: e.target.value.toUpperCase(),
                    })
                  }
                  required
                />
                <textarea
                  placeholder="Descripción"
                  value={formCrear.descripcion}
                  onChange={(e) =>
                    setFormCrear({ ...formCrear, descripcion: e.target.value })
                  }
                  rows={3}
                />
                <input
                  placeholder="Precio (COP)"
                  type="number"
                  min="0"
                  value={formCrear.precio}
                  onChange={(e) =>
                    setFormCrear({ ...formCrear, precio: e.target.value })
                  }
                  required
                />
                <select
                  value={formCrear.tipo_producto}
                  onChange={(e) =>
                    setFormCrear({
                      ...formCrear,
                      tipo_producto: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Tipo de producto</option>
                  <option value="cuenta_completa">Cuenta completa</option>
                  <option value="pantalla">Pantalla</option>
                </select>
                <input
                  placeholder="Duración (días)"
                  type="number"
                  min="1"
                  value={formCrear.duracion_dias}
                  onChange={(e) =>
                    setFormCrear({
                      ...formCrear,
                      duracion_dias: e.target.value,
                    })
                  }
                  required
                />
                <button type="submit">Crear producto</button>
              </form>
            </div>
          )}
        </main>
      </div>
      {compraTarget && (
        <div
          className="tienda-modal-overlay"
          onClick={() => setCompraTarget(null)}
        >
          <div className="tienda-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tienda-modal-icon">🛒</div>
            <h3>Confirmar compra</h3>
            <p>
              ¿Deseas comprar{" "}
              <strong translate="no">"{compraTarget.nombre_producto}"</strong>?
            </p>
            <div className="tienda-modal-detail">
              <span>Precio</span>
              <strong>{formatPrecio(compraTarget.precio)}</strong>
            </div>
            <div className="tienda-modal-detail">
              <span>Duración</span>
              <strong>{compraTarget.duracion_dias} días</strong>
            </div>
            <p className="tienda-modal-hint">
              Los detalles de acceso se copiarán automáticamente al
              portapapeles.
            </p>
            <div className="tienda-modal-btns">
              <button
                className="tienda-modal-cancel"
                onClick={() => setCompraTarget(null)}
              >
                Cancelar
              </button>
              <button
                className="tienda-modal-confirm"
                onClick={confirmarCompra}
                disabled={loading}
              >
                {loading ? "Procesando..." : "Comprar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {eliminarTarget && (
        <div
          className="tienda-modal-overlay"
          onClick={() => setEliminarTarget(null)}
        >
          <div className="tienda-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tienda-modal-icon">🗑️</div>
            <h3>Confirmar eliminación</h3>
            <p>
              ¿Eliminar{" "}
              <strong translate="no">"{eliminarTarget.nombre_producto}"</strong>
              ?
            </p>
            <p className="tienda-modal-hint">
              Esta acción no se puede revertir.
            </p>
            <div className="tienda-modal-btns">
              <button
                className="tienda-modal-cancel"
                onClick={() => setEliminarTarget(null)}
              >
                Cancelar
              </button>
              <button
                className="tienda-modal-confirm"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)",
                }}
                onClick={handleEliminar}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

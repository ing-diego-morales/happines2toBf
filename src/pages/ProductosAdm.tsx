// pages/ProductosAdm.tsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import "./ProductosAdm.css";

interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
}

interface Producto {
  id_producto: number;
  id_categoria: number;
  nombre_categoria?: string;
  nombre_producto: string;
  descripcion?: string;
  disponibilidad: number;
  precio: number;
  duracion_dias: number;
  tipo_producto: string;
}

const PER_PAGE = 15;

const emptyProd = {
  id_categoria: 0,
  nombre_producto: "",
  descripcion: "",
  disponibilidad: 1,
  precio: 0,
  duracion_dias: 30,
  tipo_producto: "cuenta_completa",
};

export default function ProductosAdm() {
  const [productos, setProductos]       = useState<Producto[]>([]);
  const [categorias, setCategorias]     = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm]     = useState("");
  const [currentPage, setCurrentPage]   = useState(1);
  const [maxPages, setMaxPages]         = useState(window.innerWidth <= 768 ? 5 : 9);
  const [editProd, setEditProd]         = useState<Producto | null>(null);
  const [creating, setCreating]         = useState(false);
  const [newProd, setNewProd]           = useState({ ...emptyProd });
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null);

  useEffect(() => {
    const onResize = () => setMaxPages(window.innerWidth <= 768 ? 5 : 9);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loadData = async () => {
    try {
      const [cats, prods] = await Promise.all([
        apiFetch("/api/tienda/categorias"),
        apiFetch("/api/tienda/productos"),
      ]);
      setCategorias(cats);
      setProductos(prods);
      if (cats.length && !newProd.id_categoria)
        setNewProd(p => ({ ...p, id_categoria: cats[0].id_categoria }));
    } catch {
      toast.error("Error al cargar datos");
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = productos.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      String(p.id_producto).includes(q) ||
      p.nombre_producto?.toLowerCase().includes(q) ||
      p.descripcion?.toLowerCase().includes(q) ||
      p.nombre_categoria?.toLowerCase().includes(q) ||
      p.tipo_producto?.toLowerCase().includes(q)
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

  const numField = (val: string) => val === "" ? 0 : Number(val);

  const handleCreate = async () => {
    if (!newProd.nombre_producto.trim() || !newProd.id_categoria) {
      toast.error("Nombre y categoría son obligatorios");
      return;
    }
    try {
      const created: Producto = await apiFetch("/api/tienda/productos", {
        method: "POST",
        body: JSON.stringify(newProd),
      });
      setProductos(prev => [created, ...prev]);
      setCreating(false);
      setNewProd({ ...emptyProd, id_categoria: categorias[0]?.id_categoria || 0 });
      toast.success(`Producto "${created.nombre_producto}" creado`);
    } catch {
      toast.error("No se pudo crear el producto");
    }
  };

  const handleSave = async () => {
    if (!editProd) return;
    try {
      const updated: Producto = await apiFetch(`/api/tienda/productos/${editProd.id_producto}`, {
        method: "PUT",
        body: JSON.stringify(editProd),
      });
      setProductos(prev => prev.map(p => p.id_producto === updated.id_producto ? updated : p));
      setEditProd(null);
      toast.success(`Producto "${updated.nombre_producto}" actualizado`);
    } catch {
      toast.error("No se pudo actualizar el producto");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/tienda/productos/${deleteTarget.id_producto}`, { method: "DELETE" });
      setProductos(prev => prev.filter(p => p.id_producto !== deleteTarget.id_producto));
      toast.success("Producto eliminado");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar el producto");
    } finally {
      setDeleteTarget(null);
    }
  };

  const FormFields = ({ data, onChange }: {
    data: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  }) => (
    <div className="padm-form-fields">
      <label>
        Categoría
        <select name="id_categoria" value={data.id_categoria} onChange={onChange}>
          {categorias.map(c => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
          ))}
        </select>
      </label>
      <label>
        Nombre
        <input name="nombre_producto" value={data.nombre_producto || ""} onChange={onChange} />
      </label>
      <label className="padm-full">
        Descripción
        <textarea name="descripcion" value={data.descripcion || ""} onChange={onChange} rows={2} />
      </label>
      <label>
        Tipo
        <select name="tipo_producto" value={data.tipo_producto} onChange={onChange}>
          <option value="cuenta_completa">Cuenta completa</option>
          <option value="pantalla">Pantalla</option>
        </select>
      </label>
      <label>
        Precio (COP)
        <input type="number" name="precio" value={data.precio ?? 0} onChange={onChange} min="0" />
      </label>
      <label>
        Duración (días)
        <input type="number" name="duracion_dias" value={data.duracion_dias ?? 30} onChange={onChange} min="1" />
      </label>
    </div>
  );

  return (
    <div className="padm-wrapper">
      <div className="padm-container">
        <div className="padm-header">
          <h2>Productos</h2>
          <input
            type="text"
            placeholder="Buscar por ID, nombre, categoría, tipo..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          <button className="padm-btn-create" onClick={() => {
            setNewProd({ ...emptyProd, id_categoria: categorias[0]?.id_categoria || 0 });
            setCreating(true);
          }}>
            + Nuevo producto
          </button>
        </div>

        {creating && (
          <div className="padm-form">
            <h3>Crear producto</h3>
            <FormFields
              data={newProd}
              onChange={e => {
                const { name, value } = e.target;
                const numFields = ["precio", "duracion_dias", "disponibilidad", "id_categoria"];
                setNewProd(p => ({ ...p, [name]: numFields.includes(name) ? numField(value) : value }));
              }}
            />
            <div className="padm-form-btns">
              <button className="padm-btn-save" onClick={handleCreate}>Crear</button>
              <button className="padm-btn-cancel" onClick={() => setCreating(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {editProd && (
          <div className="padm-form">
            <h3>Editar producto</h3>
            <FormFields
              data={editProd}
              onChange={e => {
                const { name, value } = e.target;
                const numFields = ["precio", "duracion_dias", "disponibilidad", "id_categoria"];
                setEditProd(p => p ? ({ ...p, [name]: numFields.includes(name) ? numField(value) : value }) : null);
              }}
            />
            <div className="padm-form-btns">
              <button className="padm-btn-save" onClick={handleSave}>Guardar</button>
              <button className="padm-btn-cancel" onClick={() => setEditProd(null)}>Cancelar</button>
            </div>
          </div>
        )}
        <div className="padm-table-wrap">
          <table className="padm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th className="col-hide">Descripción</th>
                <th>Tipo</th>
                <th>Precio</th>
                <th>Días</th>
                <th>Disp.</th>
                <th>Editar</th>
                <th>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {current.map(p => (
                <tr key={p.id_producto}>
                  <td>{p.id_producto}</td>
                  <td>{p.nombre_producto}</td>
                  <td>{p.nombre_categoria || p.id_categoria}</td>
                  <td className="col-hide">{p.descripcion || "—"}</td>
                  <td>
                    <span className={`padm-badge ${p.tipo_producto === "pantalla" ? "badge-blue" : "badge-green"}`}>
                      {p.tipo_producto}
                    </span>
                  </td>
                  <td>${Number(p.precio).toLocaleString("es-CO")}</td>
                  <td>{p.duracion_dias}</td>
                  <td>
                    <span className={`padm-badge ${Number(p.disponibilidad) > 0 ? "badge-green" : "badge-red"}`}>
                      {Number(p.disponibilidad)}
                    </span>
                  </td>
                  <td><button className="padm-btn-edit" onClick={() => setEditProd({ ...p })}>Editar</button></td>
                  <td><button className="padm-btn-del" onClick={() => setDeleteTarget(p)}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="padm-pagination">
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
      {deleteTarget && (
        <div className="padm-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="padm-modal" onClick={e => e.stopPropagation()}>
            <div className="padm-modal-icon">🗑️</div>
            <h3>Eliminar producto</h3>
            <p>¿Estás seguro de que deseas eliminar <strong>"{deleteTarget.nombre_producto}"</strong>? Esta acción no se puede revertir.</p>
            <div className="padm-modal-btns">
              <button className="padm-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="padm-btn-del-confirm" onClick={confirmDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

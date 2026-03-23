// pages/Categorias.tsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import "./Categorias.css";

interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
  descripcion?: string;
  image_url?: string;
  subject_id: number | null;
}

const PER_PAGE = 15;

export default function Categorias() {
  const [categorias, setCategorias]   = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm]   = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPages, setMaxPages]       = useState(window.innerWidth <= 768 ? 5 : 9);
  const [editCat, setEditCat]         = useState<Categoria | null>(null);
  const [creating, setCreating]       = useState(false);
  const [newCat, setNewCat]           = useState({ nombre_categoria: "", descripcion: "", image_url: "" });
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null);

  useEffect(() => {
    const onResize = () => setMaxPages(window.innerWidth <= 768 ? 5 : 9);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    apiFetch("/api/tienda/categorias")
      .then((data: Categoria[]) => setCategorias(data))
      .catch(() => toast.error("No se pudieron cargar las categorías"));
  }, []);

  const filtered = categorias.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.nombre_categoria?.toLowerCase().includes(q) ||
      c.descripcion?.toLowerCase().includes(q) ||
      String(c.id_categoria).includes(q)
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

  const handleCreate = async () => {
    if (!newCat.nombre_categoria.trim()) { toast.error("El nombre es obligatorio"); return; }
    try {
      const created: Categoria = await apiFetch("/api/tienda/categorias", {
        method: "POST",
        body: JSON.stringify(newCat),
      });
      setCategorias(prev => [...prev, created].sort((a, b) => a.id_categoria - b.id_categoria));
      setCreating(false);
      setNewCat({ nombre_categoria: "", descripcion: "", image_url: "" });
      toast.success(`Categoría "${created.nombre_categoria}" creada`);
    } catch {
      toast.error("No se pudo crear la categoría");
    }
  };

  const handleSave = async () => {
    if (!editCat) return;
    try {
      const updated: Categoria = await apiFetch(`/api/tienda/categorias/${editCat.id_categoria}`, {
        method: "PUT",
        body: JSON.stringify(editCat),
      });
      setCategorias(prev => prev.map(c => c.id_categoria === updated.id_categoria ? updated : c));
      setEditCat(null);
      toast.success(`Categoría "${updated.nombre_categoria}" actualizada`);
    } catch {
      toast.error("No se pudo actualizar la categoría");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/tienda/categorias/${deleteTarget.id_categoria}`, { method: "DELETE" });
      setCategorias(prev => {
        const updated = prev.filter(c => c.id_categoria !== deleteTarget.id_categoria);
        const newTotal = Math.max(1, Math.ceil(
          updated.filter(c => {
            const q = searchTerm.toLowerCase();
            return c.nombre_categoria?.toLowerCase().includes(q) ||
              c.descripcion?.toLowerCase().includes(q) ||
              String(c.id_categoria).includes(q);
          }).length / PER_PAGE
        ));
        if (currentPage > newTotal) setCurrentPage(newTotal);
        return updated;
      });
      toast.success("Categoría eliminada");
    } catch {
      toast.error("No se pudo eliminar la categoría");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="cat-wrapper">
      <div className="cat-container">
        <div className="cat-header">
          <h2>Categorías</h2>
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o ID..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          <button className="cat-btn-create" onClick={() => { setNewCat({ nombre_categoria: "", descripcion: "", image_url: "" }); setCreating(true); }}>
            + Nueva categoría
          </button>
        </div>
        {creating && (
          <div className="cat-form">
            <h3>Crear categoría</h3>
            <div className="cat-form-fields">
              <label>Nombre<input value={newCat.nombre_categoria} onChange={e => setNewCat({ ...newCat, nombre_categoria: e.target.value })} /></label>
              <label>Descripción<input value={newCat.descripcion} onChange={e => setNewCat({ ...newCat, descripcion: e.target.value })} /></label>
              <label className="cat-full">Imagen (URL)<input placeholder="https://..." value={newCat.image_url} onChange={e => setNewCat({ ...newCat, image_url: e.target.value })} /></label>
            </div>
            <div className="cat-form-btns">
              <button className="cat-btn-save" onClick={handleCreate}>Crear</button>
              <button className="cat-btn-cancel" onClick={() => setCreating(false)}>Cancelar</button>
            </div>
          </div>
        )}
        {editCat && (
          <div className="cat-form">
            <h3>Editar categoría</h3>
            <div className="cat-form-fields">
              <label>Nombre<input value={editCat.nombre_categoria || ""} onChange={e => setEditCat({ ...editCat, nombre_categoria: e.target.value })} /></label>
              <label>Descripción<input value={editCat.descripcion || ""} onChange={e => setEditCat({ ...editCat, descripcion: e.target.value })} /></label>
              <label className="cat-full">Imagen (URL)<input placeholder="https://..." value={editCat.image_url || ""} onChange={e => setEditCat({ ...editCat, image_url: e.target.value })} /></label>
            </div>
            <div className="cat-form-btns">
              <button className="cat-btn-save" onClick={handleSave}>Guardar</button>
              <button className="cat-btn-cancel" onClick={() => setEditCat(null)}>Cancelar</button>
            </div>
          </div>
        )}
        <div className="cat-table-wrap">
          <table className="cat-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th className="col-hide">Descripción</th>
                <th>Imagen</th>
                <th>Editar</th>
                <th>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {current.map(c => (
                <tr key={c.id_categoria}>
                  <td>{c.id_categoria}</td>
                  <td>{c.nombre_categoria}</td>
                  <td className="col-hide">{c.descripcion || "—"}</td>
                  <td>
                    {c.image_url
                      ? <img src={c.image_url} alt={c.nombre_categoria} className="cat-img" />
                      : <span className="cat-no-img">Sin imagen</span>}
                  </td>
                  <td><button className="cat-btn-edit" onClick={() => setEditCat(c)}>Editar</button></td>
                  <td><button className="cat-btn-del" onClick={() => setDeleteTarget(c)}>🗑️ Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cat-pagination">
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
        <div className="cat-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="cat-modal" onClick={e => e.stopPropagation()}>
            <div className="cat-modal-icon">🗑️</div>
            <h3>Eliminar categoría</h3>
            <p>¿Estás seguro de que deseas eliminar <strong>"{deleteTarget.nombre_categoria}"</strong>? Esta acción no se puede revertir.</p>
            <div className="cat-modal-btns">
              <button className="cat-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="cat-btn-del-confirm" onClick={confirmDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

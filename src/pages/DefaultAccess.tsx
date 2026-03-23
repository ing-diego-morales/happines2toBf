import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import "./DefaultAccess.css";

interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
  descripcion?: string;
  image_url?: string;
  subjects: { id: number; name: string }[];
}

interface Subject {
  id: number;
  name: string;
}

export default function DefaultAccess() {
  const [categorias, setCategorias]     = useState<Categoria[]>([]);
  const [subjects, setSubjects]         = useState<Subject[]>([]);
  const [saving, setSaving]             = useState<number | null>(null);
  const [searchTerm, setSearchTerm]     = useState("");
  const [showSubjects, setShowSubjects] = useState(false);
  const [newSubject, setNewSubject]     = useState("");
  const [deletingId, setDeletingId]     = useState<number | null>(null);

  const loadData = () =>
    Promise.all([
      apiFetch("/api/tienda/categorias-full"),
      apiFetch("/api/admin/subjects-list"),
    ]).then(([cats, subs]) => {
      setCategorias(Array.isArray(cats) ? cats : []);
      setSubjects(Array.isArray(subs) ? subs : []);
    }).catch(() => toast.error("Error al cargar datos"));

  useEffect(() => { loadData(); }, []);

  const handleLink = async (cat: Categoria, subjectId: number) => {
    if (!subjectId) return;
    if (cat.subjects.find(s => s.id === subjectId)) return;
    setSaving(cat.id_categoria);
    try {
      await apiFetch(`/api/tienda/categorias/${cat.id_categoria}/subjects`, {
        method: "POST",
        body: JSON.stringify({ subject_id: subjectId }),
      });
      const subj = subjects.find(s => s.id === subjectId)!;
      setCategorias(prev => prev.map(c =>
        c.id_categoria === cat.id_categoria
          ? { ...c, subjects: [...c.subjects, subj] }
          : c
      ));
      toast.success(`"${subj.name}" agregado a ${cat.nombre_categoria}`);
    } catch {
      toast.error("Error al vincular subject");
    } finally {
      setSaving(null);
    }
  };

  const handleUnlink = async (cat: Categoria, subjectId: number) => {
    setSaving(cat.id_categoria);
    try {
      await apiFetch(`/api/tienda/categorias/${cat.id_categoria}/subjects/${subjectId}`, {
        method: "DELETE",
      });
      setCategorias(prev => prev.map(c =>
        c.id_categoria === cat.id_categoria
          ? { ...c, subjects: c.subjects.filter(s => s.id !== subjectId) }
          : c
      ));
      toast.success("Subject eliminado");
    } catch {
      toast.error("Error al desvincular subject");
    } finally {
      setSaving(null);
    }
  };

  const handleCreateSubject = async () => {
    const name = newSubject.trim();
    if (!name) { toast.error("Escribe un nombre"); return; }
    try {
      await apiFetch("/api/admin/subjects-default", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setNewSubject("");
      toast.success(`Subject "${name}" creado`);
      loadData();
    } catch {
      toast.error("Error al crear el subject");
    }
  };

  const handleDeleteSubject = async (s: Subject) => {
    if (!window.confirm(`¿Eliminar subject "${s.name}"? Se desvinculará de todas las categorías.`)) return;
    setDeletingId(s.id);
    try {
      await apiFetch(`/api/admin/subjects-default/${s.id}`, { method: "DELETE" });
      toast.success(`Subject "${s.name}" eliminado`);
      loadData();
    } catch {
      toast.error("Error al eliminar el subject");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = categorias.filter(c =>
    c.nombre_categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const linked   = categorias.filter(c => c.subjects.length > 0).length;
  const unlinked = categorias.filter(c => c.subjects.length === 0).length;

  return (
    <div className="dfa-wrapper">
      <div className="dfa-container">
        <div className="dfa-header">
          <div className="dfa-header-left">
            <h2>Accesos por defecto</h2>
            <p className="dfa-subtitle">
              Vincula cada categoría con uno o varios subjects. Al comprar,
              el correo de la cuenta se autoriza automáticamente para
              consultar códigos de esas plataformas.
            </p>
          </div>
          <div className="dfa-header-right">
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button
              className={`dfa-btn-subjects ${showSubjects ? "active" : ""}`}
              onClick={() => setShowSubjects(!showSubjects)}
            >
              <i className="bi bi-tags" />
              Gestionar subjects ({subjects.length})
            </button>
          </div>
        </div>
        {showSubjects && (
          <div className="dfa-subjects-panel">
            <h3>Subjects disponibles</h3>
            <div className="dfa-subject-create">
              <input
                type="text"
                placeholder="Nombre del nuevo subject (ej: Netflix, Disney...)"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateSubject()}
              />
              <button className="dfa-btn-add" onClick={handleCreateSubject}>
                <i className="bi bi-plus-lg" /> Agregar
              </button>
            </div>
            {subjects.length === 0 ? (
              <p className="dfa-subjects-empty">No hay subjects. Crea uno para poder vincular categorías.</p>
            ) : (
              <div className="dfa-subjects-list">
                {subjects.map(s => (
                  <div key={s.id} className="dfa-subject-chip">
                    <span>{s.name}</span>
                    <button
                      className="dfa-subject-del"
                      onClick={() => handleDeleteSubject(s)}
                      disabled={deletingId === s.id}
                      title="Eliminar"
                    >
                      {deletingId === s.id ? "…" : "×"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="dfa-stats">
          <div className="dfa-stat dfa-stat-ok">
            <strong>{linked}</strong>
            <span>Vinculadas</span>
          </div>
          <div className="dfa-stat dfa-stat-warn">
            <strong>{unlinked}</strong>
            <span>Sin vincular</span>
          </div>
          <div className="dfa-stat">
            <strong>{subjects.length}</strong>
            <span>Subjects</span>
          </div>
        </div>
        <div className="dfa-table-wrap">
          <table className="dfa-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Subjects vinculados</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="dfa-empty">No hay categorías</td>
                </tr>
              )}
              {filtered.map(cat => (
                <tr key={cat.id_categoria} className={cat.subjects.length > 0 ? "" : "dfa-row-warn"}>
                  <td>
                    <div className="dfa-cat-name">
                      {cat.image_url && (
                        <img
                          src={cat.image_url}
                          alt={cat.nombre_categoria}
                          className="dfa-cat-img"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <span translate="no">{cat.nombre_categoria}</span>
                    </div>
                  </td>
                  <td>
                    {subjects.length === 0 ? (
                      <span className="dfa-no-subjects">Crea subjects primero ↑</span>
                    ) : (
                      <div className="dfa-multi-subject">
                        {cat.subjects.length > 0 && (
                          <div className="dfa-linked-chips">
                            {cat.subjects.map(s => (
                              <span key={s.id} className="dfa-linked-chip">
                                {s.name}
                                <button
                                  className="dfa-subject-del"
                                  disabled={saving === cat.id_categoria}
                                  onClick={() => handleUnlink(cat, s.id)}
                                  title="Quitar"
                                >×</button>
                              </span>
                            ))}
                          </div>
                        )}
                        {subjects.filter(s => !cat.subjects.find(cs => cs.id === s.id)).length > 0 && (
                          <select
                            className="dfa-select dfa-select-sm"
                            value=""
                            disabled={saving === cat.id_categoria}
                            onChange={e => e.target.value && handleLink(cat, Number(e.target.value))}
                          >
                            <option value="">+ Agregar subject…</option>
                            {subjects
                              .filter(s => !cat.subjects.find(cs => cs.id === s.id))
                              .map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))
                            }
                          </select>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {saving === cat.id_categoria ? (
                      <span className="dfa-badge dfa-saving">Guardando…</span>
                    ) : cat.subjects.length > 0 ? (
                      <span className="dfa-badge dfa-ok">✓ Vinculada</span>
                    ) : (
                      <span className="dfa-badge dfa-warn">Sin vincular</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dfa-info">
          <i className="bi bi-info-circle" />
          <p>
            Al comprar un producto, el sistema autoriza automáticamente el correo
            de la cuenta comprada para consultar códigos de <strong>todos</strong> los
            subjects vinculados a esa categoría.
          </p>
        </div>

      </div>
    </div>
  );
}

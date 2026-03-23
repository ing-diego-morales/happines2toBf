import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import "./RankingModal.css";

interface RankingEntry {
  id_usuario: number;
  nombre_usuario: string;
  total_ventas: number;
  monto_total_ventas: number;
  posicion: number;
}

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function RankingModal({ isOpen, onClose }: RankingModalProps) {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);

    apiFetch("/ranking")
      .then((data: RankingEntry[]) => setRankings(data.slice(0, 10)))
      .catch((err) => {
        console.error("Error fetch ranking:", err);
        setRankings([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMonth = new Date().toLocaleString("es-CO", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rm-header">
          <div className="rm-title-row">
            <span className="rm-trophy">🏆</span>
            <div>
              <h2 className="rm-title">Ranking del Mes</h2>
              <p className="rm-subtitle">{currentMonth}</p>
            </div>
          </div>
          <button className="rm-close" onClick={onClose}>✕</button>
        </div>
        <div className="rm-body">
          {loading ? (
            <div className="rm-loading">
              <div className="rm-spinner" />
              <span>Cargando ranking…</span>
            </div>
          ) : rankings.length === 0 ? (
            <p className="rm-empty">Sin ventas registradas este mes.</p>
          ) : (
            <ol className="rm-list">
              {rankings.map((r) => (
                <li
                  key={r.id_usuario}
                  className={`rm-item rm-pos-${r.posicion <= 3 ? r.posicion : "rest"}`}
                >
                  <span className="rm-rank">
                    {MEDAL[r.posicion] ?? `#${r.posicion}`}
                  </span>
                  <span className="rm-name">{r.nombre_usuario}</span>
                  <span className="rm-sales">
                    {r.total_ventas}
                    <span className="rm-sales-label"> ventas</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

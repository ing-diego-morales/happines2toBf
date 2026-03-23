import { Outlet, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import RankingModal from "./RankingModal";
import "./Layout.css";
import { useTranslation } from "react-i18next";
import { ThemeContext } from "../context/ThemeContext";
import RecargaModal from "./RecargaModal";

function Layout() {
  const { t, i18n } = useTranslation();
  const { logout, user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [recargaOpen, setRecargaOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatSaldo = (saldo: number) =>
    Number(saldo).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    });

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} />

      <div className="main-area">
        <header className="navbar">
          <div className="nav-left">
            <button
              className="menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>

            <h3>{t("navbar.panel")}</h3>
            <button
              className="nav-ranking-btn"
              title="Ranking del mes"
              onClick={() => setRankingOpen(true)}
            >
              🏆
            </button>
          </div>

          <div className="nav-right">
            {user && (
              <div
                className="nav-saldo"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <i className="bi bi-wallet2" />
                <span>{formatSaldo(user.saldo ?? 0)}</span>

                <button
                  className="btn-recargar"
                  title="Recarga temporalmente deshabilitada"
                  disabled
                  style={{ opacity: 0.5, cursor: "not-allowed" }}
                >
                  <span className="btn-recargar-full">Pronto</span>
                  <span className="btn-recargar-icon">🔒</span>
                </button>
              </div>
            )}

            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            <select
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              defaultValue={i18n.language}
              className="lang-select"
            >
              <option value="es">🇪🇸 ES</option>
              <option value="en">🇺🇸 EN</option>
              <option value="pt">🇧🇷 PT</option>
            </select>

            <button className="logout-btn" onClick={handleLogout}>
              <span className="logout-full">{t("navbar.logout")}</span>
              <span className="logout-icon">⏻</span>
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>

        <footer className="footer">
          © {new Date().getFullYear()} Infinity Services - Dev:&nbsp;
          <a
            href="https://wa.me/573024824806"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-link"
          >
            Diego Morales
          </a>
        </footer>
      </div>
      <RankingModal
        isOpen={rankingOpen}
        onClose={() => setRankingOpen(false)}
      />
      <RecargaModal
        isOpen={recargaOpen}
        onClose={() => setRecargaOpen(false)}
      />
    </div>
  );
}

export default Layout;

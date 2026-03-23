import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "./Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
}

function Sidebar({ isOpen }: SidebarProps) {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const esAdmin = user?.role === "admin";
  const location = useLocation();

  const avatars = [
    "https://i.pravatar.cc/150?img=1",
    "https://i.pravatar.cc/150?img=2",
    "https://i.pravatar.cc/150?img=3",
    "https://i.pravatar.cc/150?img=4",
    "https://i.pravatar.cc/150?img=5",
    "https://i.pravatar.cc/150?img=6",
    "https://i.pravatar.cc/150?img=7",
    "https://i.pravatar.cc/150?img=8",
    "https://i.pravatar.cc/150?img=9",
    "https://i.pravatar.cc/150?img=10",
  ];

  const [avatar, setAvatar] = useState(avatars[0]);
  const [adminOpen, setAdminOpen] = useState(false);

  const changeAvatar = () => {
    const randomIndex = Math.floor(Math.random() * avatars.length);
    setAvatar(avatars[randomIndex]);
  };

  if (!user) return null;

  const formattedDate =
    user.lastConnection &&
    !isNaN(Date.parse(user.lastConnection.replace(" ", "T")))
      ? new Date(user.lastConnection.replace(" ", "T")).toLocaleString()
      : "—";

  const isAdminRoute =
    location.pathname === "/categorias" ||
    location.pathname === "/productos-adm";

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-top">
        <h2>{t("sidebar.title")}</h2>

        <img src={logo} alt="Logo" className="sidebar-logo" />

        <nav>
          <Link to="/home">{t("sidebar.home")}</Link>
          <Link to="/codes">{t("sidebar.codes")}</Link>
          <Link to="/authorizedEmails">{t("sidebar.authorizedEmails")}</Link>
          <Link to="/shop">{t("sidebar.shoppin")}</Link>
          <Link to="/historial">
            {esAdmin ? t("sidebar.ventas") : t("sidebar.historial")}
          </Link>
          {user.role === "admin" && (
            <>
              <Link to="/users">{t("sidebar.users")}</Link>
              <div className="sidebar-dropdown">
                <button
                  className={`sidebar-dropdown-toggle ${adminOpen || isAdminRoute ? "active" : ""}`}
                  onClick={() => setAdminOpen(!adminOpen)}
                >
                  <span>{t("sidebar.admin")}</span>
                  <svg
                    className={`dropdown-chevron ${adminOpen ? "open" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {adminOpen && (
                  <div className="sidebar-dropdown-menu">
                    <Link
                      to="/categorias"
                      className={
                        location.pathname === "/categorias" ? "active" : ""
                      }
                      onClick={() => setAdminOpen(false)}
                    >
                      <i className="bi bi-grid" /> {t("sidebar.categories")}
                    </Link>

                    <Link
                      to="/productos-adm"
                      className={
                        location.pathname === "/productos-adm" ? "active" : ""
                      }
                      onClick={() => setAdminOpen(false)}
                    >
                      <i className="bi bi-box-seam" />{" "}
                      {t("sidebar.productsAdmin")}
                    </Link>

                    <Link
                      to="/default-access"
                      onClick={() => setAdminOpen(false)}
                    >
                      <i className="bi bi-shield-check" />{" "}
                      {t("sidebar.defaultAccess")}
                    </Link>

                    <Link
                      to="/modificar-cuentas"
                      className={
                        location.pathname === "/modificar-cuentas"
                          ? "active"
                          : ""
                      }
                      onClick={() => setAdminOpen(false)}
                    >
                      <i className="bi bi-pencil-square" />{" "}
                      {t("sidebar.modifyAccounts")}
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}

          <Link to="/profile">{t("sidebar.profile")}</Link>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-profile">
          <img src={avatar} alt="Profile" onClick={changeAvatar} />
          <div className="profile-info">
            <p className="profile-name">{user.first_name}</p>
            <p className="profile-last">
              {t("profile.lastConnection")}:
              <br />
              {formattedDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

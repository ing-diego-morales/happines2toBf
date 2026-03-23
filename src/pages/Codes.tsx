import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./Codes.css";
import { useTranslation } from "react-i18next";

const API_URL = import.meta.env.VITE_API_URL;

interface Email {
  id: string;
  subject: string;
  date: string;
  account: string;
  searchedEmail: string;
}

interface FullEmail {
  id: string;
  subject: string;
  date: string;
  body: string;
}

function Codes() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<FullEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [darkViewer, setDarkViewer] = useState(false);

  const isValidEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const search = async () => {
    if (!query.trim()) {
      toast.error(t("codes.emailRequired"));
      return;
    }

    if (!isValidEmail(query)) {
      toast.error(t("codes.invalidEmail"));
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      setSelectedEmail(null);

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/api/email/search-email`,
        { query },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.data || res.data.length === 0) {
        toast("No se encontraron correos en los últimos 20 minutos.", {
          icon: "📭",
        });
      } else {
        toast.success("Resultados encontrados.");
      }

      setEmails(res.data);
    } catch (err: any) {

  if (err.response?.status === 423) {
    toast.error(
      "Tu cuenta fue bloqueada por seguridad. Contacta al administrador."
    );
    setEmails([]);
    return;
  }

  if (err.response?.status === 403) {
    if (err.response.data?.error === "EMAIL_NOT_AUTHORIZED") {
      toast.error("Este correo no está autorizado.");
    } else if (err.response.data?.error === "NO_SUBJECTS_ASSIGNED") {
      toast.error("Este correo no tiene asuntos autorizados.");
    } else {
      toast.error("Acceso no permitido.");
    }
  } else {
    toast.error("Error al buscar correos.");
  }

  setEmails([]);
} finally {
      setLoading(false);
    }
  };

  const openEmail = async (email: Email) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API_URL}/api/email/${email.id}?userEmail=${email.account}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSelectedEmail(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Error al abrir el correo.");
    }
  };

  const clearSearch = () => {
    setQuery("");
    setEmails([]);
    setSelectedEmail(null);
    setHasSearched(false);

    toast(t("codes.searchCleared"), {
      icon: "🧹",
    });
  };

  return (
    <div className="codes-container">
      <h1 className="codes-container-title">{t("codes.title")}</h1>

      <div className="search-box">
        <input
          type="email"
          placeholder={t("codes.placeholder")}
          value={query}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/\s/g, "").toLowerCase();

            setQuery(cleaned);
          }}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />

        <button onClick={search} disabled={loading}>
          {t("codes.search")}
        </button>
        <button className="clear-btn" onClick={clearSearch} disabled={loading}>
          {t("codes.clear")}
        </button>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className="content-wrapper">
        <div className="results">
          {hasSearched && emails.length === 0 && !loading && (
            <p className="empty">{t("codes.noResults")}</p>
          )}

          {emails.map((email) => (
            <div
              key={email.id}
              className="email-card"
              onClick={() => openEmail(email)}
            >
              <h3>{email.subject}</h3>
              <p className="date">{email.date}</p>
              <span className="account">{email.searchedEmail}</span>
            </div>
          ))}
        </div>

        {selectedEmail && (
          <div className={`email-viewer ${darkViewer ? "dark" : ""}`}>
            <div className="viewer-header">
              <button
                className="theme-toggle"
                onClick={() => setDarkViewer(!darkViewer)}
              >
                {darkViewer ? "☀" : "🌙"}
              </button>
            </div>

            <h2>{selectedEmail.subject}</h2>
            <p className="date">{selectedEmail.date}</p>
            <iframe
              className="email-iframe"
              sandbox=""
              title="Email preview"
              srcDoc={`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { margin: 0; padding: 0; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${selectedEmail.body}
        <script>
          window.onload = function() {
            const height = document.body.scrollHeight;
            parent.postMessage({ height }, "*");
          };
        </script>
      </body>
    </html>
  `}
              ref={(iframe) => {
                if (!iframe) return;

                window.addEventListener("message", (event) => {
                  if (event.data.height) {
                    iframe.style.height = event.data.height + "px";
                  }
                });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Codes;

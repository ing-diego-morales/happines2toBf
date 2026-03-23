import { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../services/api";
import "./AuthorizedEmails.css";

interface AuthorizedEmail {
  id: number;
  email: string;
}

interface Subject {
  id: number;
  name: string;
}

function AuthorizedEmails() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const [emails, setEmails] = useState<AuthorizedEmail[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchEmails = async () => {
      try {
        setLoading(true);

        const data = await apiFetch(
          `/api/admin/users/${user.id}/authorized-emails`
        );

        setEmails(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [user]);

  const fetchSubjects = async (emailId: number) => {
    try {
      setLoading(true);
      setSelectedEmail(emailId);

      const data = await apiFetch(
        `/api/admin/authorized-emails/${emailId}/subjects`
      );

      setSubjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = useMemo(() => {
    return emails.filter((e) =>
      e.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [emails, search]);

  if (!user) return null;

  return (
    <div className="authorized-container">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className="authorized-card">
        <div className="authorized-left">
          <h2>{t("authorized.titleEmails")}</h2>

          <div className="authorized-emails-wrapper">
            {filteredEmails.length === 0 ? (
              <p className="empty-text">{t("authorized.noEmails")}</p>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={`authorized-chip ${
                    selectedEmail === email.id ? "active" : ""
                  }`}
                  onClick={() => fetchSubjects(email.id)}
                >
                  {email.email}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="authorized-right">
          <h2>{t("authorized.titleSubjects")}</h2>

          {!selectedEmail ? (
            <p className="empty-text">{t("authorized.selectEmail")}</p>
          ) : subjects.length === 0 ? (
            <p className="empty-text">{t("authorized.noSubjectsYet")}</p>
          ) : (
            <div className="subjects-wrapper">
              {subjects.map((subject) => (
                <div key={subject.id} className="subject-chip">
                  {subject.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="search-box-authorized">
        <input
          type="text"
          placeholder="Buscar correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );
}

export default AuthorizedEmails;
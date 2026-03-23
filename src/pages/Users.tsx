import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "./Users.css";
import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "react-phone-number-input";
import { apiFetch } from "../services/api";
import { useRef } from "react";

interface User {
  id: number;
  first_name: string;
  email: string;
  phone: string;
  role: string;
  saldo?: number;
  locked?: number;
  created_at?: string;
  last_connection?: string;
}

const IconEye = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

interface AuthorizedEmail {
  id: number;
  email: string;
}

interface Subject {
  id: number;
  name: string;
}

function Users() {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmail[]>(
    [],
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [resetPassword, setResetPassword] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<AuthorizedEmail | null>(
    null,
  );
  const [emailSearch, setEmailSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [activeSection, setActiveSection] = useState<
    "users" | "emails" | "subjects"
  >("users");
  const [newUser, setNewUser] = useState({
    first_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [newEmail, setNewEmail] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"edit" | "delete" | "view" | null>(
    null,
  );
  const [editSaldo, setEditSaldo] = useState<string>("");
  const [savingSaldo, setSavingSaldo] = useState(false);
  const [modalEntity, setModalEntity] = useState<
    "user" | "email" | "subject" | null
  >(null);
  const [subjectFile, setSubjectFile] = useState<File | null>(null);
  const subjectFileInputRef = useRef<HTMLInputElement | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [editValue, setEditValue] = useState("");
  const filteredEmails = authorizedEmails.filter((e) =>
    e.email.toLowerCase().includes(emailSearch.toLowerCase()),
  );
  const [saldoMode, setSaldoMode] = useState<"set" | "add">("set");
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );
  const [emailFile, setEmailFile] = useState<File | null>(null);
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error(t("users.selectUser"));
      return;
    }

    if (!resetPassword || resetPassword.length < 6) {
      toast.error(t("users.passwordMin"));
      return;
    }

    try {
      await apiFetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: "PUT",
        body: JSON.stringify({ newPassword: resetPassword }),
      });

      toast.success(t("users.passwordUpdated"));
      setResetPassword("");
    } catch (err: any) {
      toast.error(
        toast.error(
          err?.response?.data?.message || t("users.passwordUpdateError"),
        ),
      );
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await apiFetch("/api/admin/users");
      setUsers(data);
    } catch {
      toast.error(t("users.loadUsersError"));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedEmail) {
          setSelectedEmail(null);
          setSubjects([]);
          setActiveSection("emails");
          return;
        }

        if (selectedUser) {
          setSelectedUser(null);
          setSelectedEmail(null);
          setAuthorizedEmails([]);
          setSubjects([]);
          setActiveSection("users");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUser, selectedEmail]);

  const handleSelectUser = async (u: User) => {
    if (selectedUser?.id === u.id) {
      setSelectedUser(null);
      setSelectedEmail(null);
      setAuthorizedEmails([]);
      setSubjects([]);
      setActiveSection("users");
      return;
    }

    setSelectedUser(u);
    setSelectedEmail(null);
    setSubjects([]);
    setActiveSection("emails");

    try {
      const data = await apiFetch(`/api/admin/users/${u.id}/authorized-emails`);
      setAuthorizedEmails(data);
    } catch {
      toast.error(t("users.loadEmailsError"));
    }
  };
  const handleBulkEmails = async () => {
    if (!emailFile || !selectedUser) {
      toast.error(t("users.selectUserFile"));
      return;
    }

    const text = await emailFile.text();

    const emails = text
      .split(";")
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));

    if (emails.length === 0) {
      toast.error(t("users.invalidEmails"));
      return;
    }

    try {
      await apiFetch("/api/admin/authorized-emails/bulk", {
        method: "POST",
        body: JSON.stringify({
          user_id: selectedUser.id,
          emails,
        }),
      });

      toast.success(t("users.emailsAdded", { count: emails.length }));

      const data = await apiFetch(
        `/api/admin/users/${selectedUser.id}/authorized-emails`,
      );

      setAuthorizedEmails(data);
      setEmailFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      toast.error(t("users.uploadEmailsError"));
    }
  };

  const handleBulkSubjects = async () => {
    if (!subjectFile || !selectedUser || !selectedEmail) {
      toast.error(t("users.selectEmailFirst"));
      return;
    }

    const text = await subjectFile.text();

    const subjects = text
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (subjects.length === 0) {
      toast.error(t("users.invalidSubjects"));
      return;
    }

    try {
      await apiFetch("/api/admin/subjects/bulk", {
        method: "POST",
        body: JSON.stringify({
          user_id: selectedUser.id,
          authorized_email_id: selectedEmail.id,
          subjects,
        }),
      });

      toast.success(t("users.subjectsAdded", { count: subjects.length }));

      const data = await apiFetch(
        `/api/admin/authorized-emails/${selectedEmail.id}/subjects`,
      );

      setSubjects(data);
      setSubjectFile(null);

      if (subjectFileInputRef.current) {
        subjectFileInputRef.current.value = "";
      }
    } catch {
      toast.error(t("users.uploadSubjectsError"));
    }
  };

  const handleSelectEmail = async (email: AuthorizedEmail) => {
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(null);
      setSubjects([]);
      setActiveSection("emails");
      return;
    }

    setSelectedEmail(email);
    setActiveSection("subjects");

    try {
      const data = await apiFetch(
        `/api/admin/authorized-emails/${email.id}/subjects`,
      );
      setSubjects(data);
    } catch {
      toast.error(t("users.loadSubjectsError"));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.first_name || !newUser.email || !newUser.password) {
      toast.error(t("users.requiredFields"));
      return;
    }

    if (newUser.password.length < 6) {
      toast.error(t("users.passwordMin"));
      return;
    }

    if (newUser.phone && !isValidPhoneNumber(newUser.phone)) {
      toast.error(t("users.invalidPhone"));
      return;
    }

    try {
      await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      });

      toast.success(t("users.userCreated"));

      setNewUser({
        first_name: "",
        email: "",
        phone: "",
        password: "",
      });

      loadUsers();
    } catch (err: any) {
      toast.error(err.message || t("users.createUserError"));
    }
  };

  const handleCreateEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error(t("users.selectUserFirst"));
      return;
    }

    if (!newEmail.trim()) {
      toast.error(t("users.emailRequired"));
      return;
    }

    try {
      await apiFetch("/api/admin/authorized-emails", {
        method: "POST",
        body: JSON.stringify({
          user_id: selectedUser.id,
          email: newEmail,
        }),
      });

      toast.success(t("users.emailAdded"));
      setNewEmail("");

      const data = await apiFetch(
        `/api/admin/users/${selectedUser.id}/authorized-emails`,
      );
      setAuthorizedEmails(data);
    } catch (err: any) {
      toast.error(err.message || t("users.addEmailError"));
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !selectedEmail) {
      toast.error(t("users.selectEmailFirst"));
      return;
    }

    if (!newSubject.trim()) {
      toast.error(t("users.subjectRequired"));
      return;
    }

    try {
      await apiFetch("/api/admin/subjects", {
        method: "POST",
        body: JSON.stringify({
          user_id: selectedUser.id,
          name: newSubject,
          authorized_email_id: selectedEmail.id,
        }),
      });

      toast.success(t("users.subjectCreated"));
      setNewSubject("");

      const data = await apiFetch(
        `/api/admin/authorized-emails/${selectedEmail.id}/subjects`,
      );
      setSubjects(data);
    } catch (err: any) {
      toast.error(err.message || t("users.createSubjectError"));
    }
  };

  const currentLocale =
    i18n.language === "en"
      ? "en-US"
      : i18n.language === "pt"
        ? "pt-BR"
        : "es-CO";

  const formatDate = (val?: string) => {
    if (!val) return t("users.modal.empty");
    return new Date(val).toLocaleString(currentLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCOP = (val?: number) =>
    val !== null && val !== undefined
      ? new Intl.NumberFormat(currentLocale, {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(Number(val))
      : t("users.modal.empty");

  const openViewModal = (u: User) => {
    setModalType("view");
    setModalEntity("user");
    setModalData(u);
    setEditSaldo("");
    setShowModal(true);
  };

  const openEditModal = (entity: "user" | "email" | "subject", data: any) => {
    setModalType("edit");
    setModalEntity(entity);
    setModalData(data);
    setEditValue(data.email || data.name || data.first_name);
    setShowModal(true);
  };

  const openDeleteModal = (entity: "user" | "email" | "subject", data: any) => {
    setModalType("delete");
    setModalEntity(entity);
    setModalData(data);
    setShowModal(true);
  };

  const handleSaveSaldo = async () => {
    if (editSaldo === "" || !modalData) return;

    const cantidad = parseFloat(editSaldo);

    if (isNaN(cantidad)) {
      toast.error(t("users.balance.invalidNumber"));
      return;
    }

    const nuevoSaldo =
      saldoMode === "add"
        ? (Number(modalData.saldo) || 0) + cantidad
        : cantidad;

    if (nuevoSaldo < 0) {
      toast.error(t("users.balance.negativeNotAllowed"));
      return;
    }

    setSavingSaldo(true);

    try {
      await apiFetch(`/api/admin/users/${modalData.id}`, {
        method: "PUT",
        body: JSON.stringify({
          first_name: modalData.first_name,
          email: modalData.email,
          phone: modalData.phone,
          role: modalData.role,
          saldo: nuevoSaldo,
        }),
      });

      toast.success(
        saldoMode === "add"
          ? t("users.balance.updatedAddSubtract", {
              action:
                cantidad >= 0
                  ? t("users.balance.actions.added")
                  : t("users.balance.actions.subtracted"),
            })
          : t("users.balance.updatedSet"),
      );

      setModalData({ ...modalData, saldo: nuevoSaldo });
      setEditSaldo("");
      loadUsers();
    } catch {
      toast.error(t("users.balance.updateError"));
    } finally {
      setSavingSaldo(false);
    }
  };

  const handleConfirm = async () => {
    if (!modalEntity || !modalData) return;

    try {
      if (modalType === "edit") {
        if (modalEntity === "user") {
          await apiFetch(`/api/admin/users/${modalData.id}`, {
            method: "PUT",
            body: JSON.stringify({
              first_name: modalData.first_name,
              email: editValue,
              phone: modalData.phone,
              role: modalData.role,
            }),
          });
          loadUsers();
        }

        if (modalEntity === "email") {
          await apiFetch(`/api/admin/authorized-emails/${modalData.id}`, {
            method: "PUT",
            body: JSON.stringify({ email: editValue }),
          });
          if (selectedUser) handleSelectUser(selectedUser);
        }

        if (modalEntity === "subject") {
          await apiFetch(`/api/admin/subjects/${modalData.id}`, {
            method: "PUT",
            body: JSON.stringify({ name: editValue }),
          });
          if (selectedEmail) handleSelectEmail(selectedEmail);
        }

        toast.success(t("users.updated"));
      }

      if (modalType === "delete") {
        if (modalEntity === "user") {
          await apiFetch(`/api/admin/users/${modalData.id}`, {
            method: "DELETE",
          });

          loadUsers();
        }

        if (modalEntity === "email") {
          await apiFetch(`/api/admin/authorized-emails/${modalData.id}`, {
            method: "DELETE",
          });

          if (selectedUser) {
            const data = await apiFetch(
              `/api/admin/users/${selectedUser.id}/authorized-emails`,
            );

            setAuthorizedEmails(data);
          }
        }

        if (modalEntity === "subject") {
          await apiFetch(`/api/admin/subjects/${modalData.id}`, {
            method: "DELETE",
            body: JSON.stringify({ authorized_email_id: selectedEmail?.id }),
          });

          if (selectedEmail) {
            const data = await apiFetch(
              `/api/admin/authorized-emails/${selectedEmail.id}/subjects`,
            );

            setSubjects(data);
          }
        }

        toast.success(t("users.deleted"));
      }

      setShowModal(false);
    } catch (err) {
      toast.error(t("users.operationError"));
    }
  };

  return (
    <div className="users-container">
      <div className="users-card">
        <div className="users-left">
          <h2>{t("users.title")}</h2>
          <div className="users-list">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className={`user-chip ${selectedUser?.id === u.id ? "active" : ""}`}
              >
                <span
                  onClick={() => handleSelectUser(u)}
                  className="user-chip-text"
                >
                  {u.email}

                  {u.role === "admin" && (
                    <span className="admin-badge">
                      👑 {t("users.badges.admin")}
                    </span>
                  )}

                  {u.locked === 1 && (
                    <span className="locked-badge">
                      🔒 {t("users.badges.locked")}
                    </span>
                  )}
                </span>

                <div className="chip-actions">
                  {u.locked === 1 && (
                    <button
                      className="unlock-btn"
                      onClick={async () => {
                        try {
                          await apiFetch(`/api/admin/users/${u.id}/unlock`, {
                            method: "PUT",
                          });
                          toast.success(t("users.unlockedSuccess"));
                          loadUsers();
                        } catch {
                          toast.error(t("users.unlockedError"));
                        }
                      }}
                    >
                      🔓
                    </button>
                  )}

                  <div
                    className="chip-btn view"
                    title={t("users.viewDetail")}
                    onClick={() => openViewModal(u)}
                  >
                    <IconEye />
                  </div>

                  <div
                    className="chip-btn edit"
                    onClick={() => openEditModal("user", u)}
                  >
                    ✎
                  </div>
                  <div
                    className="chip-btn delete"
                    onClick={() => openDeleteModal("user", u)}
                  >
                    ✕
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="users-search-bottom">
            <input
              type="text"
              placeholder={t("users.searchUser")}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="users-right">
          <div className="right-top">
            <h3>{t("users.authorizedEmails")}</h3>

            <div className="authorized-emails-container">
              <div className="authorized-emails-wrapper">
                {filteredEmails.map((e) => (
                  <div
                    key={e.id}
                    className={`subject-chip ${
                      selectedEmail?.id === e.id ? "active" : ""
                    }`}
                  >
                    <span onClick={() => handleSelectEmail(e)}>{e.email}</span>

                    <div className="chip-actions">
                      <div
                        className="chip-btn edit"
                        onClick={() => openEditModal("email", e)}
                      >
                        ✎
                      </div>
                      <div
                        className="chip-btn delete"
                        onClick={() => openDeleteModal("email", e)}
                      >
                        ✕
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="authorized-search-bottom">
                <input
                  type="text"
                  placeholder={t("users.searchEmail")}
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="right-bottom">
            <h3>{t("users.authorizedSubjects")}</h3>
            <div className="subjects-wrapper">
              {subjects.map((s) => (
                <div key={s.id} className="subject-chip">
                  {s.name}

                  <div className="chip-actions">
                    <div
                      className="chip-btn edit"
                      onClick={() => openEditModal("subject", s)}
                    >
                      ✎
                    </div>
                    <div
                      className="chip-btn delete"
                      onClick={() => openDeleteModal("subject", s)}
                    >
                      ✕
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="crud-panel">
        {activeSection === "users" && (
          <form onSubmit={handleCreateUser} className="crud-form">
            <input
              placeholder={t("users.name")}
              value={newUser.first_name}
              onChange={(e) =>
                setNewUser({ ...newUser, first_name: e.target.value })
              }
            />
            <input
              placeholder={t("users.email")}
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />
            <PhoneInput
              international
              defaultCountry="CO"
              placeholder={t("users.phone")}
              value={newUser.phone}
              onChange={(value) =>
                setNewUser({ ...newUser, phone: value || "" })
              }
            />
            <input
              type="password"
              placeholder={t("users.password")}
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
            />
            <button type="submit">{t("users.createUser")}</button>
          </form>
        )}

        {activeSection === "emails" && selectedUser && (
          <div className="crud-row">
            <form onSubmit={handleCreateEmail} className="crud-form">
              <input
                placeholder={t("users.newAuthorizedEmail")}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <button type="submit">{t("users.addEmail")}</button>
            </form>
            <div className="bulk-upload">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={(e) => setEmailFile(e.target.files?.[0] || null)}
              />

              <button type="button" onClick={handleBulkEmails}>
                {t("users.uploadTxt")}
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="crud-form">
              <input
                type="password"
                placeholder={t("users.newPassword")}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
              <button type="submit">{t("users.updatePassword")}</button>
            </form>
          </div>
        )}
        {activeSection === "subjects" && selectedUser && (
          <div className="crud-row">
            <form onSubmit={handleCreateSubject} className="crud-form">
              <input
                placeholder={t("users.newSubject")}
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              <button type="submit">{t("users.createSubject")}</button>
            </form>

            <div className="bulk-upload-subjects">
              <input
                ref={subjectFileInputRef}
                type="file"
                accept=".txt"
                onChange={(e) => setSubjectFile(e.target.files?.[0] || null)}
              />

              <button type="button" onClick={handleBulkSubjects}>
                {t("users.uploadTxt")}
              </button>
            </div>
          </div>
        )}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {modalType === "view" && modalData && (
              <>
                <div className="modal-view-header">
                  <div className="modal-view-avatar">
                    {modalData.first_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="modal-view-name">{modalData.first_name}</h3>
                    <span
                      className={`modal-view-role ${modalData.role === "admin" ? "role-admin" : "role-user"}`}
                    >
                      {modalData.role === "admin"
                        ? `👑 ${t("users.modal.roles.admin")}`
                        : t("users.modal.roles.user")}
                    </span>
                  </div>
                </div>

                <div className="modal-view-grid">
                  <div className="modal-view-item">
                    <span className="modal-view-label">
                      {t("users.modal.id")}
                    </span>
                    <span className="modal-view-value">#{modalData.id}</span>
                  </div>

                  <div className="modal-view-item">
                    <span className="modal-view-label">
                      {t("users.modal.email")}
                    </span>
                    <span className="modal-view-value">{modalData.email}</span>
                  </div>

                  <div className="modal-view-item">
                    <span className="modal-view-label">
                      {t("users.modal.phone")}
                    </span>
                    <span className="modal-view-value">
                      {modalData.phone || t("users.modal.empty")}
                    </span>
                  </div>

                  <div className="modal-view-item modal-saldo-row">
                    <span className="modal-view-label">
                      {t("users.modal.currentBalance")}
                    </span>
                    <span className="modal-view-value saldo-value">
                      {formatCOP(modalData.saldo)}
                    </span>

                    <div className="saldo-mode-tabs">
                      <button
                        type="button"
                        className={`saldo-tab ${saldoMode === "set" ? "active" : ""}`}
                        onClick={() => {
                          setSaldoMode("set");
                          setEditSaldo("");
                        }}
                      >
                        {t("users.modal.balanceModes.set")}
                      </button>
                      <button
                        type="button"
                        className={`saldo-tab ${saldoMode === "add" ? "active" : ""}`}
                        onClick={() => {
                          setSaldoMode("add");
                          setEditSaldo("");
                        }}
                      >
                        {t("users.modal.balanceModes.addSubtract")}
                      </button>
                    </div>

                    <p className="saldo-hint">
                      {saldoMode === "set"
                        ? t("users.modal.balanceHints.set")
                        : t("users.modal.balanceHints.addSubtract")}
                    </p>

                    <div className="saldo-edit-row">
                      <input
                        type="number"
                        step="100"
                        placeholder={
                          saldoMode === "set"
                            ? t("users.modal.placeholders.newBalance")
                            : t("users.modal.placeholders.balanceExample")
                        }
                        value={editSaldo}
                        onChange={(e) => setEditSaldo(e.target.value)}
                        className="saldo-input"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveSaldo();
                        }}
                      />

                      {editSaldo !== "" && (
                        <span className="saldo-preview">
                          →{" "}
                          {formatCOP(
                            saldoMode === "add"
                              ? (Number(modalData.saldo) || 0) +
                                  parseFloat(editSaldo || "0")
                              : parseFloat(editSaldo || "0"),
                          )}
                        </span>
                      )}

                      <button
                        className="saldo-save-btn"
                        disabled={savingSaldo || editSaldo === ""}
                        onClick={handleSaveSaldo}
                      >
                        {savingSaldo
                          ? t("users.modal.saving")
                          : t("users.modal.save")}
                      </button>
                    </div>
                  </div>

                  <div className="modal-view-item">
                    <span className="modal-view-label">
                      {t("users.modal.createdAt")}
                    </span>
                    <span className="modal-view-value">
                      {formatDate(modalData.created_at)}
                    </span>
                  </div>

                  <div className="modal-view-item">
                    <span className="modal-view-label">
                      {t("users.modal.lastConnection")}
                    </span>
                    <span className="modal-view-value">
                      {formatDate(modalData.last_connection)}
                    </span>
                  </div>

                  <div className="modal-view-item">
                    <span className="modal-view-label">
                      {t("users.modal.status")}
                    </span>
                    <span
                      className={`modal-view-value ${modalData.locked ? "estado-bloqueado" : "estado-activo"}`}
                    >
                      {modalData.locked
                        ? `🔒 ${t("users.modal.statusValues.locked")}`
                        : `✓ ${t("users.modal.statusValues.active")}`}
                    </span>
                  </div>
                </div>

                <button
                  className="modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  {t("users.modal.close")}
                </button>
              </>
            )}

            {modalType === "edit" && (
              <>
                <h3>{t("users.edit")}</h3>
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
                <button onClick={handleConfirm}>
                  {t("users.modal.update")}
                </button>
                <button onClick={() => setShowModal(false)}>
                  {t("users.cancel")}
                </button>
              </>
            )}

            {modalType === "delete" && (
              <>
                <h3>{t("users.confirmDelete")}</h3>
                <button onClick={handleConfirm}>{t("users.confirm")}</button>
                <button onClick={() => setShowModal(false)}>
                  {t("users.cancel")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;

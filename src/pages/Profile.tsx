import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import "./Profile.css";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface ProfileData {
  first_name: string;
  email: string;
  phone: string;
  saldo: number;
  created_at: string;
  last_connection: string;
}

export default function Profile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiFetch("/api/auth/profile");
      setProfile(data);
    } catch (error) {
      console.error(error);
      toast.error(t("profile.error"));
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!newPassword) {
      toast.error(t("profile.passwordRequired"));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("profile.passwordMinLength"));
      return;
    }

    try {
      setUpdating(true);

      await apiFetch("/api/auth/update-password", {
        method: "PUT",
        body: JSON.stringify({ newPassword }),
      });

      toast.success(t("profile.success"));
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.message || t("profile.error"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>{t("profile.title")}</h2>

        <div className="profile-grid">
          <div className="profile-field">
            <label>{t("profile.name")}</label>
            <div className="profile-value">{profile.first_name}</div>
          </div>

          <div className="profile-field">
            <label>{t("profile.email")}</label>
            <div className="profile-value">{profile.email}</div>
          </div>

          <div className="profile-field">
            <label>{t("profile.phone")}</label>
            <div className="profile-value">{profile.phone || "-"}</div>
          </div>
          <div className="profile-field">
            <label>Saldo disponible</label>
            <div className="profile-value profile-saldo">
              {Number(profile.saldo).toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              })}
            </div>
          </div>
          <div className="profile-field">
            <label>{t("profile.password")}</label>
            <div className="profile-value password-hidden">************</div>
          </div>

          <div className="profile-field">
            <label>{t("profile.createdAt")}</label>
            <div className="profile-value">
              {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>

          <div className="profile-field">
            <label>{t("profile.lastConnection")}</label>
            <div className="profile-value">
              {profile.last_connection
                ? new Date(profile.last_connection).toLocaleString()
                : t("profile.never")}
            </div>
          </div>
        </div>

        <div className="profile-update">
          <input
            type="password"
            placeholder={t("profile.newPassword")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button onClick={updatePassword} disabled={updating}>
            {updating ? t("profile.updating") : t("profile.updatePassword")}
          </button>
        </div>
      </div>
    </div>
  );
}

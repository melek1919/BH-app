import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/bh-logo.png";

const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Erreur de champ animée en hauteur (grid-template-rows 0fr → 1fr) :
// glisse et s'efface en douceur, sans jamais "sauter" la mise en page.
function FieldError({ message }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: message ? "1fr" : "0fr",
        transition: "grid-template-rows 0.22s ease",
      }}
    >
      <div style={{ overflow: "hidden" }}>
        <p
          className="d-flex align-items-center gap-1 mb-0"
          style={{ fontSize: 11.5, color: "#B3261E", paddingTop: 5 }}
        >
          <AlertCircle size={12} style={{ flexShrink: 0 }} />
          {message}
        </p>
      </div>
    </div>
  );
}

// Champ avec icône, halo de focus et bordure animée — pas de doublon
// de style natif du navigateur (outline retiré, géré à 100% ici).
function IconInput({ icon: Icon, error, right, ...props }) {
  const [focused, setFocused] = useState(false);
  const accent = error ? "#B3261E" : focused ? NAVY : BORDER;

  return (
    <div
      className="d-flex align-items-center rounded-3"
      style={{
        border: `1.5px solid ${accent}`,
        backgroundColor: "#fff",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        boxShadow: focused
          ? `0 0 0 3.5px ${error ? "rgba(179,38,30,0.10)" : "rgba(11,31,56,0.09)"}`
          : "none",
      }}
    >
      <Icon size={16} color={error ? "#B3261E" : MUTED} style={{ marginLeft: 12, flexShrink: 0 }} />
      <input
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={{
          border: "none",
          outline: "none",
          boxShadow: "none",
          background: "transparent",
          fontSize: 13.5,
          padding: "11px 10px",
          flexGrow: 1,
          minWidth: 0,
        }}
      />
      {right && <div style={{ marginRight: 10, flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = "L'email est requis";
    else if (!EMAIL_REGEX.test(email.trim())) next.email = "Format d'email invalide";
    if (!motDePasse) next.motDePasse = "Le mot de passe est requis";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await login(email.trim(), motDePasse);
    } catch (err) {
      setServerError(err.message || "Une erreur est survenue");
      setShake(true);
      setTimeout(() => setShake(false), 420);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100 w-100"
      style={{
        background: `radial-gradient(circle at 28% 22%, #17324F 0%, ${NAVY} 48%, #071322 100%)`,
      }}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className={shake ? "bh-shake" : ""}
        style={{
          width: 380,
          maxWidth: "90vw",
          backgroundColor: "#fff",
          borderRadius: 20,
          padding: "40px 34px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.12)",
          animation: "bh-fade-in 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="text-center mb-4">
          <img src={logo} alt="BH Assurances" style={{ height: 38, marginBottom: 18, objectFit: "contain" }} />
          <p className="mb-0 fw-semibold" style={{ fontSize: 17.5, color: "#161B22" }}>
            Connexion
          </p>
          <p className="mb-0" style={{ fontSize: 12.5, color: MUTED }}>
            Espace agents BH Assurances
          </p>
        </div>

        {/* Erreur serveur (identifiants incorrects, compte désactivé...) */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: serverError ? "1fr" : "0fr",
            transition: "grid-template-rows 0.25s ease",
          }}
        >
          <div style={{ overflow: "hidden" }}>
            <div
              className="d-flex align-items-center gap-2 rounded-3"
              style={{
                backgroundColor: "#FBE7E7",
                color: "#B3261E",
                fontSize: 12.5,
                padding: "9px 12px",
                marginBottom: 16,
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {serverError}
            </div>
          </div>
        </div>

        <label style={{ fontSize: 12, fontWeight: 500, color: MUTED, display: "block", marginBottom: 6 }}>
          Email
        </label>
        <IconInput
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="vous@bhassurances.tn"
          value={email}
          error={errors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
          }}
        />
        <FieldError message={errors.email} />

        <label style={{ fontSize: 12, fontWeight: 500, color: MUTED, display: "block", margin: "14px 0 6px" }}>
          Mot de passe
        </label>
        <IconInput
          icon={Lock}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          value={motDePasse}
          error={errors.motDePasse}
          onChange={(e) => {
            setMotDePasse(e.target.value);
            if (errors.motDePasse) setErrors((p) => ({ ...p, motDePasse: undefined }));
          }}
          right={
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((s) => !s)}
              className="btn btn-sm border-0 p-0 d-flex align-items-center"
              style={{ background: "transparent" }}
            >
              {showPassword ? <EyeOff size={15} color={MUTED} /> : <Eye size={15} color={MUTED} />}
            </button>
          }
        />
        <FieldError message={errors.motDePasse} />

        <button
          type="submit"
          disabled={submitting}
          className="btn w-100 d-flex align-items-center justify-content-center gap-2 text-white bh-login-btn"
          style={{
            fontSize: 14,
            fontWeight: 500,
            padding: "12px 0",
            backgroundColor: NAVY,
            border: "none",
            borderRadius: 11,
            marginTop: 22,
            boxShadow: "0 6px 16px rgba(11,31,56,0.28)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
            opacity: submitting ? 0.85 : 1,
          }}
        >
          {submitting ? <Loader2 size={16} className="bh-spin" /> : <LogIn size={16} />}
          {submitting ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <style>{`
        @keyframes bh-fade-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bh-shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-5px); }
          40%, 60% { transform: translateX(5px); }
        }
        .bh-shake { animation: bh-shake 0.42s ease; }
        @keyframes bh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .bh-spin { animation: bh-spin 0.8s linear infinite; }
        .bh-login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(11,31,56,0.34);
        }
        .bh-login-btn:active:not(:disabled) {
          transform: translateY(0px);
        }
        .bh-login-btn:disabled { cursor: not-allowed; }
        input::placeholder { color: #A3ADB8; }
      `}</style>
    </div>
  );
}

import { useState, useRef, useLayoutEffect, useCallback } from "react";
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Loader2, User, Phone, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/bh-logo.png";

const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FieldError({ message }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: message ? "1fr" : "0fr",
        transition: "grid-template-rows 0.2s ease",
      }}
    >
      <div style={{ overflow: "hidden" }}>
        <p
          className="d-flex align-items-center gap-1 mb-0"
          style={{ fontSize: 11, color: "#B3261E", paddingTop: 4, lineHeight: 1.3 }}
        >
          <AlertCircle size={10} style={{ flexShrink: 0 }} />
          {message}
        </p>
      </div>
    </div>
  );
}

function IconInput({ icon: Icon, error, right, small, ...props }) {
  const [focused, setFocused] = useState(false);
  const accent = error ? "#B3261E" : focused ? NAVY : BORDER;
  const pad = small ? "9px 8px" : "11px 10px";
  const iconSize = small ? 14 : 16;

  return (
    <div
      className="d-flex align-items-center rounded-3"
      style={{
        border: `1.5px solid ${accent}`,
        backgroundColor: "#fff",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        boxShadow: focused
          ? `0 0 0 3px ${error ? "rgba(179,38,30,0.10)" : "rgba(11,31,56,0.08)"}`
          : "none",
      }}
    >
      <Icon size={iconSize} color={error ? "#B3261E" : MUTED} style={{ marginLeft: 10, flexShrink: 0 }} />
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          border: "none",
          outline: "none",
          boxShadow: "none",
          background: "transparent",
          fontSize: small ? 12.5 : 13.5,
          padding: pad,
          flexGrow: 1,
          minWidth: 0,
        }}
      />
      {right && <div style={{ marginRight: 8, flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn border-0"
      style={{
        flex: 1,
        fontSize: 13,
        fontWeight: active ? 600 : 450,
        color: active ? NAVY : "#9AA6B2",
        padding: "7px 0",
        background: "transparent",
        position: "relative",
        zIndex: 1,
        transition: "color 0.25s ease",
      }}
    >
      {label}
    </button>
  );
}

function FieldGroup({ label, required, children }) {
  return (
    <div>
      <label style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, display: "block", marginBottom: 4 }}>
        {label}
        {required && <span style={{ color: "#B3261E", marginLeft: 1 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function LoginPage() {
  const { login, register: registerUser } = useAuth();
  const [mode, setMode] = useState("login");
  const [loginData, setLoginData] = useState({ email: "", motDePasse: "" });
  const [registerData, setRegisterData] = useState({ nom: "", prenom: "", email: "", tel: "", motDePasse: "", confirmMotDePasse: "" });
  const [showPassword, setShowPassword] = useState({ login: false, register: false });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [formHeight, setFormHeight] = useState("auto");
  const [mounted, setMounted] = useState(false);

  const loginContentRef = useRef(null);
  const registerContentRef = useRef(null);

  const isLogin = mode === "login";
  const isRegister = mode === "register";

  const measureHeight = useCallback(() => {
    const el = isLogin ? loginContentRef.current : registerContentRef.current;
    if (el) {
      const style = getComputedStyle(el);
      const marginTop = parseFloat(style.marginTop) || 0;
      const marginBottom = parseFloat(style.marginBottom) || 0;
      setFormHeight(el.scrollHeight + marginTop + marginBottom);
    }
  }, [isLogin]);

  useLayoutEffect(() => { measureHeight(); setMounted(true); }, [measureHeight]);

  useLayoutEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(measureHeight, 60);
    return () => clearTimeout(timer);
  }, [errors, serverError, measureHeight, mounted]);

  const set = (group) => (field) => (e) => {
    const updater = group === "login" ? setLoginData : setRegisterData;
    updater((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const validateLogin = () => {
    const next = {};
    if (!loginData.email.trim()) next.email = "L'email est requis";
    else if (!EMAIL_REGEX.test(loginData.email.trim())) next.email = "Format invalide";
    if (!loginData.motDePasse) next.motDePasse = "Mot de passe requis";
    return next;
  };

  const validateRegister = () => {
    const next = {};
    if (!registerData.nom.trim()) next.nom = "Nom requis";
    if (!registerData.email.trim()) next.email = "Email requis";
    else if (!EMAIL_REGEX.test(registerData.email.trim())) next.email = "Format invalide";
    if (registerData.tel && !/^[+\d\s-]{8,}$/.test(registerData.tel.trim())) next.tel = "Numéro invalide";
    if (!registerData.motDePasse) next.motDePasse = "Mot de passe requis";
    else if (registerData.motDePasse.length < 8) next.motDePasse = "Min. 8 caractères";
    if (registerData.motDePasse !== registerData.confirmMotDePasse) next.confirmMotDePasse = "Ne correspond pas";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const nextErrors = isLogin ? validateLogin() : validateRegister();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      if (isLogin) {
        await login(loginData.email.trim(), loginData.motDePasse);
      } else {
        await registerUser({
          nom: registerData.nom.trim(),
          prenom: registerData.prenom.trim(),
          email: registerData.email.trim(),
          tel: registerData.tel.trim() || null,
          mot_de_passe: registerData.motDePasse,
        });
      }
    } catch (err) {
      setServerError(err.message || "Une erreur est survenue");
      setShake(true);
      setTimeout(() => setShake(false), 420);
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setErrors({});
    setServerError("");
  };

  const SubmitIcon = isLogin ? LogIn : UserPlus;

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
          width: 480,
          maxWidth: "90vw",
          backgroundColor: "#fff",
          borderRadius: 18,
          padding: "28px 30px 26px",
          overflow: "hidden",
          boxShadow: "0 20px 56px rgba(0,0,0,0.32), 0 2px 6px rgba(0,0,0,0.10)",
          animation: "bh-fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="text-center mb-3">
          <img src={logo} alt="BH Assurances" style={{ height: 28, objectFit: "contain" }} />
        </div>

        <div
          className="d-flex rounded-pill mb-3"
          style={{ backgroundColor: "#F0F2F5", padding: 3, position: "relative" }}
        >
          <div
            style={{
              position: "absolute",
              top: 3,
              left: isLogin ? 3 : "50%",
              width: "calc(50% - 3px)",
              height: "calc(100% - 6px)",
              backgroundColor: "#fff",
              borderRadius: 999,
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
              transition: "left 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              zIndex: 0,
            }}
          />
          <TabButton label="Connexion" active={isLogin} onClick={() => switchMode("login")} />
          <TabButton label="S'inscrire" active={isRegister} onClick={() => switchMode("register")} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateRows: serverError ? "1fr" : "0fr",
            transition: "grid-template-rows 0.22s ease",
          }}
        >
          <div style={{ overflow: "hidden" }}>
            <div
              className="d-flex align-items-center gap-2 rounded-3"
              style={{
                backgroundColor: "#FBE7E7",
                color: "#B3261E",
                fontSize: 12,
                padding: "8px 11px",
                marginBottom: 14,
              }}
            >
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {serverError}
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            height: formHeight,
            transition: mounted ? "height 0.35s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            boxSizing: "border-box",
          }}
        >
          <div
            ref={loginContentRef}
            style={{
              position: isLogin ? "relative" : "absolute",
              top: 0,
              left: 0,
              width: "100%",
              boxSizing: "border-box",
              opacity: isLogin ? 1 : 0,
              transform: isLogin ? "translateX(0)" : "translateX(-18px)",
              transition: "opacity 0.25s ease, transform 0.3s ease",
              pointerEvents: isLogin ? "auto" : "none",
            }}
          >
            <FieldGroup label="Email" required>
              <IconInput
                icon={Mail}
                type="email"
                autoComplete="email"
                placeholder="vous@bhassurances.tn"
                value={loginData.email}
                error={errors.email}
                onChange={set("login")("email")}
              />
              <FieldError message={errors.email} />
            </FieldGroup>

            <div style={{ marginTop: 14 }}>
              <FieldGroup label="Mot de passe" required>
                <IconInput
                  icon={Lock}
                  type={showPassword.login ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginData.motDePasse}
                  error={errors.motDePasse}
                  onChange={set("login")("motDePasse")}
                  right={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((s) => ({ ...s, login: !s.login }))}
                      className="btn btn-sm border-0 p-0 d-flex align-items-center"
                      style={{ background: "transparent" }}
                    >
                      {showPassword.login ? <EyeOff size={14} color={MUTED} /> : <Eye size={14} color={MUTED} />}
                    </button>
                  }
                />
                <FieldError message={errors.motDePasse} />
              </FieldGroup>
            </div>
          </div>

          <div
            ref={registerContentRef}
            style={{
              position: isRegister ? "relative" : "absolute",
              top: 0,
              left: 0,
              width: "100%",
              boxSizing: "border-box",
              opacity: isRegister ? 1 : 0,
              transform: isRegister ? "translateX(0)" : "translateX(18px)",
              transition: "opacity 0.25s ease, transform 0.3s ease",
              pointerEvents: isRegister ? "auto" : "none",
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <FieldGroup label="Nom" required>
                  <IconInput small icon={User} type="text" autoComplete="family-name" placeholder="Nom"
                    value={registerData.nom} error={errors.nom} onChange={set("register")("nom")} />
                  <FieldError message={errors.nom} />
                </FieldGroup>
              </div>
              <div style={{ flex: 1 }}>
                <FieldGroup label="Prénom">
                  <IconInput small icon={User} type="text" autoComplete="given-name" placeholder="Prénom"
                    value={registerData.prenom} error={errors.prenom} onChange={set("register")("prenom")} />
                  <FieldError message={errors.prenom} />
                </FieldGroup>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <FieldGroup label="Email" required>
                  <IconInput small icon={Mail} type="email" autoComplete="email" placeholder="email@exemple.tn"
                    value={registerData.email} error={errors.email} onChange={set("register")("email")} />
                  <FieldError message={errors.email} />
                </FieldGroup>
              </div>
              <div style={{ flex: 1 }}>
                <FieldGroup label="Téléphone">
                  <IconInput small icon={Phone} type="tel" autoComplete="tel" placeholder="+216 XX XXX XXX"
                    value={registerData.tel} error={errors.tel} onChange={set("register")("tel")} />
                  <FieldError message={errors.tel} />
                </FieldGroup>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <FieldGroup label="Mot de passe" required>
                  <IconInput small icon={Lock} type={showPassword.register ? "text" : "password"}
                    autoComplete="new-password" placeholder="Min. 8 car."
                    value={registerData.motDePasse} error={errors.motDePasse}
                    onChange={set("register")("motDePasse")}
                    right={
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowPassword((s) => ({ ...s, register: !s.register }))}
                        className="btn btn-sm border-0 p-0 d-flex align-items-center"
                        style={{ background: "transparent" }}>
                        {showPassword.register ? <EyeOff size={13} color={MUTED} /> : <Eye size={13} color={MUTED} />}
                      </button>
                    }
                  />
                  <FieldError message={errors.motDePasse} />
                </FieldGroup>
              </div>
              <div style={{ flex: 1 }}>
                <FieldGroup label="Confirmer" required>
                  <IconInput small icon={Lock} type={showPassword.register ? "text" : "password"}
                    autoComplete="new-password" placeholder="Retaper"
                    value={registerData.confirmMotDePasse} error={errors.confirmMotDePasse}
                    onChange={set("register")("confirmMotDePasse")} />
                  <FieldError message={errors.confirmMotDePasse} />
                </FieldGroup>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn w-100 d-flex align-items-center justify-content-center gap-2 text-white"
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            padding: "11px 0",
            backgroundColor: NAVY,
            border: "none",
            borderRadius: 10,
            marginTop: 20,
            boxShadow: "0 5px 14px rgba(11,31,56,0.25)",
            transition: "transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease",
            opacity: submitting ? 0.8 : 1,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => { if (!submitting) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(11,31,56,0.30)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
        >
          {submitting ? <Loader2 size={15} className="bh-spin" /> : <SubmitIcon size={15} />}
          {submitting
            ? (isLogin ? "Connexion..." : "Inscription...")
            : (isLogin ? "Se connecter" : "S'inscrire")}
        </button>

        <p className="text-center mb-0 mt-3" style={{ fontSize: 11.5, color: "#9AA6B2" }}>
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <button
            type="button"
            onClick={() => switchMode(isLogin ? "register" : "login")}
            className="btn border-0 p-0 ms-1"
            style={{ fontSize: 11.5, fontWeight: 600, color: NAVY, background: "transparent", verticalAlign: "baseline" }}
          >
            {isLogin ? "Créer un compte" : "Se connecter"}
          </button>
        </p>
      </form>

      <style>{`
        @keyframes bh-fade-in {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
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
        input::placeholder { color: #A3ADB8; }
      `}</style>
    </div>
  );
}

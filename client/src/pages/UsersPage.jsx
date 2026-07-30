import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Search,
  Plus,
  X,
  Pencil,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  ShieldOff,
  Users,
  Clock,
  ChevronDown,
} from "lucide-react";
import { utilisateurApi } from "../services/api";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import Pagination from "../components/Pagination";
import SortBar from "../components/SortBar";

const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

const ROLE_LABELS = {
  guest: "Invité",
  admin: "Administrateur",
  gestion_etablissement: "Gestion établissements",
  gestion_vehicule: "Gestion véhicules",
  gestion_globale: "Gestion globale",
};

const ROLE_COLORS = {
  admin: "#B3261E",
  guest: "#0B1F38",
  gestion_etablissement: "#2B6CB0",
  gestion_vehicule: "#1E7B3A",
  gestion_globale: "#B8912E",
};

const EMPTY_FORM = {
  nom: "",
  prenom: "",
  email: "",
  tel: "",
  mot_de_passe: "",
  role: "guest",
};

function Panel({ title, children }) {
  return (
    <div className="p-3 rounded-4 bg-white h-100" style={{ border: `1px solid ${BORDER}` }}>
      <p className="mb-3 fw-semibold" style={{ fontSize: 14 }}>{title}</p>
      {children}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, boxShadow: "0 2px 8px rgba(15,31,56,0.08)" }}>
      <p className="mb-0 fw-semibold" style={{ color: NAVY }}>{ROLE_LABELS[d.name] || d.name}</p>
      <p className="mb-0" style={{ color: MUTED }}>{d.value} utilisateur{d.value > 1 ? "s" : ""}</p>
    </div>
  );
}

function UserModal({ mode = "create", initialData, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(initialData || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = () => {
    const nextErrors = {};
    if (!form.nom.trim()) nextErrors.nom = "Champ requis";
    if (!form.email.trim()) nextErrors.email = "Champ requis";
    else if (!/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(form.email)) nextErrors.email = "Format email invalide";
    if (mode === "create" && !form.mot_de_passe) nextErrors.mot_de_passe = "Champ requis";
    else if (mode === "create" && form.mot_de_passe.length < 8) nextErrors.mot_de_passe = "Min 8 caractères";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      nom: form.nom,
      prenom: form.prenom || null,
      email: form.email,
      tel: form.tel || null,
      role: form.role,
    };
    if (mode === "create") payload.mot_de_passe = form.mot_de_passe;
    onSubmit(payload);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: "fixed", inset: 0, background: "rgba(11,31,56,0.35)", zIndex: 60 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-4 p-4 modal-pop" style={{ width: 460, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto" }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <p className="mb-0 fw-semibold" style={{ fontSize: 15 }}>
            {mode === "edit" ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </p>
          <button className="btn btn-sm border-0 p-1" onClick={onClose}><X size={18} color={MUTED} /></button>
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Nom *</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: errors.nom ? "#B3261E" : BORDER }} value={form.nom} onChange={update("nom")} placeholder="Dupont" />
            {errors.nom && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.nom}</p>}
          </div>
          <div className="col-6">
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Prénom</label>
            <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.prenom || ""} onChange={update("prenom")} placeholder="Jean" />
          </div>
        </div>

        <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Email *</label>
        <input className="form-control" style={{ fontSize: 13, borderColor: errors.email ? "#B3261E" : BORDER }} value={form.email} onChange={update("email")} placeholder="jean.dupont@example.com" />
        {errors.email && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.email}</p>}

        <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Téléphone</label>
        <input className="form-control" style={{ fontSize: 13, borderColor: BORDER }} value={form.tel || ""} onChange={update("tel")} placeholder="+216 00 000 000" />

        {mode === "create" && (
          <>
            <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Mot de passe *</label>
            <input type="password" className="form-control" style={{ fontSize: 13, borderColor: errors.mot_de_passe ? "#B3261E" : BORDER }} value={form.mot_de_passe} onChange={update("mot_de_passe")} placeholder="Min 8 caractères" />
            {errors.mot_de_passe && <p style={{ fontSize: 11.5, color: "#B3261E", margin: "4px 0 0" }}>{errors.mot_de_passe}</p>}
          </>
        )}

        <label style={{ fontSize: 12, color: MUTED, fontWeight: 600, letterSpacing: "0.3px", display: "block", margin: "8px 0 4px" }}>Rôle *</label>
        <select className="form-select" style={{ fontSize: 13, borderColor: BORDER }} value={form.role} onChange={update("role")}>
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <div className="d-flex gap-2 mt-4">
          <button className="btn flex-grow-1" style={{ fontSize: 13, borderColor: BORDER, color: MUTED }} onClick={onClose} disabled={submitting}>Annuler</button>
          <button className="btn flex-grow-1 text-white d-flex align-items-center justify-content-center gap-2" style={{ fontSize: 13, backgroundColor: NAVY, borderColor: NAVY }} onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 size={14} className="spin" />}
            {mode === "edit" ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("tous");

  const [modalMode, setModalMode] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [changingRoleId, setChangingRoleId] = useState(null);
  const PER_PAGE = 20;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await utilisateurApi.getAll());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const roleDistribution = useMemo(() => {
    const map = {};
    users.forEach((u) => { map[u.role] = (map[u.role] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [users]);

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = users.filter((u) => {
      const matchesSearch = !q ||
        (u.nom || "").toLowerCase().includes(q) ||
        (u.prenom || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q);
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatut = statutFilter === "tous" || (statutFilter === "actif" ? u.actif : !u.actif);
      return matchesSearch && matchesRole && matchesStatut;
    });
    list.sort((a, b) => {
      if (sortKey === "nom") {
        const va = (a.nom || "").toLowerCase();
        const vb = (b.nom || "").toLowerCase();
        return sortDir === "asc" ? (va < vb ? -1 : va > vb ? 1 : 0) : (va < vb ? 1 : va > vb ? -1 : 0);
      }
      const va = new Date(a[sortKey] || 0).getTime();
      const vb = new Date(b[sortKey] || 0).getTime();
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return list;
  }, [users, search, roleFilter, statutFilter, sortKey, sortDir]);

  useEffect(() => { setPage(1); }, [filtered.length]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openCreate = () => { setEditingUser(null); setModalMode("create"); };
  const openEdit = (u) => { setEditingUser(u); setModalMode("edit"); };
  const closeModal = () => { setModalMode(null); setEditingUser(null); };

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (modalMode === "edit") {
        await utilisateurApi.update(editingUser.id, form);
        setToast("Utilisateur mis à jour");
      } else {
        await utilisateurApi.create(form);
        setToast("Utilisateur créé");
      }
      closeModal();
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActif = async (u) => {
    try {
      if (u.actif) {
        await utilisateurApi.desactiver(u.id);
        setToast("Utilisateur désactivé");
      } else {
        await utilisateurApi.activer(u.id);
        setToast("Utilisateur activé");
      }
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    setChangingRoleId(null);
    if (newRole === user.role) return;
    try {
      await utilisateurApi.update(user.id, {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        tel: user.tel,
        role: newRole,
      });
      setToast(`Rôle changé → ${ROLE_LABELS[newRole]}`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalActifs = users.filter((u) => u.actif).length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalGuests = users.filter((u) => u.role === "guest").length;

  return (
    <div>
      {toast && (
        <div className="d-flex align-items-center gap-2 p-2 rounded-3 mb-3" style={{ background: "#E7F5EC", color: "#1E7B3A", fontSize: 12.5, width: "fit-content" }}>
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-3">
          <div className="d-flex flex-column gap-1 p-3 rounded-4 bg-white" style={{ border: `1px solid ${BORDER}` }}>
            <Users size={18} color={NAVY} />
            <p className="mb-0 fw-bold" style={{ fontSize: 24, color: "#161B22" }}>{users.length}</p>
            <p className="mb-0" style={{ fontSize: 12.5, color: MUTED }}>Total utilisateurs</p>
          </div>
        </div>
        <div className="col-3">
          <div className="d-flex flex-column gap-1 p-3 rounded-4 bg-white" style={{ border: `1px solid ${BORDER}` }}>
            <Shield size={18} color="#B3261E" />
            <p className="mb-0 fw-bold" style={{ fontSize: 24, color: "#161B22" }}>{totalAdmins}</p>
            <p className="mb-0" style={{ fontSize: 12.5, color: MUTED }}>Administrateurs</p>
          </div>
        </div>
        <div className="col-3">
          <div className="d-flex flex-column gap-1 p-3 rounded-4 bg-white" style={{ border: `1px solid ${BORDER}` }}>
            <CheckCircle2 size={18} color="#1E7B3A" />
            <p className="mb-0 fw-bold" style={{ fontSize: 24, color: "#161B22" }}>{totalActifs}</p>
            <p className="mb-0" style={{ fontSize: 12.5, color: MUTED }}>Actifs</p>
          </div>
        </div>
        <div className="col-3">
          <div className="d-flex flex-column gap-1 p-3 rounded-4 bg-white" style={{ border: `1px solid ${BORDER}` }}>
            <User size={18} color="#6B7684" />
            <p className="mb-0 fw-bold" style={{ fontSize: 24, color: "#161B22" }}>{totalGuests}</p>
            <p className="mb-0" style={{ fontSize: 12.5, color: MUTED }}>Invités</p>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-4">
          <Panel title="Répartition par rôle">
            {users.length === 0 ? (
              <div className="d-flex align-items-center justify-content-center" style={{ height: 220, color: MUTED, fontSize: 13 }}>
                Aucune donnée
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={roleDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} stroke="none">
                    {roleDistribution.map((entry) => (
                      <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || "#6B7684"} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="d-flex flex-wrap gap-2 mt-2 justify-content-center">
              {roleDistribution.map((r) => (
                <span key={r.name} style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, backgroundColor: ROLE_COLORS[r.name] + "18", color: ROLE_COLORS[r.name] }}>
                  {ROLE_LABELS[r.name] || r.name}: {r.value}
                </span>
              ))}
            </div>
          </Panel>
        </div>
        <div className="col-8">
          <Panel title="Activité récente">
            {recentUsers.length === 0 ? (
              <div className="d-flex align-items-center justify-content-center" style={{ height: 220, color: MUTED, fontSize: 13 }}>
                Aucun utilisateur
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {recentUsers.map((u) => (
                  <div key={u.id} className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                    <span className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 32, height: 32, backgroundColor: "#EEF2F7", flexShrink: 0 }}>
                      <User size={14} color={NAVY} />
                    </span>
                    <div className="flex-grow-1">
                      <p className="mb-0 fw-medium" style={{ fontSize: 12.5 }}>{u.prenom || ""} {u.nom}</p>
                      <p className="mb-0" style={{ fontSize: 11, color: MUTED }}>{u.email} · {ROLE_LABELS[u.role] || u.role}{u.actif ? "" : " · Inactif"}</p>
                    </div>
                    <Clock size={13} color={MUTED} />
                    <span style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap" }}>
                      {new Date(u.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-end mb-0">
        <button className="btn d-flex align-items-center gap-2 text-white rounded-3" style={{ fontSize: 13.5, padding: "9px 16px", backgroundColor: NAVY, borderColor: NAVY }} onClick={openCreate}>
          <Plus size={15} /> Nouvel utilisateur
        </button>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
        <div className="d-flex gap-2 flex-wrap">
          <div className="position-relative">
            <Search size={14} color={MUTED} style={{ position: "absolute", left: 12, top: 11 }} />
            <input className="form-control rounded-3" style={{ fontSize: 13, paddingLeft: 34, width: 280, borderColor: BORDER }} placeholder="Rechercher un utilisateur..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <select className="form-select rounded-3" style={{ fontSize: 13, borderColor: BORDER, width: 160 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tous les rôles</option>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <div className="d-flex align-items-center rounded-3 p-1" style={{ backgroundColor: "#F1F2F4" }}>
            {[
              { key: "tous", label: "Tous" },
              { key: "actif", label: "Actifs" },
              { key: "inactif", label: "Inactifs" },
            ].map((opt) => (
              <button
                key={opt.key}
                className="btn btn-sm border-0"
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  padding: "5px 14px",
                  borderRadius: 8,
                  backgroundColor: statutFilter === opt.key ? "#fff" : "transparent",
                  color: statutFilter === opt.key ? NAVY : MUTED,
                  boxShadow: statutFilter === opt.key ? "0 1px 3px rgba(11,31,56,0.12)" : "none",
                }}
                onClick={() => setStatutFilter(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <SortBar
            options={[
              { key: "created_at", label: "Date" },
              { key: "nom", label: "Alphabétique" },
            ]}
            sortKey={sortKey}
            sortDir={sortDir}
            onChange={(k, d) => { setSortKey(k); setSortDir(d); }}
          />
        </div>

        <span style={{ fontSize: 12.5, color: MUTED }}>{loading ? "Chargement..." : `${filtered.length} utilisateur${filtered.length > 1 ? "s" : ""}`}</span>
      </div>

      {error && (
        <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-3" style={{ background: "#FBE7E7", color: "#B3261E", fontSize: 13 }}>
          <AlertCircle size={16} /> {error}
          <button className="btn btn-sm ms-auto" style={{ fontSize: 12, color: "#B3261E", textDecoration: "underline" }} onClick={loadData}>Réessayer</button>
        </div>
      )}

      <div className="rounded-4 bg-white overflow-hidden" style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(11,31,56,0.04)" }}>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5" style={{ color: MUTED, fontSize: 13 }}>
            <Loader2 size={18} className="spin me-2" /> Chargement des utilisateurs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5 text-center" style={{ color: MUTED, fontSize: 13 }}>Aucun utilisateur ne correspond à ces critères.</div>
        ) : (
          <>
            <table className="w-100" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "#FAFBFC" }}>
                  <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 16px" }}>Utilisateur</th>
                  <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 8px" }}>Rôle</th>
                  <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "center", padding: "12px 8px" }}>Statut</th>
                  <th style={{ fontSize: 11.5, fontWeight: 500, color: MUTED, textAlign: "left", padding: "12px 8px" }}>Contact</th>
                  <th style={{ padding: "12px 16px" }}></th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((u) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: `1px solid ${BORDER}`, transition: "background-color 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFBFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 34, height: 34, backgroundColor: "#EEF2F7", flexShrink: 0 }}>
                          <User size={15} color={NAVY} />
                        </span>
                        <div>
                          <p className="mb-0 fw-medium" style={{ fontSize: 13 }}>{u.prenom || ""} {u.nom}</p>
                          <p className="mb-0" style={{ fontSize: 11.5, color: MUTED }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      {changingRoleId === u.id ? (
                        <div className="position-relative" style={{ minWidth: 180 }}>
                          <select
                            autoFocus
                            defaultValue={u.role}
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "5px 30px 5px 12px",
                              borderRadius: 20,
                              border: `2px solid ${NAVY}`,
                              backgroundColor: "#fff",
                              color: NAVY,
                              appearance: "none",
                              cursor: "pointer",
                              outline: "none",
                              width: "100%",
                              boxShadow: "0 4px 16px rgba(11,31,56,0.15)",
                              transition: "all 0.2s ease",
                            }}
                            onBlur={() => setChangingRoleId(null)}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                          >
                            {Object.entries(ROLE_LABELS).map(([key, label]) => (
                              <option key={key} value={key} style={{ fontWeight: key === u.role ? 600 : 400 }}>{label}</option>
                            ))}
                          </select>
                          <ChevronDown size={13} color={NAVY} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        </div>
                      ) : (
                        <span
                          onClick={() => setChangingRoleId(u.id)}
                          className="d-inline-flex align-items-center gap-1"
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            padding: "3px 9px",
                            borderRadius: 20,
                            backgroundColor: (ROLE_COLORS[u.role] || MUTED) + "18",
                            color: ROLE_COLORS[u.role] || MUTED,
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = (ROLE_COLORS[u.role] || MUTED) + "28";
                            e.currentTarget.style.transform = "scale(1.02)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = (ROLE_COLORS[u.role] || MUTED) + "18";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
                          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
                        >
                          {ROLE_LABELS[u.role] || u.role}
                          <ChevronDown size={11} strokeWidth={2.5} />
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: u.actif ? "#1E7B3A" : "#B3261E" }}>
                        {u.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 12, color: MUTED }}>
                      {u.tel || "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="d-flex align-items-center gap-2 justify-content-end">
                        <button
                          className="btn btn-sm d-flex align-items-center gap-1 border-0"
                          style={{ fontSize: 12, fontWeight: 500, backgroundColor: "#EAF1FB", color: "#2B6CB0", borderRadius: 8 }}
                          onClick={() => openEdit(u)}
                        >
                          <Pencil size={13} /> Modifier
                        </button>
                        {String(u.id) !== String(currentUser?.id) && (
                          <button
                            className="btn btn-sm d-flex align-items-center gap-1 border-0"
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              borderRadius: 8,
                              backgroundColor: u.actif ? "#FBE7E7" : "#E7F5EC",
                              color: u.actif ? "#B3261E" : "#1E7B3A",
                            }}
                            onClick={() => toggleActif(u)}
                          >
                            {u.actif ? <ShieldOff size={13} /> : <Shield size={13} />}
                            {u.actif ? "Désactiver" : "Activer"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      {modalMode && (
        <UserModal
          mode={modalMode}
          initialData={modalMode === "edit" && editingUser ? {
            nom: editingUser.nom || "",
            prenom: editingUser.prenom || "",
            email: editingUser.email || "",
            tel: editingUser.tel || "",
            role: editingUser.role || "guest",
          } : null}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .modal-pop { animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .form-control, .form-select {
          border-radius: 10px !important;
          transition: box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .form-control:focus, .form-select:focus {
          box-shadow: 0 0 0 3px rgba(11,31,56,0.10);
          outline: none;
        }
        .form-control::placeholder { color: #A9B2BE; }

        .btn { transition: transform 0.12s ease, box-shadow 0.18s ease, filter 0.15s ease; }
        .btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(0.98); }
        .btn:active:not(:disabled) { transform: translateY(0); }
        .btn:disabled { opacity: 0.65; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

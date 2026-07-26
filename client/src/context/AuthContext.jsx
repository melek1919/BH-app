import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, tokenStorage } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // vérification de session au chargement

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // Au chargement de l'app : si un token existe déjà (session précédente),
  // on vérifie qu'il est toujours valide en récupérant l'utilisateur.
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  // Déclenché par api.js quand une requête renvoie 401 (token expiré/invalide)
  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("bh:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("bh:unauthorized", handleUnauthorized);
  }, []);

  const login = async (email, motDePasse) => {
    const { token, utilisateur } = await authApi.login(email, motDePasse);
    tokenStorage.set(token);
    setUser(utilisateur);
    return utilisateur;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>");
  return ctx;
}

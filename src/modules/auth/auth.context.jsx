import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getCurrentUser, loginUser, logoutUser } from "./auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const initializeAuth = useCallback(async () => {
    setIsLoading(true);
    setAuthError("");

    try {
      const data = await getCurrentUser();
      setUser(data.user);
    } catch (error) {
      setUser(null);

      if (error.status !== 401) {
        setAuthError(
          "Unable to verify your session. Check your connection and try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    setUser(data.user);
    setAuthError("");
    return data;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setAuthError("");
  };

  const value = {
    user,
    isLoading,
    authError,
    login,
    logout,
    retrySessionCheck: initializeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

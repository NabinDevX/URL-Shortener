import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import axios from "axios";
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}
interface AuthContextType {
  isAuthenticated: boolean | null;
  loading: boolean;
  userData: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: (showLoading?: boolean) => Promise<void>;
  refreshAuth: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
interface AuthProviderProps {
  children: ReactNode;
  initialLoadingTime?: number;
}
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  initialLoadingTime = 2000,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);
  const checkAuth = useCallback(
    async (showLoading = true) => {
      const startTime = Date.now();

      if (showLoading) {
        setLoading(true);
      }

      try {
        const response = await axios.get("/api/v1/user/current-user", {
          timeout: 5000,
          withCredentials: true,
        });

        setUserData(response.data.data.user);
        setIsAuthenticated(true);
      } catch {
        try {
          await axios.post(
            "/api/v1/user/refresh-token",
            {},
            {
              timeout: 5000,
              withCredentials: true,
            }
          );
          try {
            const retryResponse = await axios.get("/api/v1/user/current-user", {
              timeout: 5000,
              withCredentials: true,
            });

            setUserData(retryResponse.data.data.user);
            setIsAuthenticated(true);
          } catch {
            setIsAuthenticated(false);
            setUserData(null);
          }
        } catch {
          setIsAuthenticated(false);
          setUserData(null);
        }
      } finally {
        if (showLoading) {
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, initialLoadingTime - elapsedTime);

          setTimeout(() => {
            setLoading(false);
          }, remainingTime);
        }
      }
    },
    [initialLoadingTime]
  );
  const login = useCallback(
    async (email: string, password: string) => {
      await axios.post(
        "/api/v1/user/login",
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      await checkAuth(false);
    },
    [checkAuth]
  );
  const logout = useCallback(async () => {
    try {
      await axios.post(
        "/api/v1/user/logout",
        {},
        {
          withCredentials: true,
        }
      );
    } catch {
    }

    setUserData(null);
    setIsAuthenticated(false);
  }, []);
  const refreshAuth = useCallback(async () => {
    await checkAuth(false);
  }, [checkAuth]);
  useEffect(() => {
    checkAuth(true);
  }, [checkAuth]);

  const value: AuthContextType = {
    isAuthenticated,
    loading,
    userData,
    login,
    logout,
    checkAuth,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

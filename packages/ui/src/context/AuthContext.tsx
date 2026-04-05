import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import axios from "axios";
import { requestOnce } from "../utils/requestOnce";

const ACCESS_TOKEN_STORAGE_KEYS = [
  "urlShortenerAccessToken",
  "accessToken",
] as const;
const REFRESH_TOKEN_STORAGE_KEYS = [
  "urlShortenerRefreshToken",
  "refreshToken",
] as const;

const safeGetLocalStorageItem = (keys: readonly string[]): string => {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    for (const key of keys) {
      const value = window.localStorage.getItem(key);
      if (value) {
        return value;
      }
    }
  } catch {
    // ignore
  }
  return "";
};

const safeSetLocalStorageItem = (key: string, value: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const safeRemoveLocalStorageItems = (keys: readonly string[]): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ignore
  }
};

const applyAxiosAccessToken = (accessToken: string): void => {
  if (accessToken) {
    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

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
  loginWithGoogleToken: (token: string) => Promise<void>;
  signupWithGoogleToken: (token: string) => Promise<void>;
  loginWithGoogleCode: (code: string) => Promise<void>;
  signupWithGoogleCode: (code: string) => Promise<void>;
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
  const [authCheckDone, setAuthCheckDone] = useState(false);

  const [, setAccessToken] = useState<string>(() =>
    safeGetLocalStorageItem(ACCESS_TOKEN_STORAGE_KEYS)
  );

  const performAuthCheck = useCallback(
    async (showLoading = true) => {
      const startTime = Date.now();

      if (showLoading) {
        setLoading(true);
      }

      try {
        const storedAccessToken = safeGetLocalStorageItem(
          ACCESS_TOKEN_STORAGE_KEYS
        );
        const storedRefreshToken = safeGetLocalStorageItem(
          REFRESH_TOKEN_STORAGE_KEYS
        );

        // Step 1: Try to fetch current user with existing token
        if (storedAccessToken) {
          const storedAccessTokenKey = storedAccessToken.slice(-12);
          applyAxiosAccessToken(storedAccessToken);
          setAccessToken(storedAccessToken);

          try {
            const response = await requestOnce(
              `auth:current-user:${storedAccessTokenKey}`,
              () =>
                axios.get("/api/v1/user/current-user", {
                  timeout: 5000,
                  withCredentials: true,
                }),
              2500
            );

            const user = response?.data?.data?.user ?? response?.data?.user;
            setUserData(user);
            setIsAuthenticated(true);
            return;
          } catch {
            // Token might be expired, try refresh
          }
        }

        // Step 2: If current-user failed, try refresh-token
        if (storedRefreshToken) {
          try {
            const storedRefreshTokenKey = storedRefreshToken.slice(-12);
            const refreshResponse = await requestOnce(
              `auth:refresh-token:${storedRefreshTokenKey}`,
              () =>
                axios.post(
                  "/api/v1/user/refresh-token",
                  { refreshToken: storedRefreshToken },
                  {
                    timeout: 5000,
                    withCredentials: true,
                  }
                ),
              2500
            );

            const nextAccessToken =
              refreshResponse?.data?.data?.accessToken ??
              refreshResponse?.data?.accessToken ??
              "";
            const nextRefreshToken =
              refreshResponse?.data?.data?.refreshToken ??
              refreshResponse?.data?.refreshToken ??
              "";

            if (nextAccessToken) {
              setAccessToken(nextAccessToken);
              safeSetLocalStorageItem(
                ACCESS_TOKEN_STORAGE_KEYS[0],
                nextAccessToken
              );
              applyAxiosAccessToken(nextAccessToken);
            }
            if (nextRefreshToken) {
              safeSetLocalStorageItem(
                REFRESH_TOKEN_STORAGE_KEYS[0],
                nextRefreshToken
              );
            }

            // Step 3: Retry current-user with new token
            try {
              const nextAccessTokenKey = nextAccessToken
                ? nextAccessToken.slice(-12)
                : "no-access";
              const retryResponse = await requestOnce(
                `auth:current-user:retry:${nextAccessTokenKey}`,
                () =>
                  axios.get("/api/v1/user/current-user", {
                    timeout: 5000,
                    withCredentials: true,
                  }),
                2500
              );

              const user =
                retryResponse?.data?.data?.user ?? retryResponse?.data?.user;
              setUserData(user);
              setIsAuthenticated(true);
            } catch {
              // Retry failed, user is not authenticated
              setIsAuthenticated(false);
              setUserData(null);
              setAccessToken("");
              applyAxiosAccessToken("");
              safeRemoveLocalStorageItems([
                ...ACCESS_TOKEN_STORAGE_KEYS,
                ...REFRESH_TOKEN_STORAGE_KEYS,
              ]);
            }
          } catch {
            // Refresh token failed, clear auth and stay on welcome page
            setIsAuthenticated(false);
            setUserData(null);
            setAccessToken("");
            applyAxiosAccessToken("");
            safeRemoveLocalStorageItems([
              ...ACCESS_TOKEN_STORAGE_KEYS,
              ...REFRESH_TOKEN_STORAGE_KEYS,
            ]);
          }
        } else {
          // No tokens available, user is not authenticated
          setIsAuthenticated(false);
          setUserData(null);
          applyAxiosAccessToken("");
        }
      } finally {
        if (showLoading) {
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, initialLoadingTime - elapsedTime);

          setTimeout(() => {
            setLoading(false);
            setAuthCheckDone(true);
          }, remainingTime);
        } else {
          setAuthCheckDone(true);
        }
      }
    },
    [initialLoadingTime]
  );

  const checkAuth = useCallback(
    async (showLoading = true) => {
      await performAuthCheck(showLoading);
    },
    [performAuthCheck]
  );

  const applyAuthTokens = useCallback(
    (nextAccessToken: string, nextRefreshToken: string) => {
      if (nextAccessToken) {
        setAccessToken(nextAccessToken);
        safeSetLocalStorageItem(ACCESS_TOKEN_STORAGE_KEYS[0], nextAccessToken);
        applyAxiosAccessToken(nextAccessToken);
      }
      if (nextRefreshToken) {
        safeSetLocalStorageItem(
          REFRESH_TOKEN_STORAGE_KEYS[0],
          nextRefreshToken
        );
      }
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await axios.post(
        "/api/v1/user/signin",
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const nextAccessToken =
        response?.data?.data?.accessToken ?? response?.data?.accessToken ?? "";
      const nextRefreshToken =
        response?.data?.data?.refreshToken ??
        response?.data?.refreshToken ??
        "";

      applyAuthTokens(nextAccessToken, nextRefreshToken);

      await checkAuth(false);
    },
    [checkAuth, applyAuthTokens]
  );

  const loginWithGoogleToken = useCallback(
    async (token: string) => {
      const response = await axios.post(
        "/api/v1/user/google/login-token",
        { token },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const nextAccessToken =
        response?.data?.data?.accessToken ?? response?.data?.accessToken ?? "";
      const nextRefreshToken =
        response?.data?.data?.refreshToken ??
        response?.data?.refreshToken ??
        "";

      applyAuthTokens(nextAccessToken, nextRefreshToken);
      await checkAuth(false);
    },
    [applyAuthTokens, checkAuth]
  );

  const signupWithGoogleToken = useCallback(
    async (token: string) => {
      const response = await axios.post(
        "/api/v1/user/google/signup-token",
        { token },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const nextAccessToken =
        response?.data?.data?.accessToken ?? response?.data?.accessToken ?? "";
      const nextRefreshToken =
        response?.data?.data?.refreshToken ??
        response?.data?.refreshToken ??
        "";

      applyAuthTokens(nextAccessToken, nextRefreshToken);
      await checkAuth(false);
    },
    [applyAuthTokens, checkAuth]
  );

  const loginWithGoogleCode = useCallback(
    async (code: string) => {
      const response = await axios.post(
        "/api/v1/user/google/login",
        { code, redirectUri: "postmessage" },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const nextAccessToken =
        response?.data?.data?.accessToken ?? response?.data?.accessToken ?? "";
      const nextRefreshToken =
        response?.data?.data?.refreshToken ??
        response?.data?.refreshToken ??
        "";

      applyAuthTokens(nextAccessToken, nextRefreshToken);
      await checkAuth(false);
    },
    [applyAuthTokens, checkAuth]
  );

  const signupWithGoogleCode = useCallback(
    async (code: string) => {
      const response = await axios.post(
        "/api/v1/user/google/register",
        { code, redirectUri: "postmessage" },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const nextAccessToken =
        response?.data?.data?.accessToken ?? response?.data?.accessToken ?? "";
      const nextRefreshToken =
        response?.data?.data?.refreshToken ??
        response?.data?.refreshToken ??
        "";

      applyAuthTokens(nextAccessToken, nextRefreshToken);
      await checkAuth(false);
    },
    [applyAuthTokens, checkAuth]
  );

  const logout = useCallback(async () => {
    try {
      await requestOnce(
        "auth:signout",
        () =>
          axios.post(
            "/api/v1/user/signout",
            {},
            {
              withCredentials: true,
            }
          ),
        2500
      );
    } catch {
      // Error handling on logout
    }

    setUserData(null);
    setIsAuthenticated(false);
    setAccessToken("");
    applyAxiosAccessToken("");
    safeRemoveLocalStorageItems([
      ...ACCESS_TOKEN_STORAGE_KEYS,
      ...REFRESH_TOKEN_STORAGE_KEYS,
    ]);
  }, []);

  const refreshAuth = useCallback(async () => {
    await checkAuth(false);
  }, [checkAuth]);

  // Run auth check only once on mount
  useEffect(() => {
    if (authCheckDone) {
      return; // Already checked, don't run again
    }
    void performAuthCheck(true);
  }, [authCheckDone, performAuthCheck]);

  const value: AuthContextType = {
    isAuthenticated,
    loading,
    userData,
    login,
    loginWithGoogleToken,
    signupWithGoogleToken,
    loginWithGoogleCode,
    signupWithGoogleCode,
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

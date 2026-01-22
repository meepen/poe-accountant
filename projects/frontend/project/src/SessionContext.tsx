import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { ApiEndpoint } from "@meepen/poe-accountant-api-schema/api/api-endpoints.enum";
import { UserDto } from "@meepen/poe-accountant-api-schema/api/user.dto";
import { z } from "zod";
import { ApiService } from "@meepen/poe-accountant-api-schema/api/api-service";

type User = z.infer<typeof UserDto>;

interface SessionContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
  api: ApiService;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const api = useMemo(
    () => new ApiService(new URL(import.meta.env.VITE_API_BASE_URL)),
    [],
  );

  useEffect(() => {
    api
      .request(ApiEndpoint.GetUser)
      .then((cachedUser) => {
        setIsLoading(false);
        setUser(cachedUser);
      })
      .catch((error: unknown) => {
        console.error("Error retrieving user:", error);
        setIsLoading(false);
      });
  }, []);

  const login = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/${ApiEndpoint.UserLogin}?redirect_to=${encodeURIComponent(
      window.location.href,
    )}`;
  };

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const expiresAt = new Date(user.expiresAt);
    const now = new Date();
    const timeUntilExpiration = expiresAt.getTime() - now.getTime();

    if (timeUntilExpiration <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      logout();
      return;
    }

    // To avoid 32 bit integer overflow in setTimeout, cap the timeout at 2^31-1 ms (~24.8 days)
    if (timeUntilExpiration > 0x7fffffff) {
      console.warn(
        "Session expiration time exceeds maximum timeout duration, assuming that you will refresh before then and are not crazy.",
      );
      return;
    }

    const timer = setTimeout(() => {
      logout();
    }, timeUntilExpiration);

    return () => {
      clearTimeout(timer);
    };
  }, [user, logout]);

  return (
    <SessionContext.Provider value={{ user, login, logout, isLoading, api }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

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
import {
  sessionCookieName,
  UserDto,
} from "@meepen/poe-accountant-api-schema/api/user.dto";
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

async function getCachedToken(): Promise<User | null> {
  const token = await cookieStore.get(sessionCookieName);
  console.log(token);
  if (!token || !token.value) {
    return null;
  }
  try {
    const userDto = UserDto.parse(JSON.parse(decodeURIComponent(token.value)));
    if (new Date(userDto.expiresAt) < new Date()) {
      await cookieStore.delete(sessionCookieName);
      return null;
    }
    return userDto;
  } catch (error) {
    console.error("Failed to parse cached token:", error);
    return null;
  }
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
    getCachedToken()
      .then((cachedUser) => {
        if (cachedUser) {
          setUser(cachedUser);
        }
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        console.error("Error retrieving cached token:", error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    api.setAuthToken(user.authorizationToken);
  }, [api, user]);

  const login = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/${ApiEndpoint.UserLogin}?redirect_to=${encodeURIComponent(
      window.location.href,
    )}`;
  };

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
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

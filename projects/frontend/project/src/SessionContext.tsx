import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";

interface User {
  sub?: string;
  name?: string;
  email?: string;
  exp?: number;
  [key: string]: unknown;
}

interface SessionContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      try {
        const decoded = jwtDecode<User>(storedToken);
        // Check for expiration if exp exists
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.warn("Token expired");
          localStorage.removeItem("authToken");
        } else {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setToken(storedToken);
          setUser(decoded);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("authToken");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    try {
      const decoded = jwtDecode<User>(newToken);
      localStorage.setItem("authToken", newToken);
      setToken(newToken);
      setUser(decoded);
    } catch (error) {
      console.error("Failed to decode token during login:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  };

  return (
    <SessionContext.Provider value={{ user, token, login, logout, isLoading }}>
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

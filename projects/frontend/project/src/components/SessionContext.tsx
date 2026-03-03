import type { ReactNode } from "react";
import { useReducer, useEffect, useMemo, useCallback } from "react";
import { ApiEndpoint } from "@meepen/poe-accountant-api-schema/api/api-endpoints.enum";
import { ApiService } from "@meepen/poe-accountant-api-schema/api/api-service";
import type { SessionContextType, User } from "./session-context";
import { SessionContext } from "./session-context";

type SessionState = {
  user: User | null;
  isLoading: boolean;
};

type SessionAction =
  | { type: "loaded"; user: User }
  | { type: "unauthorized" }
  | { type: "logout" };

function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case "loaded":
      return { user: action.user, isLoading: false };
    case "unauthorized":
      return { ...state, isLoading: false };
    case "logout":
      return { ...state, user: null };
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [{ user, isLoading }, dispatch] = useReducer(sessionReducer, {
    user: null,
    isLoading: true,
  });
  const api = useMemo(
    () =>
      new ApiService(
        new URL(import.meta.env.VITE_API_BASE_URL),
        (input, init) => fetch(input, { ...init, credentials: "include" }),
      ),
    [],
  );

  useEffect(() => {
    api
      .request(ApiEndpoint.GetUser)
      .then((cachedUser) => {
        dispatch({ type: "loaded", user: cachedUser });
      })
      .catch((error: unknown) => {
        console.error("Error retrieving user:", error);
        dispatch({ type: "unauthorized" });
      });
  }, [api]);

  const login = useCallback(() => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/${ApiEndpoint.UserLogin}?redirect_to=${encodeURIComponent(
      window.location.href,
    )}`;
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: "logout" });
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const expiresAt = new Date(user.expiresAt);
    const now = new Date();
    const timeUntilExpiration = expiresAt.getTime() - now.getTime();

    if (timeUntilExpiration <= 0) {
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

  const contextValue = useMemo<SessionContextType>(
    () => ({ user, login, logout, isLoading, api }),
    [user, login, logout, isLoading, api],
  );

  return <SessionContext value={contextValue}>{children}</SessionContext>;
}

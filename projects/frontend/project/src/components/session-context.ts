import { createContext } from "react";
import type { ApiService } from "@meepen/poe-accountant-api-schema/api/api-service";

export type User = {
  id: string;
  username: string;
  authorizationToken: string;
  expiresAt: string;
};

export type UserSettings = {
  currentLeagueId: string | null;
};

export interface SessionContextType {
  user: User | null;
  userSettings: UserSettings | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
  api: ApiService;
}

export const SessionContext = createContext<SessionContextType | undefined>(
  undefined,
);

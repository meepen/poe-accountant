import { createContext } from "react";
import type { ApiService } from "@meepen/poe-accountant-api-schema/api/api-service";
import type { UserDto } from "@meepen/poe-accountant-api-schema/api/dtos/user/user.dto";
import type { z } from "zod";

export type User = z.infer<typeof UserDto>;

export interface SessionContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
  api: ApiService;
}

export const SessionContext = createContext<SessionContextType | undefined>(
  undefined,
);

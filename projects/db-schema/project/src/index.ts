import * as User from "./schema/user.js";
import * as Settings from "./schema/settings.js";
import * as League from "./schema/league.js";
import * as CurrencyExchange from "./schema/currency-exchange.js";
import * as UserCharacter from "./schema/user-leagues.js";
import * as UserInventorySnapshot from "./schema/user-inventory-snapshot.js";

export default {
  ...User,
  ...Settings,
  ...League,
  ...CurrencyExchange,
  ...UserCharacter,
  ...UserInventorySnapshot,
};

export * from "./schema/user.js";
export * from "./schema/settings.js";
export * from "./schema/league.js";
export * from "./schema/currency-exchange.js";
export * from "./schema/user-leagues.js";
export * from "./schema/user-inventory-snapshot.js";

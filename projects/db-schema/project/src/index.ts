import * as User from "./schema/user.js";
import * as Settings from "./schema/settings.js";
import * as Jobs from "./schema/jobs.js";
import * as League from "./schema/league.js";
import * as CurrencyExchange from "./schema/currency-exchange.js";

export default {
  ...User,
  ...Settings,
  ...Jobs,
  ...League,
  ...CurrencyExchange,
};

export * from "./schema/user.js";
export * from "./schema/settings.js";
export * from "./schema/jobs.js";
export * from "./schema/league.js";
export * from "./schema/currency-exchange.js";

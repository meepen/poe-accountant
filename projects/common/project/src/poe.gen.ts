// This file is auto-generated from https://www.pathofexile.com/developer/docs/reference



// #region Type Information
import { z } from 'zod';
/**
 * ApiError
 * Manually Generated from https://www.pathofexile.com/developer/docs/index#errors
 */
export enum ErrorMessage {
  Accepted = 0,
  ResourceNotFound = 1,
  InvalidQuery = 2,
  RateLimitExceeded = 3,
  InternalError = 4,
  UnexpectedContentType = 5,
  Forbidden = 6,
  TemporarilyUnavailable = 7,
  Unauthorized = 8,
  MethodNotAllowed = 9,
  UnprocessableEntity = 10,
}

export interface ApiError {
  code: ErrorMessage;
  message: string;
}

export const ApiError = z.object({
  code: z.enum(ErrorMessage),
  message: z.string(),
});

/**
 * object LeagueRule
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-LeagueRule
 */
export interface LeagueRule {
  id: string;
  name: string;
  description?: string | undefined;
}

/**
 * object League
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-League
 */
export interface League {
  id: string;
  realm?: string | undefined;
  name?: string | undefined;
  description?: string | undefined;
  category?: {
    id: string;
    current?: boolean | undefined;
  } | undefined;
  rules?: LeagueRule[] | undefined;
  registerAt?: string | undefined;
  event?: boolean | undefined;
  goal?: string | undefined;
  url?: string | undefined;
  startAt?: string | undefined;
  endAt?: string | undefined;
  timedEvent?: boolean | undefined;
  scoreEvent?: boolean | undefined;
  delveEvent?: boolean | undefined;
  ancestorEvent?: boolean | undefined;
  leagueEvent?: boolean | undefined;
}

/**
 * object Guild
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-Guild
 */
export interface Guild {
  id: number;
  name: string;
  tag: string;
}

/**
 * object Account
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-Account
 */
export interface Account {
  name: string;
  realm?: string | undefined;
  guild?: Guild | undefined;
  challenges?: {
    set: string;
    completed: number;
    max: number;
  } | undefined;
  twitch?: {
    name: string;
    stream?: {
      name: string;
      image: string;
      status: string;
    } | undefined;
  } | undefined;
}

/**
 * object LadderEntry
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-LadderEntry
 */
export interface LadderEntry {
  rank: number;
  dead?: boolean | undefined;
  retired?: boolean | undefined;
  ineligible?: boolean | undefined;
  public?: boolean | undefined;
  character: {
    id: string;
    name: string;
    level: number;
    class: string;
    time?: number | undefined;
    score?: number | undefined;
    progress?: Record<string, any> | undefined;
    experience?: number | undefined;
    depth?: {
      default?: number | undefined;
      solo?: number | undefined;
    } | undefined;
  };
  account?: Account | undefined;
}

/**
 * object EventLadderEntry
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-EventLadderEntry
 */
export interface EventLadderEntry {
  rank: number;
  ineligible?: boolean | undefined;
  time?: number | undefined;
  private_league: {
    name: string;
    url: string;
  };
}

/**
 * object PvPMatch
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PvPMatch
 */
export interface PvPMatch {
  id: string;
  realm?: string | undefined;
  startAt?: string | undefined;
  endAt?: string | undefined;
  url?: string | undefined;
  description: string;
  glickoRatings: boolean;
  pvp: boolean;
  style: string;
  registerAt?: string | undefined;
  complete?: boolean | undefined;
  upcoming?: boolean | undefined;
  inProgress?: boolean | undefined;
}

/**
 * object PvPLadderTeamMember
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PvPLadderTeamMember
 */
export interface PvPLadderTeamMember {
  account: Account;
  character: {
    id: string;
    name: string;
    level: number;
    class: string;
    league?: string | undefined;
    score?: number | undefined;
  };
  public?: boolean | undefined;
}

/**
 * object PvPLadderTeamEntry
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PvPLadderTeamEntry
 */
export interface PvPLadderTeamEntry {
  rank: number;
  rating?: number | undefined;
  points?: number | undefined;
  games_played?: number | undefined;
  cumulative_opponent_points?: number | undefined;
  last_game_time?: string | undefined;
  members: PvPLadderTeamMember[];
}

/**
 * object ItemSocket
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-ItemSocket
 */
export interface ItemSocket {
  group: number;
  attr?: string | undefined;
  sColour?: string | undefined;
  type?: string | undefined;
  item?: string | undefined;
}

/**
 * enum DisplayMode
 * Referenced by ItemProperty→displayMode.
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-DisplayMode
 */
export enum DisplayModeEnum {
  NameShouldBeFollowedByValues = 0, // Name should be followed by values
  ValuesShouldBeFollowedByName = 1, // Values should be followed by name
  ProgressBar = 2, // Progress bar
  ValuesShouldBeInsertedIntoTheStringByIndex = 3, // Values should be inserted into the string by index
  Separator = 4, // Separator
};

/**
 * object ItemProperty
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-ItemProperty
 */
export interface ItemProperty {
  name: string;
  values: [string, number][];
  displayMode?: DisplayModeEnum | undefined;
  progress?: number | undefined;
  type?: number | undefined;
  suffix?: string | undefined;
  icon?: string | undefined;
}

/**
 * object GemPage
 * Referenced by GemTab→pages.
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-GemPage
 */
export interface GemPage {
  /**
   * 
   */
  skillName?: string | undefined;
  /**
   * 
   */
  description?: string | undefined;
  /**
   * 
   */
  properties?: ItemProperty[] | undefined;
  /**
   * 
   */
  stats?: string[] | undefined;
}

/**
 * object GemTab
 * Referenced by Item→gemTabs.
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-GemTab
 */
export interface GemTab {
  /**
   * 
   */
  name?: string | undefined;
  /**
   * 
   */
  pages: GemPage[];
}

/**
 * object CrucibleNode
 * Referenced by Item→crucible.
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-CrucibleNode
 */
export interface CrucibleNode {
  /**
   * mod hash
   */
  skill?: number | undefined;
  /**
   * mod tier
   */
  tier?: number | undefined;
  /**
   * 
   */
  icon?: string | undefined;
  /**
   * always true if present
   */
  allocated?: boolean | undefined;
  /**
   * always true if present
   */
  isNotable?: boolean | undefined;
  /**
   * always true if present
   */
  isReward?: boolean | undefined;
  /**
   * stat descriptions
   */
  stats?: string[] | undefined;
  /**
   * 
   */
  reminderText?: string[] | undefined;
  /**
   * the column this node occupies
   */
  orbit?: number | undefined;
  /**
   * the node's position within the column
   */
  orbitIndex?: number | undefined;
  /**
   * node identifiers of nodes this one connects to
   */
  out: string[];
  /**
   * node identifiers of nodes connected to this one
   */
  in: string[];
}

/**
 * enum FrameType
 * Referenced by Item→frameType.
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-FrameType
 */
export enum FrameTypeEnum {
  NormalFrame = 0, // Normal frame
  MagicFrame = 1, // Magic frame
  RareFrame = 2, // Rare frame
  UniqueFrame = 3, // Unique frame
  GemFrame = 4, // Gem frame
  CurrencyFrame = 5, // Currency frame
  DivinationCardFrame = 6, // Divination Card frame
  QuestFrame = 7, // Quest frame
  ProphecyFrameLegacy = 8, // Prophecy frame (legacy)
  FoilFrame = 9, // Foil frame
  SupporterFoilFrame = 10, // Supporter Foil frame
  NecropolisFrame = 11, // Necropolis frame
  GoldFrame = 12, // Gold frame
  BreachSkillFrame = 13, // Breach Skill frame
};

/**
 * object Item
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-Item
 */
export interface Item {
  realm?: string | undefined;
  verified: boolean;
  w: number;
  h: number;
  icon: string;
  support?: boolean | undefined;
  stackSize?: number | undefined;
  maxStackSize?: number | undefined;
  stackSizeText?: string | undefined;
  iconTierText?: string | undefined;
  league?: string | undefined;
  id?: string | undefined;
  gemSockets?: string[] | undefined;
  influences?: Record<string, any> | undefined;
  elder?: boolean | undefined;
  shaper?: boolean | undefined;
  searing?: boolean | undefined;
  tangled?: boolean | undefined;
  memoryItem?: boolean | undefined;
  mutated?: boolean | undefined;
  abyssJewel?: boolean | undefined;
  delve?: boolean | undefined;
  fractured?: boolean | undefined;
  synthesised?: boolean | undefined;
  sockets?: ItemSocket[] | undefined;
  socketedItems?: Item[] | undefined;
  name: string;
  typeLine: string;
  baseType: string;
  rarity?: string | undefined;
  identified: boolean;
  itemLevel?: number | undefined;
  unidentifiedTier?: number | undefined;
  ilvl: number;
  note?: string | undefined;
  forum_note?: string | undefined;
  lockedToCharacter?: boolean | undefined;
  lockedToAccount?: boolean | undefined;
  duplicated?: boolean | undefined;
  split?: boolean | undefined;
  corrupted?: boolean | undefined;
  doubleCorrupted?: boolean | undefined;
  sanctified?: boolean | undefined;
  unmodifiable?: boolean | undefined;
  unmodifiableExceptChaos?: boolean | undefined;
  cisRaceReward?: boolean | undefined;
  seaRaceReward?: boolean | undefined;
  thRaceReward?: boolean | undefined;
  properties?: ItemProperty[] | undefined;
  notableProperties?: ItemProperty[] | undefined;
  requirements?: ItemProperty[] | undefined;
  weaponRequirements?: ItemProperty[] | undefined;
  supportGemRequirements?: ItemProperty[] | undefined;
  additionalProperties?: ItemProperty[] | undefined;
  nextLevelRequirements?: ItemProperty[] | undefined;
  grantedSkills?: ItemProperty[] | undefined;
  talismanTier?: number | undefined;
  rewards?: {
    label: string;
    rewards: Record<string, number>;
  }[] | undefined;
  secDescrText?: string | undefined;
  utilityMods?: string[] | undefined;
  logbookMods?: {
    name: string;
    faction: {
      id: string;
      name: string;
    };
    mods: string[];
  }[] | undefined;
  enchantMods?: string[] | undefined;
  runeMods?: string[] | undefined;
  scourgeMods?: string[] | undefined;
  implicitMods?: string[] | undefined;
  ultimatumMods?: {
    type: string;
    tier: number;
  }[] | undefined;
  explicitMods?: string[] | undefined;
  bondedMods?: string[] | undefined;
  craftedMods?: string[] | undefined;
  fracturedMods?: string[] | undefined;
  mutatedMods?: string[] | undefined;
  crucibleMods?: string[] | undefined;
  cosmeticMods?: string[] | undefined;
  veiledMods?: string[] | undefined;
  veiled?: boolean | undefined;
  desecratedMods?: string[] | undefined;
  desecrated?: boolean | undefined;
  gemTabs?: GemTab[] | undefined;
  gemBackground?: string | undefined;
  gemSkill?: string | undefined;
  descrText?: string | undefined;
  flavourText?: string[] | undefined;
  flavourTextNote?: string | undefined;
  prophecyText?: string | undefined;
  isRelic?: boolean | undefined;
  foilVariation?: number | undefined;
  replica?: boolean | undefined;
  foreseeing?: boolean | undefined;
  incubatedItem?: {
    name: string;
    level: number;
    progress: number;
    total: number;
  } | undefined;
  scourged?: {
    tier: number;
    level?: number | undefined;
    progress?: number | undefined;
    total?: number | undefined;
  } | undefined;
  crucible?: {
    layout: string;
    nodes: Record<string, CrucibleNode>;
  } | undefined;
  ruthless?: boolean | undefined;
  frameType?: FrameTypeEnum | undefined;
  artFilename?: string | undefined;
  hybrid?: {
    isVaalGem?: boolean | undefined;
    baseTypeName: string;
    properties?: ItemProperty[] | undefined;
    explicitMods?: string[] | undefined;
    secDescrText?: string | undefined;
  } | undefined;
  extended?: {
    prefixes?: number | undefined;
    suffixes?: number | undefined;
  } | undefined;
  x?: number | undefined;
  y?: number | undefined;
  inventoryId?: string | undefined;
  socket?: number | undefined;
  colour?: string | undefined;
}

/**
 * object PublicStashChange
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PublicStashChange
 */
export interface PublicStashChange {
  id: string;
  public: boolean;
  accountName?: string | undefined;
  stash?: string | undefined;
  stashType: string;
  league?: string | undefined;
  items: Item[];
}

/**
 * object PassiveNode
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PassiveNode
 */
export interface PassiveNode {
  skill?: number | undefined;
  name?: string | undefined;
  icon?: string | undefined;
  isKeystone?: boolean | undefined;
  isNotable?: boolean | undefined;
  isMastery?: boolean | undefined;
  inactiveIcon?: string | undefined;
  activeIcon?: string | undefined;
  activeEffectImage?: string | undefined;
  masteryEffects?: {
    effect: number;
    stats: string[];
    reminderText?: string[] | undefined;
  }[] | undefined;
  isBlighted?: boolean | undefined;
  isTattoo?: boolean | undefined;
  isProxy?: boolean | undefined;
  isJewelSocket?: boolean | undefined;
  expansionJewel?: {
    size?: number | undefined;
    index?: number | undefined;
    proxy?: number | undefined;
    parent?: number | undefined;
  } | undefined;
  recipe?: string[] | undefined;
  grantedStrength?: number | undefined;
  grantedDexterity?: number | undefined;
  grantedIntelligence?: number | undefined;
  ascendancyName?: string | undefined;
  isAscendancyStart?: boolean | undefined;
  isMultipleChoice?: boolean | undefined;
  isMultipleChoiceOption?: boolean | undefined;
  grantedPassivePoints?: number | undefined;
  stats?: string[] | undefined;
  reminderText?: string[] | undefined;
  flavourText?: string[] | undefined;
  classStartIndex?: number | undefined;
  group?: string | undefined;
  orbit?: number | undefined;
  orbitIndex?: number | undefined;
  out: string[];
  in: string[];
}

/**
 * object PassiveGroup
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PassiveGroup
 */
export interface PassiveGroup {
  x: number;
  y: number;
  orbits: number[];
  isProxy?: boolean | undefined;
  proxy?: string | undefined;
  nodes: string[];
}

/**
 * object ItemJewelData
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-ItemJewelData
 */
export interface ItemJewelData {
  type: string;
  radius?: number | undefined;
  radiusMin?: number | undefined;
  radiusVisual?: string | undefined;
  subgraph?: {
    groups: Record<string, PassiveGroup>;
    nodes: Record<string, PassiveNode>;
  } | undefined;
}

/**
 * object Character
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-Character
 */
export interface Character {
  id: string;
  name: string;
  realm: string;
  class: string;
  league?: string | undefined;
  level: number;
  experience: number;
  ruthless?: boolean | undefined;
  expired?: boolean | undefined;
  deleted?: boolean | undefined;
  current?: boolean | undefined;
  equipment?: Item[] | undefined;
  skills?: Item[] | undefined;
  inventory?: Item[] | undefined;
  rucksack?: Item[] | undefined;
  jewels?: Item[] | undefined;
  passives?: {
    hashes: number[];
    hashes_ex: number[];
    mastery_effects: Record<string, number>;
    specialisations: Record<string, number[]>;
    skill_overrides: Record<string, PassiveNode>;
    bandit_choice?: string | undefined;
    pantheon_major?: string | undefined;
    pantheon_minor?: string | undefined;
    jewel_data: Record<string, ItemJewelData>;
    quest_stats?: string[] | undefined;
    alternate_ascendancy?: string | undefined;
  } | undefined;
  metadata?: {
    version?: string | undefined;
  } | undefined;
}

/**
 * object StashTab
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-StashTab
 */
export interface StashTab {
  id: string;
  parent?: string | undefined;
  folder?: string | undefined;
  name: string;
  type: string;
  index?: number | undefined;
  metadata: {
    public?: boolean | undefined;
    folder?: boolean | undefined;
    colour?: string | undefined;
    map?: Record<string, any> | undefined;
  };
  children?: StashTab[] | undefined;
  items?: Item[] | undefined;
}

/**
 * object LeagueAccount
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-LeagueAccount
 */
export interface LeagueAccount {
  atlas_passives?: {
    hashes: number[];
  } | undefined;
  atlas_passive_trees: {
    name: string;
    hashes: number[];
  }[];
}

/**
 * object ItemFilter
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-ItemFilter
 */
export interface ItemFilter {
  id: string;
  filter_name: string;
  realm: string;
  description: string;
  version: string;
  type: string;
  public?: boolean | undefined;
  filter?: string | undefined;
  validation?: {
    valid: boolean;
    version?: string | undefined;
    validated?: string | undefined;
  } | undefined;
}

/**
 * object AccountProfileGetProfileResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-AccountProfileGetProfileResponse
 */
export interface AccountProfileGetProfileResponse {
  uuid: string;
  name: string;
  locale?: string | undefined;
  twitch?: {
    name: string;
  } | undefined;
}

/**
 * object AccountItemFiltersGetItemFiltersResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-AccountItemFiltersGetItemFiltersResponse
 */
export interface AccountItemFiltersGetItemFiltersResponse {
  filters: ItemFilter[];
}

/**
 * object AccountItemFiltersGetItemFilterResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-AccountItemFiltersGetItemFilterResponse
 */
export interface AccountItemFiltersGetItemFilterResponse {
  filter: ItemFilter;
}

/**
 * object AccountItemFiltersCreateItemFilterResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-AccountItemFiltersCreateItemFilterResponse
 */
export interface AccountItemFiltersCreateItemFilterResponse {
  filter: ItemFilter;
}

/**
 * object AccountItemFiltersUpdateItemFilterResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-AccountItemFiltersUpdateItemFilterResponse
 */
export interface AccountItemFiltersUpdateItemFilterResponse {
  filter: ItemFilter;
  error?: ApiError | undefined;
}

/**
 * object LeaguesListLeaguesResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-LeaguesListLeaguesResponse
 */
export interface LeaguesListLeaguesResponse {
  leagues: League[];
}

/**
 * object LeaguesGetLeagueResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-LeaguesGetLeagueResponse
 */
export interface LeaguesGetLeagueResponse {
  league?: League | undefined;
}

/**
 * object LeaguesGetLeagueLadderPoE1OnlyResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-LeaguesGetLeagueLadderPoE1OnlyResponse
 */
export interface LeaguesGetLeagueLadderPoE1OnlyResponse {
  league: League;
  ladder: {
    total: number;
    cached_since?: string | undefined;
    entries: LadderEntry[];
  };
}

/**
 * object LeaguesGetLeagueEventLadderPoE1OnlyResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-LeaguesGetLeagueEventLadderPoE1OnlyResponse
 */
export interface LeaguesGetLeagueEventLadderPoE1OnlyResponse {
  league: League;
  ladder: {
    total: number;
    entries: EventLadderEntry[];
  };
}

/**
 * object PvPMatchesPoE1OnlyListPvPMatchesResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PvPMatchesPoE1OnlyListPvPMatchesResponse
 */
export interface PvPMatchesPoE1OnlyListPvPMatchesResponse {
  matches: PvPMatch[];
}

/**
 * object PvPMatchesPoE1OnlyGetPvPMatchResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PvPMatchesPoE1OnlyGetPvPMatchResponse
 */
export interface PvPMatchesPoE1OnlyGetPvPMatchResponse {
  match?: PvPMatch | undefined;
}

/**
 * object PvPMatchesPoE1OnlyGetPvPMatchLadderResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PvPMatchesPoE1OnlyGetPvPMatchLadderResponse
 */
export interface PvPMatchesPoE1OnlyGetPvPMatchLadderResponse {
  match: PvPMatch;
  ladder: {
    total: number;
    entries: PvPLadderTeamEntry[];
  };
}

/**
 * object AccountLeaguesPoE1OnlyGetLeaguesResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-AccountLeaguesPoE1OnlyGetLeaguesResponse
 */
export interface AccountLeaguesPoE1OnlyGetLeaguesResponse {
  leagues: League[];
}

/**
 * object AccountCharactersListCharactersResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-AccountCharactersListCharactersResponse
 */
export interface AccountCharactersListCharactersResponse {
  characters: Character[];
}

/**
 * object AccountCharactersGetCharacterResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-AccountCharactersGetCharacterResponse
 */
export interface AccountCharactersGetCharacterResponse {
  character?: Character | undefined;
}

/**
 * object AccountStashesPoE1OnlyListStashesResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-AccountStashesPoE1OnlyListStashesResponse
 */
export interface AccountStashesPoE1OnlyListStashesResponse {
  stashes: StashTab[];
}

/**
 * object AccountStashesPoE1OnlyGetStashResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-AccountStashesPoE1OnlyGetStashResponse
 */
export interface AccountStashesPoE1OnlyGetStashResponse {
  stash?: StashTab | undefined;
}

/**
 * object LeagueAccountsPoE1OnlyGetLeagueAccountResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-LeagueAccountsPoE1OnlyGetLeagueAccountResponse
 */
export interface LeagueAccountsPoE1OnlyGetLeagueAccountResponse {
  league_account: LeagueAccount;
}

/**
 * object GuildStashesPoE1OnlyListGuildStashesResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-GuildStashesPoE1OnlyListGuildStashesResponse
 */
export interface GuildStashesPoE1OnlyListGuildStashesResponse {
  stashes: StashTab[];
}

/**
 * object GuildStashesPoE1OnlyGetGuildStashResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-GuildStashesPoE1OnlyGetGuildStashResponse
 */
export interface GuildStashesPoE1OnlyGetGuildStashResponse {
  stash?: StashTab | undefined;
}

/**
 * object PublicStashesPoE1OnlyGetPublicStashesResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PublicStashesPoE1OnlyGetPublicStashesResponse
 */
export interface PublicStashesPoE1OnlyGetPublicStashesResponse {
  next_change_id: string;
  stashes: PublicStashChange[];
}

/**
 * object CurrencyExchangeGetExchangeMarketsResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-CurrencyExchangeGetExchangeMarketsResponse
 */
export interface CurrencyExchangeGetExchangeMarketsResponse {
  next_change_id: number;
  markets: {
    league: string;
    market_id: string;
    volume_traded: Record<string, number>;
    lowest_stock: Record<string, number>;
    highest_stock: Record<string, number>;
    lowest_ratio: Record<string, number>;
    highest_ratio: Record<string, number>;
  }[];
}

export const LeagueRule: z.ZodType<LeagueRule> = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
})
export const League: z.ZodType<League> = z.object({
  id: z.string(),
  realm: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.object({
    id: z.string(),
    current: z.boolean().optional(),
  }).optional(),
  rules: z.array(LeagueRule).optional(),
  registerAt: z.string().optional(),
  event: z.boolean().optional(),
  goal: z.string().optional(),
  url: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  timedEvent: z.boolean().optional(),
  scoreEvent: z.boolean().optional(),
  delveEvent: z.boolean().optional(),
  ancestorEvent: z.boolean().optional(),
  leagueEvent: z.boolean().optional(),
})
export const Guild: z.ZodType<Guild> = z.object({
  id: z.uint32(),
  name: z.string(),
  tag: z.string(),
})
export const Account: z.ZodType<Account> = z.object({
  name: z.string(),
  realm: z.string().optional(),
  guild: Guild.optional(),
  challenges: z.object({
    set: z.string(),
    completed: z.uint32(),
    max: z.uint32(),
  }).optional(),
  twitch: z.object({
    name: z.string(),
    stream: z.object({
      name: z.string(),
      image: z.string(),
      status: z.string(),
    }).optional(),
  }).optional(),
})
export const LadderEntry: z.ZodType<LadderEntry> = z.object({
  rank: z.uint32(),
  dead: z.boolean().optional(),
  retired: z.boolean().optional(),
  ineligible: z.boolean().optional(),
  public: z.boolean().optional(),
  character: z.object({
    id: z.string(),
    name: z.string(),
    level: z.uint32(),
    class: z.string(),
    time: z.uint32().optional(),
    score: z.uint32().optional(),
    progress: z.record(z.string(), z.any()).optional(),
    experience: z.uint32().optional(),
    depth: z.object({
      default: z.uint32().optional(),
      solo: z.uint32().optional(),
    }).optional(),
  }),
  account: Account.optional(),
})
export const EventLadderEntry: z.ZodType<EventLadderEntry> = z.object({
  rank: z.uint32(),
  ineligible: z.boolean().optional(),
  time: z.uint32().optional(),
  private_league: z.object({
    name: z.string(),
    url: z.string(),
  }),
})
export const PvPMatch: z.ZodType<PvPMatch> = z.object({
  id: z.string(),
  realm: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  url: z.string().optional(),
  description: z.string(),
  glickoRatings: z.boolean(),
  pvp: z.boolean(),
  style: z.string(),
  registerAt: z.string().optional(),
  complete: z.boolean().optional(),
  upcoming: z.boolean().optional(),
  inProgress: z.boolean().optional(),
})
export const PvPLadderTeamMember: z.ZodType<PvPLadderTeamMember> = z.object({
  account: Account,
  character: z.object({
    id: z.string(),
    name: z.string(),
    level: z.uint32(),
    class: z.string(),
    league: z.string().optional(),
    score: z.uint32().optional(),
  }),
  public: z.boolean().optional(),
})
export const PvPLadderTeamEntry: z.ZodType<PvPLadderTeamEntry> = z.object({
  rank: z.uint32(),
  rating: z.uint32().optional(),
  points: z.uint32().optional(),
  games_played: z.uint32().optional(),
  cumulative_opponent_points: z.uint32().optional(),
  last_game_time: z.string().optional(),
  members: z.array(PvPLadderTeamMember),
})
export const ItemSocket: z.ZodType<ItemSocket> = z.object({
  group: z.uint32(),
  attr: z.string().optional(),
  sColour: z.string().optional(),
  type: z.string().optional(),
  item: z.string().optional(),
})
export const DisplayMode = z.enum(DisplayModeEnum);
export const ItemProperty: z.ZodType<ItemProperty> = z.object({
  name: z.string(),
  values: z.array(z.tuple([
    z.string(),
    z.uint32()
  ])),
  displayMode: DisplayMode.optional(),
  progress: z.float64().optional(),
  type: z.uint32().optional(),
  suffix: z.string().optional(),
  icon: z.string().optional(),
})
export const GemPage: z.ZodType<GemPage> = z.object({
  /**
   * 
   */
  skillName: z.string().optional(),
  /**
   * 
   */
  description: z.string().optional(),
  /**
   * 
   */
  properties: z.array(ItemProperty).optional(),
  /**
   * 
   */
  stats: z.array(z.string()).optional(),
})
export const GemTab: z.ZodType<GemTab> = z.object({
  /**
   * 
   */
  name: z.string().optional(),
  /**
   * 
   */
  pages: z.array(GemPage),
})
export const CrucibleNode: z.ZodType<CrucibleNode> = z.object({
  /**
   * mod hash
   */
  skill: z.uint32().optional(),
  /**
   * mod tier
   */
  tier: z.uint32().optional(),
  /**
   * 
   */
  icon: z.string().optional(),
  /**
   * always true if present
   */
  allocated: z.boolean().optional(),
  /**
   * always true if present
   */
  isNotable: z.boolean().optional(),
  /**
   * always true if present
   */
  isReward: z.boolean().optional(),
  /**
   * stat descriptions
   */
  stats: z.array(z.string()).optional(),
  /**
   * 
   */
  reminderText: z.array(z.string()).optional(),
  /**
   * the column this node occupies
   */
  orbit: z.uint32().optional(),
  /**
   * the node's position within the column
   */
  orbitIndex: z.uint32().optional(),
  /**
   * node identifiers of nodes this one connects to
   */
  out: z.array(z.string()),
  /**
   * node identifiers of nodes connected to this one
   */
  in: z.array(z.string()),
})
export const FrameType = z.enum(FrameTypeEnum);
export const Item: z.ZodType<Item> = z.object({
  realm: z.string().optional(),
  verified: z.boolean(),
  w: z.uint32(),
  h: z.uint32(),
  icon: z.string(),
  support: z.boolean().optional(),
  stackSize: z.int32().optional(),
  maxStackSize: z.int32().optional(),
  stackSizeText: z.string().optional(),
  iconTierText: z.string().optional(),
  league: z.string().optional(),
  id: z.string().optional(),
  gemSockets: z.array(z.string()).optional(),
  influences: z.record(z.string(), z.any()).optional(),
  elder: z.boolean().optional(),
  shaper: z.boolean().optional(),
  searing: z.boolean().optional(),
  tangled: z.boolean().optional(),
  memoryItem: z.boolean().optional(),
  mutated: z.boolean().optional(),
  abyssJewel: z.boolean().optional(),
  delve: z.boolean().optional(),
  fractured: z.boolean().optional(),
  synthesised: z.boolean().optional(),
  sockets: z.array(ItemSocket).optional(),
  socketedItems: z.array(z.lazy(() => Item)).optional(),
  name: z.string(),
  typeLine: z.string(),
  baseType: z.string(),
  rarity: z.string().optional(),
  identified: z.boolean(),
  itemLevel: z.int32().optional(),
  unidentifiedTier: z.int32().optional(),
  ilvl: z.int32(),
  note: z.string().optional(),
  forum_note: z.string().optional(),
  lockedToCharacter: z.boolean().optional(),
  lockedToAccount: z.boolean().optional(),
  duplicated: z.boolean().optional(),
  split: z.boolean().optional(),
  corrupted: z.boolean().optional(),
  doubleCorrupted: z.boolean().optional(),
  sanctified: z.boolean().optional(),
  unmodifiable: z.boolean().optional(),
  unmodifiableExceptChaos: z.boolean().optional(),
  cisRaceReward: z.boolean().optional(),
  seaRaceReward: z.boolean().optional(),
  thRaceReward: z.boolean().optional(),
  properties: z.array(ItemProperty).optional(),
  notableProperties: z.array(ItemProperty).optional(),
  requirements: z.array(ItemProperty).optional(),
  weaponRequirements: z.array(ItemProperty).optional(),
  supportGemRequirements: z.array(ItemProperty).optional(),
  additionalProperties: z.array(ItemProperty).optional(),
  nextLevelRequirements: z.array(ItemProperty).optional(),
  grantedSkills: z.array(ItemProperty).optional(),
  talismanTier: z.int32().optional(),
  rewards: z.array(z.object({
    label: z.string(),
    rewards: z.record(z.string(), z.int32()),
  })).optional(),
  secDescrText: z.string().optional(),
  utilityMods: z.array(z.string()).optional(),
  logbookMods: z.array(z.object({
    name: z.string(),
    faction: z.object({
      id: z.string(),
      name: z.string(),
    }),
    mods: z.array(z.string()),
  })).optional(),
  enchantMods: z.array(z.string()).optional(),
  runeMods: z.array(z.string()).optional(),
  scourgeMods: z.array(z.string()).optional(),
  implicitMods: z.array(z.string()).optional(),
  ultimatumMods: z.array(z.object({
    type: z.string(),
    tier: z.uint32(),
  })).optional(),
  explicitMods: z.array(z.string()).optional(),
  bondedMods: z.array(z.string()).optional(),
  craftedMods: z.array(z.string()).optional(),
  fracturedMods: z.array(z.string()).optional(),
  mutatedMods: z.array(z.string()).optional(),
  crucibleMods: z.array(z.string()).optional(),
  cosmeticMods: z.array(z.string()).optional(),
  veiledMods: z.array(z.string()).optional(),
  veiled: z.boolean().optional(),
  desecratedMods: z.array(z.string()).optional(),
  desecrated: z.boolean().optional(),
  gemTabs: z.array(GemTab).optional(),
  gemBackground: z.string().optional(),
  gemSkill: z.string().optional(),
  descrText: z.string().optional(),
  flavourText: z.array(z.string()).optional(),
  flavourTextNote: z.string().optional(),
  prophecyText: z.string().optional(),
  isRelic: z.boolean().optional(),
  foilVariation: z.int32().optional(),
  replica: z.boolean().optional(),
  foreseeing: z.boolean().optional(),
  incubatedItem: z.object({
    name: z.string(),
    level: z.uint32(),
    progress: z.uint32(),
    total: z.uint32(),
  }).optional(),
  scourged: z.object({
    tier: z.uint32(),
    level: z.uint32().optional(),
    progress: z.uint32().optional(),
    total: z.uint32().optional(),
  }).optional(),
  crucible: z.object({
    layout: z.string(),
    nodes: z.record(z.string(), CrucibleNode),
  }).optional(),
  ruthless: z.boolean().optional(),
  frameType: FrameType.optional(),
  artFilename: z.string().optional(),
  hybrid: z.object({
    isVaalGem: z.boolean().optional(),
    baseTypeName: z.string(),
    properties: z.array(ItemProperty).optional(),
    explicitMods: z.array(z.string()).optional(),
    secDescrText: z.string().optional(),
  }).optional(),
  extended: z.object({
    prefixes: z.uint32().optional(),
    suffixes: z.uint32().optional(),
  }).optional(),
  x: z.uint32().optional(),
  y: z.uint32().optional(),
  inventoryId: z.string().optional(),
  socket: z.uint32().optional(),
  colour: z.string().optional(),
})
export const PublicStashChange: z.ZodType<PublicStashChange> = z.object({
  id: z.string(),
  public: z.boolean(),
  accountName: z.string().optional(),
  stash: z.string().optional(),
  stashType: z.string(),
  league: z.string().optional(),
  items: z.array(Item),
})
export const PassiveNode: z.ZodType<PassiveNode> = z.object({
  skill: z.uint32().optional(),
  name: z.string().optional(),
  icon: z.string().optional(),
  isKeystone: z.boolean().optional(),
  isNotable: z.boolean().optional(),
  isMastery: z.boolean().optional(),
  inactiveIcon: z.string().optional(),
  activeIcon: z.string().optional(),
  activeEffectImage: z.string().optional(),
  masteryEffects: z.array(z.object({
    effect: z.uint32(),
    stats: z.array(z.string()),
    reminderText: z.array(z.string()).optional(),
  })).optional(),
  isBlighted: z.boolean().optional(),
  isTattoo: z.boolean().optional(),
  isProxy: z.boolean().optional(),
  isJewelSocket: z.boolean().optional(),
  expansionJewel: z.object({
    size: z.uint32().optional(),
    index: z.uint32().optional(),
    proxy: z.uint32().optional(),
    parent: z.uint32().optional(),
  }).optional(),
  recipe: z.array(z.string()).optional(),
  grantedStrength: z.uint32().optional(),
  grantedDexterity: z.uint32().optional(),
  grantedIntelligence: z.uint32().optional(),
  ascendancyName: z.string().optional(),
  isAscendancyStart: z.boolean().optional(),
  isMultipleChoice: z.boolean().optional(),
  isMultipleChoiceOption: z.boolean().optional(),
  grantedPassivePoints: z.uint32().optional(),
  stats: z.array(z.string()).optional(),
  reminderText: z.array(z.string()).optional(),
  flavourText: z.array(z.string()).optional(),
  classStartIndex: z.uint32().optional(),
  group: z.string().optional(),
  orbit: z.uint32().optional(),
  orbitIndex: z.uint32().optional(),
  out: z.array(z.string()),
  in: z.array(z.string()),
})
export const PassiveGroup: z.ZodType<PassiveGroup> = z.object({
  x: z.float32(),
  y: z.float32(),
  orbits: z.array(z.uint32()),
  isProxy: z.boolean().optional(),
  proxy: z.string().optional(),
  nodes: z.array(z.string()),
})
export const ItemJewelData: z.ZodType<ItemJewelData> = z.object({
  type: z.string(),
  radius: z.uint32().optional(),
  radiusMin: z.uint32().optional(),
  radiusVisual: z.string().optional(),
  subgraph: z.object({
    groups: z.record(z.string(), PassiveGroup),
    nodes: z.record(z.string(), PassiveNode),
  }).optional(),
})
export const Character: z.ZodType<Character> = z.object({
  id: z.string(),
  name: z.string(),
  realm: z.string(),
  class: z.string(),
  league: z.string().optional(),
  level: z.uint32(),
  experience: z.uint32(),
  ruthless: z.boolean().optional(),
  expired: z.boolean().optional(),
  deleted: z.boolean().optional(),
  current: z.boolean().optional(),
  equipment: z.array(Item).optional(),
  skills: z.array(Item).optional(),
  inventory: z.array(Item).optional(),
  rucksack: z.array(Item).optional(),
  jewels: z.array(Item).optional(),
  passives: z.object({
    hashes: z.array(z.uint32()),
    hashes_ex: z.array(z.uint32()),
    mastery_effects: z.record(z.string(), z.int32()),
    specialisations: z.record(z.string(), z.array(z.int32())),
    skill_overrides: z.record(z.string(), PassiveNode),
    bandit_choice: z.string().optional(),
    pantheon_major: z.string().optional(),
    pantheon_minor: z.string().optional(),
    jewel_data: z.record(z.string(), ItemJewelData),
    quest_stats: z.array(z.string()).optional(),
    alternate_ascendancy: z.string().optional(),
  }).optional(),
  metadata: z.object({
    version: z.string().optional(),
  }).optional(),
})
export const StashTab: z.ZodType<StashTab> = z.object({
  id: z.string(),
  parent: z.string().optional(),
  folder: z.string().optional(),
  name: z.string(),
  type: z.string(),
  index: z.uint32().optional(),
  metadata: z.object({
    public: z.boolean().optional(),
    folder: z.boolean().optional(),
    colour: z.string().optional(),
    map: z.record(z.string(), z.any()).optional(),
  }),
  children: z.array(z.lazy(() => StashTab)).optional(),
  items: z.array(Item).optional(),
})
export const LeagueAccount: z.ZodType<LeagueAccount> = z.object({
  atlas_passives: z.object({
    hashes: z.array(z.uint32()),
  }).optional(),
  atlas_passive_trees: z.array(z.object({
    name: z.string(),
    hashes: z.array(z.uint32()),
  })),
})
export const ItemFilter: z.ZodType<ItemFilter> = z.object({
  id: z.string(),
  filter_name: z.string(),
  realm: z.string(),
  description: z.string(),
  version: z.string(),
  type: z.string(),
  public: z.boolean().optional(),
  filter: z.string().optional(),
  validation: z.object({
    valid: z.boolean(),
    version: z.string().optional(),
    validated: z.string().optional(),
  }).optional(),
})
export const AccountProfileGetProfileResponse: z.ZodType<AccountProfileGetProfileResponse> = z.object({
  uuid: z.string(),
  name: z.string(),
  locale: z.string().optional(),
  twitch: z.object({
    name: z.string(),
  }).optional(),
})
export const AccountItemFiltersGetItemFiltersResponse: z.ZodType<AccountItemFiltersGetItemFiltersResponse> = z.object({
  filters: z.array(ItemFilter),
})
export const AccountItemFiltersGetItemFilterResponse: z.ZodType<AccountItemFiltersGetItemFilterResponse> = z.object({
  filter: ItemFilter,
})
export const AccountItemFiltersCreateItemFilterResponse: z.ZodType<AccountItemFiltersCreateItemFilterResponse> = z.object({
  filter: ItemFilter,
})
export const AccountItemFiltersUpdateItemFilterResponse: z.ZodType<AccountItemFiltersUpdateItemFilterResponse> = z.object({
  filter: ItemFilter,
  error: ApiError.optional(),
})
export const LeaguesListLeaguesResponse: z.ZodType<LeaguesListLeaguesResponse> = z.object({
  leagues: z.array(League),
})
export const LeaguesGetLeagueResponse: z.ZodType<LeaguesGetLeagueResponse> = z.object({
  league: League.optional(),
})
export const LeaguesGetLeagueLadderPoE1OnlyResponse: z.ZodType<LeaguesGetLeagueLadderPoE1OnlyResponse> = z.object({
  league: League,
  ladder: z.object({
    total: z.uint32(),
    cached_since: z.string().optional(),
    entries: z.array(LadderEntry),
  }),
})
export const LeaguesGetLeagueEventLadderPoE1OnlyResponse: z.ZodType<LeaguesGetLeagueEventLadderPoE1OnlyResponse> = z.object({
  league: League,
  ladder: z.object({
    total: z.uint32(),
    entries: z.array(EventLadderEntry),
  }),
})
export const PvPMatchesPoE1OnlyListPvPMatchesResponse: z.ZodType<PvPMatchesPoE1OnlyListPvPMatchesResponse> = z.object({
  matches: z.array(PvPMatch),
})
export const PvPMatchesPoE1OnlyGetPvPMatchResponse: z.ZodType<PvPMatchesPoE1OnlyGetPvPMatchResponse> = z.object({
  match: PvPMatch.optional(),
})
export const PvPMatchesPoE1OnlyGetPvPMatchLadderResponse: z.ZodType<PvPMatchesPoE1OnlyGetPvPMatchLadderResponse> = z.object({
  match: PvPMatch,
  ladder: z.object({
    total: z.uint32(),
    entries: z.array(PvPLadderTeamEntry),
  }),
})
export const AccountLeaguesPoE1OnlyGetLeaguesResponse: z.ZodType<AccountLeaguesPoE1OnlyGetLeaguesResponse> = z.object({
  leagues: z.array(League),
})
export const AccountCharactersListCharactersResponse: z.ZodType<AccountCharactersListCharactersResponse> = z.object({
  characters: z.array(Character),
})
export const AccountCharactersGetCharacterResponse: z.ZodType<AccountCharactersGetCharacterResponse> = z.object({
  character: Character.optional(),
})
export const AccountStashesPoE1OnlyListStashesResponse: z.ZodType<AccountStashesPoE1OnlyListStashesResponse> = z.object({
  stashes: z.array(StashTab),
})
export const AccountStashesPoE1OnlyGetStashResponse: z.ZodType<AccountStashesPoE1OnlyGetStashResponse> = z.object({
  stash: StashTab.optional(),
})
export const LeagueAccountsPoE1OnlyGetLeagueAccountResponse: z.ZodType<LeagueAccountsPoE1OnlyGetLeagueAccountResponse> = z.object({
  league_account: LeagueAccount,
})
export const GuildStashesPoE1OnlyListGuildStashesResponse: z.ZodType<GuildStashesPoE1OnlyListGuildStashesResponse> = z.object({
  stashes: z.array(StashTab),
})
export const GuildStashesPoE1OnlyGetGuildStashResponse: z.ZodType<GuildStashesPoE1OnlyGetGuildStashResponse> = z.object({
  stash: StashTab.optional(),
})
export const PublicStashesPoE1OnlyGetPublicStashesResponse: z.ZodType<PublicStashesPoE1OnlyGetPublicStashesResponse> = z.object({
  next_change_id: z.string(),
  stashes: z.array(PublicStashChange),
})
export const CurrencyExchangeGetExchangeMarketsResponse: z.ZodType<CurrencyExchangeGetExchangeMarketsResponse> = z.object({
  next_change_id: z.uint32(),
  markets: z.array(z.object({
    league: z.string(),
    market_id: z.string(),
    volume_traded: z.record(z.string(), z.uint32()),
    lowest_stock: z.record(z.string(), z.uint32()),
    highest_stock: z.record(z.string(), z.uint32()),
    lowest_ratio: z.record(z.string(), z.uint32()),
    highest_ratio: z.record(z.string(), z.uint32()),
  })),
})


// #endregion Type Information



// #region Endpoint Information

export const serverEndpoint = "https://api.pathofexile.com";
export const serverApiPaths = {

// #region Account Profile

// #region Get Profile
  "Get Profile": {
    requiredScope: "account:profile",
    name: "Get Profile",
    method: "GET",
    path: "/profile",
    responseType: AccountProfileGetProfileResponse,
  },

// #endregion Get Profile

// #endregion Account Profile

// #region Account Item Filters

// #region Get Item Filters
  "Get Item Filters": {
    requiredScope: "account:item_filter",
    name: "Get Item Filters",
    method: "GET",
    path: "/item-filter",
    responseType: AccountItemFiltersGetItemFiltersResponse,
  },

// #endregion Get Item Filters

// #region Get Item Filter
  "Get Item Filter": {
    requiredScope: "account:item_filter",
    name: "Get Item Filter",
    method: "GET",
    path: "/item-filter/<id>",
    responseType: AccountItemFiltersGetItemFilterResponse,
  },

// #endregion Get Item Filter

// #region Create Item Filter
  "Create Item Filter": {
    requiredScope: "account:item_filter",
    name: "Create Item Filter",
    method: "POST",
    path: "/item-filter",
    responseType: AccountItemFiltersCreateItemFilterResponse,
  },

// #endregion Create Item Filter

// #region Update Item Filter
  "Update Item Filter": {
    requiredScope: "account:item_filter",
    name: "Update Item Filter",
    method: "POST",
    path: "/item-filter/<id>",
    responseType: AccountItemFiltersUpdateItemFilterResponse,
  },

// #endregion Update Item Filter

// #endregion Account Item Filters

// #region Leagues

// #region List Leagues
  "List Leagues": {
    requiredScope: "service:leagues",
    name: "List Leagues",
    method: "GET",
    path: "/league",
    responseType: LeaguesListLeaguesResponse,
  },

// #endregion List Leagues

// #region Get League
  "Get League": {
    requiredScope: "service:leagues",
    name: "Get League",
    method: "GET",
    path: "/league/<league>",
    responseType: LeaguesGetLeagueResponse,
  },

// #endregion Get League

// #region Get League Ladder (PoE1 only)
  "Get League Ladder (PoE1 only)": {
    requiredScope: "service:leagues",
    name: "Get League Ladder (PoE1 only)",
    method: "GET",
    path: "/league/<league>/ladder",
    responseType: LeaguesGetLeagueLadderPoE1OnlyResponse,
  },

// #endregion Get League Ladder (PoE1 only)

// #region Get League Event Ladder (PoE1 only)
  "Get League Event Ladder (PoE1 only)": {
    requiredScope: "service:leagues",
    name: "Get League Event Ladder (PoE1 only)",
    method: "GET",
    path: "/league/<league>/event-ladder",
    responseType: LeaguesGetLeagueEventLadderPoE1OnlyResponse,
  },

// #endregion Get League Event Ladder (PoE1 only)

// #endregion Leagues

// #region PvP Matches (PoE1 only)

// #region List PvP Matches
  "List PvP Matches": {
    requiredScope: "service:pvp_matches",
    name: "List PvP Matches",
    method: "GET",
    path: "/pvp-match",
    responseType: PvPMatchesPoE1OnlyListPvPMatchesResponse,
  },

// #endregion List PvP Matches

// #region Get PvP Match
  "Get PvP Match": {
    requiredScope: "service:pvp_matches",
    name: "Get PvP Match",
    method: "GET",
    path: "/pvp-match/<match>",
    responseType: PvPMatchesPoE1OnlyGetPvPMatchResponse,
  },

// #endregion Get PvP Match

// #region Get PvP Match Ladder
  "Get PvP Match Ladder": {
    requiredScope: "service:pvp_matches",
    name: "Get PvP Match Ladder",
    method: "GET",
    path: "/pvp-match/<match>/ladder",
    responseType: PvPMatchesPoE1OnlyGetPvPMatchLadderResponse,
  },

// #endregion Get PvP Match Ladder

// #endregion PvP Matches (PoE1 only)

// #region Account Leagues (PoE1 only)

// #region Get Leagues
  "Get Leagues": {
    requiredScope: "account:leagues",
    name: "Get Leagues",
    method: "GET",
    path: "/account/leagues[/<realm>]",
    responseType: AccountLeaguesPoE1OnlyGetLeaguesResponse,
  },

// #endregion Get Leagues

// #endregion Account Leagues (PoE1 only)

// #region Account Characters

// #region List Characters
  "List Characters": {
    requiredScope: "account:characters",
    name: "List Characters",
    method: "GET",
    path: "/character[/<realm>]",
    responseType: AccountCharactersListCharactersResponse,
  },

// #endregion List Characters

// #region Get Character
  "Get Character": {
    requiredScope: "account:characters",
    name: "Get Character",
    method: "GET",
    path: "/character[/<realm>]/<name>",
    responseType: AccountCharactersGetCharacterResponse,
  },

// #endregion Get Character

// #endregion Account Characters

// #region Account Stashes (PoE1 only)

// #region List Stashes
  "List Stashes": {
    requiredScope: "account:stashes",
    name: "List Stashes",
    method: "GET",
    path: "/stash[/<realm>]/<league>",
    responseType: AccountStashesPoE1OnlyListStashesResponse,
  },

// #endregion List Stashes

// #region Get Stash
  "Get Stash": {
    requiredScope: "account:stashes",
    name: "Get Stash",
    method: "GET",
    path: "/stash[/<realm>]/<league>/<stash_id>[/<substash_id>]",
    responseType: AccountStashesPoE1OnlyGetStashResponse,
  },

// #endregion Get Stash

// #endregion Account Stashes (PoE1 only)

// #region League Accounts (PoE1 only)

// #region Get League Account
  "Get League Account": {
    requiredScope: "account:league_accounts",
    name: "Get League Account",
    method: "GET",
    path: "/league-account[/<realm>]/<league>",
    responseType: LeagueAccountsPoE1OnlyGetLeagueAccountResponse,
  },

// #endregion Get League Account

// #endregion League Accounts (PoE1 only)

// #region Guild Stashes (PoE1 only)

// #region List Guild Stashes
  "List Guild Stashes": {
    requiredScope: "account:guild:stashes",
    name: "List Guild Stashes",
    method: "GET",
    path: "/guild[/<realm>]/stash/<league>",
    responseType: GuildStashesPoE1OnlyListGuildStashesResponse,
  },

// #endregion List Guild Stashes

// #region Get Guild Stash
  "Get Guild Stash": {
    requiredScope: "account:guild:stashes",
    name: "Get Guild Stash",
    method: "GET",
    path: "/guild[/<realm>]/stash/<league>/<stash_id>[/<substash_id>]",
    responseType: GuildStashesPoE1OnlyGetGuildStashResponse,
  },

// #endregion Get Guild Stash

// #endregion Guild Stashes (PoE1 only)

// #region Public Stashes (PoE1 only)

// #region Get Public Stashes
  "Get Public Stashes": {
    requiredScope: "service:psapi",
    name: "Get Public Stashes",
    method: "GET",
    path: "/public-stash-tabs[/<realm>]",
    responseType: PublicStashesPoE1OnlyGetPublicStashesResponse,
  },

// #endregion Get Public Stashes

// #endregion Public Stashes (PoE1 only)

// #region Currency Exchange

// #region Get Exchange Markets
  "Get Exchange Markets": {
    requiredScope: "service:cxapi",
    name: "Get Exchange Markets",
    method: "GET",
    path: "/currency-exchange[/<realm>][/<id>]",
    responseType: CurrencyExchangeGetExchangeMarketsResponse,
  },

// #endregion Get Exchange Markets

// #endregion Currency Exchange
} as const;

// #endregion Endpoint Information


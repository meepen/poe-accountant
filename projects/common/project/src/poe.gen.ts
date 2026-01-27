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
  description?: string | undefined | null;
}

/**
 * object League
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-League
 */
export interface League {
  id: string;
  realm?: string | undefined | null;
  name?: string | undefined | null;
  description?: string | undefined | null;
  category?: {
    id: string;
    current?: boolean | undefined | null | null;
  } | undefined | null;
  rules?: LeagueRule[] | undefined | null;
  registerAt?: string | undefined | null;
  event?: boolean | undefined | null;
  goal?: string | undefined | null;
  url?: string | undefined | null;
  startAt?: string | undefined | null;
  endAt?: string | undefined | null;
  timedEvent?: boolean | undefined | null;
  scoreEvent?: boolean | undefined | null;
  delveEvent?: boolean | undefined | null;
  ancestorEvent?: boolean | undefined | null;
  leagueEvent?: boolean | undefined | null;
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
  realm?: string | undefined | null;
  guild?: Guild | undefined | null;
  challenges?: {
    set: string;
    completed: number;
    max: number;
  } | undefined | null;
  twitch?: {
    name: string;
    stream?: {
      name: string;
      image: string;
      status: string;
    } | undefined | null | null;
  } | undefined | null;
}

/**
 * object LadderEntry
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-LadderEntry
 */
export interface LadderEntry {
  rank: number;
  dead?: boolean | undefined | null;
  retired?: boolean | undefined | null;
  ineligible?: boolean | undefined | null;
  public?: boolean | undefined | null;
  character: {
    id: string;
    name: string;
    level: number;
    class: string;
    time?: number | undefined | null | null;
    score?: number | undefined | null | null;
    progress?: Record<string, any> | undefined | null | null;
    experience?: number | undefined | null | null;
    depth?: {
      default?: number | undefined | null | null;
      solo?: number | undefined | null | null;
    } | undefined | null | null;
  };
  account?: Account | undefined | null;
}

/**
 * object EventLadderEntry
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-EventLadderEntry
 */
export interface EventLadderEntry {
  rank: number;
  ineligible?: boolean | undefined | null;
  time?: number | undefined | null;
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
  realm?: string | undefined | null;
  startAt?: string | undefined | null;
  endAt?: string | undefined | null;
  url?: string | undefined | null;
  description: string;
  glickoRatings: boolean;
  pvp: boolean;
  style: string;
  registerAt?: string | undefined | null;
  complete?: boolean | undefined | null;
  upcoming?: boolean | undefined | null;
  inProgress?: boolean | undefined | null;
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
    league?: string | undefined | null | null;
    score?: number | undefined | null | null;
  };
  public?: boolean | undefined | null;
}

/**
 * object PvPLadderTeamEntry
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PvPLadderTeamEntry
 */
export interface PvPLadderTeamEntry {
  rank: number;
  rating?: number | undefined | null;
  points?: number | undefined | null;
  games_played?: number | undefined | null;
  cumulative_opponent_points?: number | undefined | null;
  last_game_time?: string | undefined | null;
  members: PvPLadderTeamMember[];
}

/**
 * object ItemSocket
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-ItemSocket
 */
export interface ItemSocket {
  group: number;
  attr?: string | undefined | null;
  sColour?: string | undefined | null;
  type?: string | undefined | null;
  item?: string | undefined | null;
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
  displayMode?: DisplayModeEnum | undefined | null;
  progress?: number | undefined | null;
  type?: number | undefined | null;
  suffix?: string | undefined | null;
  icon?: string | undefined | null;
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
  skillName?: string | undefined | null;
  /**
   * 
   */
  description?: string | undefined | null;
  /**
   * 
   */
  properties?: ItemProperty[] | undefined | null;
  /**
   * 
   */
  stats?: string[] | undefined | null;
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
  name?: string | undefined | null;
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
  skill?: number | undefined | null;
  /**
   * mod tier
   */
  tier?: number | undefined | null;
  /**
   * 
   */
  icon?: string | undefined | null;
  /**
   * always true if present
   */
  allocated?: boolean | undefined | null;
  /**
   * always true if present
   */
  isNotable?: boolean | undefined | null;
  /**
   * always true if present
   */
  isReward?: boolean | undefined | null;
  /**
   * stat descriptions
   */
  stats?: string[] | undefined | null;
  /**
   * 
   */
  reminderText?: string[] | undefined | null;
  /**
   * the column this node occupies
   */
  orbit?: number | undefined | null;
  /**
   * the node's position within the column
   */
  orbitIndex?: number | undefined | null;
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
  realm?: string | undefined | null;
  verified: boolean;
  w: number;
  h: number;
  icon: string;
  support?: boolean | undefined | null;
  stackSize?: number | undefined | null;
  maxStackSize?: number | undefined | null;
  stackSizeText?: string | undefined | null;
  iconTierText?: string | undefined | null;
  league?: string | undefined | null;
  id?: string | undefined | null;
  gemSockets?: string[] | undefined | null;
  influences?: Record<string, any> | undefined | null;
  elder?: boolean | undefined | null;
  shaper?: boolean | undefined | null;
  searing?: boolean | undefined | null;
  tangled?: boolean | undefined | null;
  memoryItem?: boolean | undefined | null;
  mutated?: boolean | undefined | null;
  abyssJewel?: boolean | undefined | null;
  delve?: boolean | undefined | null;
  fractured?: boolean | undefined | null;
  synthesised?: boolean | undefined | null;
  sockets?: ItemSocket[] | undefined | null;
  socketedItems?: Item[] | undefined | null;
  name: string;
  typeLine: string;
  baseType: string;
  rarity?: string | undefined | null;
  identified: boolean;
  itemLevel?: number | undefined | null;
  unidentifiedTier?: number | undefined | null;
  ilvl: number;
  note?: string | undefined | null;
  forum_note?: string | undefined | null;
  lockedToCharacter?: boolean | undefined | null;
  lockedToAccount?: boolean | undefined | null;
  duplicated?: boolean | undefined | null;
  split?: boolean | undefined | null;
  corrupted?: boolean | undefined | null;
  doubleCorrupted?: boolean | undefined | null;
  sanctified?: boolean | undefined | null;
  unmodifiable?: boolean | undefined | null;
  unmodifiableExceptChaos?: boolean | undefined | null;
  cisRaceReward?: boolean | undefined | null;
  seaRaceReward?: boolean | undefined | null;
  thRaceReward?: boolean | undefined | null;
  properties?: ItemProperty[] | undefined | null;
  notableProperties?: ItemProperty[] | undefined | null;
  requirements?: ItemProperty[] | undefined | null;
  weaponRequirements?: ItemProperty[] | undefined | null;
  supportGemRequirements?: ItemProperty[] | undefined | null;
  additionalProperties?: ItemProperty[] | undefined | null;
  nextLevelRequirements?: ItemProperty[] | undefined | null;
  grantedSkills?: ItemProperty[] | undefined | null;
  talismanTier?: number | undefined | null;
  rewards?: {
    label: string;
    rewards: Record<string, number>;
  }[] | undefined | null;
  secDescrText?: string | undefined | null;
  utilityMods?: string[] | undefined | null;
  logbookMods?: {
    name: string;
    faction: {
      id: string;
      name: string;
    };
    mods: string[];
  }[] | undefined | null;
  enchantMods?: string[] | undefined | null;
  runeMods?: string[] | undefined | null;
  scourgeMods?: string[] | undefined | null;
  implicitMods?: string[] | undefined | null;
  ultimatumMods?: {
    type: string;
    tier: number;
  }[] | undefined | null;
  explicitMods?: string[] | undefined | null;
  bondedMods?: string[] | undefined | null;
  craftedMods?: string[] | undefined | null;
  fracturedMods?: string[] | undefined | null;
  mutatedMods?: string[] | undefined | null;
  crucibleMods?: string[] | undefined | null;
  cosmeticMods?: string[] | undefined | null;
  veiledMods?: string[] | undefined | null;
  veiled?: boolean | undefined | null;
  desecratedMods?: string[] | undefined | null;
  desecrated?: boolean | undefined | null;
  gemTabs?: GemTab[] | undefined | null;
  gemBackground?: string | undefined | null;
  gemSkill?: string | undefined | null;
  descrText?: string | undefined | null;
  flavourText?: string[] | undefined | null;
  flavourTextNote?: string | undefined | null;
  prophecyText?: string | undefined | null;
  isRelic?: boolean | undefined | null;
  foilVariation?: number | undefined | null;
  replica?: boolean | undefined | null;
  foreseeing?: boolean | undefined | null;
  incubatedItem?: {
    name: string;
    level: number;
    progress: number;
    total: number;
  } | undefined | null;
  scourged?: {
    tier: number;
    level?: number | undefined | null | null;
    progress?: number | undefined | null | null;
    total?: number | undefined | null | null;
  } | undefined | null;
  crucible?: {
    layout: string;
    nodes: Record<string, CrucibleNode>;
  } | undefined | null;
  ruthless?: boolean | undefined | null;
  frameType?: FrameTypeEnum | undefined | null;
  artFilename?: string | undefined | null;
  hybrid?: {
    isVaalGem?: boolean | undefined | null | null;
    baseTypeName: string;
    properties?: ItemProperty[] | undefined | null | null;
    explicitMods?: string[] | undefined | null | null;
    secDescrText?: string | undefined | null | null;
  } | undefined | null;
  extended?: {
    prefixes?: number | undefined | null | null;
    suffixes?: number | undefined | null | null;
  } | undefined | null;
  x?: number | undefined | null;
  y?: number | undefined | null;
  inventoryId?: string | undefined | null;
  socket?: number | undefined | null;
  colour?: string | undefined | null;
}

/**
 * object PublicStashChange
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PublicStashChange
 */
export interface PublicStashChange {
  id: string;
  public: boolean;
  accountName?: string | undefined | null;
  stash?: string | undefined | null;
  stashType: string;
  league?: string | undefined | null;
  items: Item[];
}

/**
 * object PassiveNode
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-PassiveNode
 */
export interface PassiveNode {
  skill?: number | undefined | null;
  name?: string | undefined | null;
  icon?: string | undefined | null;
  isKeystone?: boolean | undefined | null;
  isNotable?: boolean | undefined | null;
  isMastery?: boolean | undefined | null;
  inactiveIcon?: string | undefined | null;
  activeIcon?: string | undefined | null;
  activeEffectImage?: string | undefined | null;
  masteryEffects?: {
    effect: number;
    stats: string[];
    reminderText?: string[] | undefined | null | null;
  }[] | undefined | null;
  isBlighted?: boolean | undefined | null;
  isTattoo?: boolean | undefined | null;
  isProxy?: boolean | undefined | null;
  isJewelSocket?: boolean | undefined | null;
  expansionJewel?: {
    size?: number | undefined | null | null;
    index?: number | undefined | null | null;
    proxy?: number | undefined | null | null;
    parent?: number | undefined | null | null;
  } | undefined | null;
  recipe?: string[] | undefined | null;
  grantedStrength?: number | undefined | null;
  grantedDexterity?: number | undefined | null;
  grantedIntelligence?: number | undefined | null;
  ascendancyName?: string | undefined | null;
  isAscendancyStart?: boolean | undefined | null;
  isMultipleChoice?: boolean | undefined | null;
  isMultipleChoiceOption?: boolean | undefined | null;
  grantedPassivePoints?: number | undefined | null;
  stats?: string[] | undefined | null;
  reminderText?: string[] | undefined | null;
  flavourText?: string[] | undefined | null;
  classStartIndex?: number | undefined | null;
  group?: string | undefined | null;
  orbit?: number | undefined | null;
  orbitIndex?: number | undefined | null;
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
  isProxy?: boolean | undefined | null;
  proxy?: string | undefined | null;
  nodes: string[];
}

/**
 * object ItemJewelData
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-ItemJewelData
 */
export interface ItemJewelData {
  type: string;
  radius?: number | undefined | null;
  radiusMin?: number | undefined | null;
  radiusVisual?: string | undefined | null;
  subgraph?: {
    groups: Record<string, PassiveGroup>;
    nodes: Record<string, PassiveNode>;
  } | undefined | null;
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
  league?: string | undefined | null;
  level: number;
  experience: number;
  ruthless?: boolean | undefined | null;
  expired?: boolean | undefined | null;
  deleted?: boolean | undefined | null;
  current?: boolean | undefined | null;
  equipment?: Item[] | undefined | null;
  skills?: Item[] | undefined | null;
  inventory?: Item[] | undefined | null;
  rucksack?: Item[] | undefined | null;
  jewels?: Item[] | undefined | null;
  passives?: {
    hashes: number[];
    hashes_ex: number[];
    mastery_effects: Record<string, number>;
    specialisations: Record<string, number[]>;
    skill_overrides: Record<string, PassiveNode>;
    bandit_choice?: string | undefined | null | null;
    pantheon_major?: string | undefined | null | null;
    pantheon_minor?: string | undefined | null | null;
    jewel_data: Record<string, ItemJewelData>;
    quest_stats?: string[] | undefined | null | null;
    alternate_ascendancy?: string | undefined | null | null;
  } | undefined | null;
  metadata?: {
    version?: string | undefined | null | null;
  } | undefined | null;
}

/**
 * object StashTab
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-StashTab
 */
export interface StashTab {
  id: string;
  parent?: string | undefined | null;
  folder?: string | undefined | null;
  name: string;
  type: string;
  index?: number | undefined | null;
  metadata: {
    public?: boolean | undefined | null | null;
    folder?: boolean | undefined | null | null;
    colour?: string | undefined | null | null;
    map?: Record<string, any> | undefined | null | null;
  };
  children?: StashTab[] | undefined | null;
  items?: Item[] | undefined | null;
}

/**
 * object LeagueAccount
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-LeagueAccount
 */
export interface LeagueAccount {
  atlas_passives?: {
    hashes: number[];
  } | undefined | null;
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
  public?: boolean | undefined | null;
  filter?: string | undefined | null;
  validation?: {
    valid: boolean;
    version?: string | undefined | null | null;
    validated?: string | undefined | null | null;
  } | undefined | null;
}

/**
 * object AccountProfileGetProfileResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-AccountProfileGetProfileResponse
 */
export interface AccountProfileGetProfileResponse {
  uuid: string;
  name: string;
  locale?: string | undefined | null;
  twitch?: {
    name: string;
  } | undefined | null;
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
  error?: ApiError | undefined | null;
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
  league?: League | undefined | null;
}

/**
 * object LeaguesGetLeagueLadderPoE1OnlyResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#type-LeaguesGetLeagueLadderPoE1OnlyResponse
 */
export interface LeaguesGetLeagueLadderPoE1OnlyResponse {
  league: League;
  ladder: {
    total: number;
    cached_since?: string | undefined | null | null;
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
  match?: PvPMatch | undefined | null;
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
  character?: Character | undefined | null;
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
  stash?: StashTab | undefined | null;
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
  stash?: StashTab | undefined | null;
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
  description: z.string().nullable().optional(),
})
export const League: z.ZodType<League> = z.object({
  id: z.string(),
  realm: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  category: z.object({
    id: z.string(),
    current: z.boolean().nullable().optional(),
  }).nullable().optional(),
  rules: z.array(LeagueRule).nullable().optional(),
  registerAt: z.string().nullable().optional(),
  event: z.boolean().nullable().optional(),
  goal: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  timedEvent: z.boolean().nullable().optional(),
  scoreEvent: z.boolean().nullable().optional(),
  delveEvent: z.boolean().nullable().optional(),
  ancestorEvent: z.boolean().nullable().optional(),
  leagueEvent: z.boolean().nullable().optional(),
})
export const Guild: z.ZodType<Guild> = z.object({
  id: z.uint32(),
  name: z.string(),
  tag: z.string(),
})
export const Account: z.ZodType<Account> = z.object({
  name: z.string(),
  realm: z.string().nullable().optional(),
  guild: Guild.nullable().optional(),
  challenges: z.object({
    set: z.string(),
    completed: z.uint32(),
    max: z.uint32(),
  }).nullable().optional(),
  twitch: z.object({
    name: z.string(),
    stream: z.object({
      name: z.string(),
      image: z.string(),
      status: z.string(),
    }).nullable().optional(),
  }).nullable().optional(),
})
export const LadderEntry: z.ZodType<LadderEntry> = z.object({
  rank: z.uint32(),
  dead: z.boolean().nullable().optional(),
  retired: z.boolean().nullable().optional(),
  ineligible: z.boolean().nullable().optional(),
  public: z.boolean().nullable().optional(),
  character: z.object({
    id: z.string(),
    name: z.string(),
    level: z.uint32(),
    class: z.string(),
    time: z.uint32().nullable().optional(),
    score: z.uint32().nullable().optional(),
    progress: z.record(z.string(), z.any()).nullable().optional(),
    experience: z.uint32().nullable().optional(),
    depth: z.object({
      default: z.uint32().nullable().optional(),
      solo: z.uint32().nullable().optional(),
    }).nullable().optional(),
  }),
  account: Account.nullable().optional(),
})
export const EventLadderEntry: z.ZodType<EventLadderEntry> = z.object({
  rank: z.uint32(),
  ineligible: z.boolean().nullable().optional(),
  time: z.uint32().nullable().optional(),
  private_league: z.object({
    name: z.string(),
    url: z.string(),
  }),
})
export const PvPMatch: z.ZodType<PvPMatch> = z.object({
  id: z.string(),
  realm: z.string().nullable().optional(),
  startAt: z.string().nullable().optional(),
  endAt: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  description: z.string(),
  glickoRatings: z.boolean(),
  pvp: z.boolean(),
  style: z.string(),
  registerAt: z.string().nullable().optional(),
  complete: z.boolean().nullable().optional(),
  upcoming: z.boolean().nullable().optional(),
  inProgress: z.boolean().nullable().optional(),
})
export const PvPLadderTeamMember: z.ZodType<PvPLadderTeamMember> = z.object({
  account: Account,
  character: z.object({
    id: z.string(),
    name: z.string(),
    level: z.uint32(),
    class: z.string(),
    league: z.string().nullable().optional(),
    score: z.uint32().nullable().optional(),
  }),
  public: z.boolean().nullable().optional(),
})
export const PvPLadderTeamEntry: z.ZodType<PvPLadderTeamEntry> = z.object({
  rank: z.uint32(),
  rating: z.uint32().nullable().optional(),
  points: z.uint32().nullable().optional(),
  games_played: z.uint32().nullable().optional(),
  cumulative_opponent_points: z.uint32().nullable().optional(),
  last_game_time: z.string().nullable().optional(),
  members: z.array(PvPLadderTeamMember),
})
export const ItemSocket: z.ZodType<ItemSocket> = z.object({
  group: z.uint32(),
  attr: z.string().nullable().optional(),
  sColour: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  item: z.string().nullable().optional(),
})
export const DisplayMode = z.enum(DisplayModeEnum);
export const ItemProperty: z.ZodType<ItemProperty> = z.object({
  name: z.string(),
  values: z.array(z.tuple([
    z.string(),
    z.uint32()
  ])),
  displayMode: DisplayMode.nullable().optional(),
  progress: z.float64().nullable().optional(),
  type: z.uint32().nullable().optional(),
  suffix: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
})
export const GemPage: z.ZodType<GemPage> = z.object({
  /**
   * 
   */
  skillName: z.string().nullable().optional(),
  /**
   * 
   */
  description: z.string().nullable().optional(),
  /**
   * 
   */
  properties: z.array(ItemProperty).nullable().optional(),
  /**
   * 
   */
  stats: z.array(z.string()).nullable().optional(),
})
export const GemTab: z.ZodType<GemTab> = z.object({
  /**
   * 
   */
  name: z.string().nullable().optional(),
  /**
   * 
   */
  pages: z.array(GemPage),
})
export const CrucibleNode: z.ZodType<CrucibleNode> = z.object({
  /**
   * mod hash
   */
  skill: z.uint32().nullable().optional(),
  /**
   * mod tier
   */
  tier: z.uint32().nullable().optional(),
  /**
   * 
   */
  icon: z.string().nullable().optional(),
  /**
   * always true if present
   */
  allocated: z.boolean().nullable().optional(),
  /**
   * always true if present
   */
  isNotable: z.boolean().nullable().optional(),
  /**
   * always true if present
   */
  isReward: z.boolean().nullable().optional(),
  /**
   * stat descriptions
   */
  stats: z.array(z.string()).nullable().optional(),
  /**
   * 
   */
  reminderText: z.array(z.string()).nullable().optional(),
  /**
   * the column this node occupies
   */
  orbit: z.uint32().nullable().optional(),
  /**
   * the node's position within the column
   */
  orbitIndex: z.uint32().nullable().optional(),
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
  realm: z.string().nullable().optional(),
  verified: z.boolean(),
  w: z.uint32(),
  h: z.uint32(),
  icon: z.string(),
  support: z.boolean().nullable().optional(),
  stackSize: z.int32().nullable().optional(),
  maxStackSize: z.int32().nullable().optional(),
  stackSizeText: z.string().nullable().optional(),
  iconTierText: z.string().nullable().optional(),
  league: z.string().nullable().optional(),
  id: z.string().nullable().optional(),
  gemSockets: z.array(z.string()).nullable().optional(),
  influences: z.record(z.string(), z.any()).nullable().optional(),
  elder: z.boolean().nullable().optional(),
  shaper: z.boolean().nullable().optional(),
  searing: z.boolean().nullable().optional(),
  tangled: z.boolean().nullable().optional(),
  memoryItem: z.boolean().nullable().optional(),
  mutated: z.boolean().nullable().optional(),
  abyssJewel: z.boolean().nullable().optional(),
  delve: z.boolean().nullable().optional(),
  fractured: z.boolean().nullable().optional(),
  synthesised: z.boolean().nullable().optional(),
  sockets: z.array(ItemSocket).nullable().optional(),
  socketedItems: z.array(z.lazy(() => Item)).nullable().optional(),
  name: z.string(),
  typeLine: z.string(),
  baseType: z.string(),
  rarity: z.string().nullable().optional(),
  identified: z.boolean(),
  itemLevel: z.int32().nullable().optional(),
  unidentifiedTier: z.int32().nullable().optional(),
  ilvl: z.int32(),
  note: z.string().nullable().optional(),
  forum_note: z.string().nullable().optional(),
  lockedToCharacter: z.boolean().nullable().optional(),
  lockedToAccount: z.boolean().nullable().optional(),
  duplicated: z.boolean().nullable().optional(),
  split: z.boolean().nullable().optional(),
  corrupted: z.boolean().nullable().optional(),
  doubleCorrupted: z.boolean().nullable().optional(),
  sanctified: z.boolean().nullable().optional(),
  unmodifiable: z.boolean().nullable().optional(),
  unmodifiableExceptChaos: z.boolean().nullable().optional(),
  cisRaceReward: z.boolean().nullable().optional(),
  seaRaceReward: z.boolean().nullable().optional(),
  thRaceReward: z.boolean().nullable().optional(),
  properties: z.array(ItemProperty).nullable().optional(),
  notableProperties: z.array(ItemProperty).nullable().optional(),
  requirements: z.array(ItemProperty).nullable().optional(),
  weaponRequirements: z.array(ItemProperty).nullable().optional(),
  supportGemRequirements: z.array(ItemProperty).nullable().optional(),
  additionalProperties: z.array(ItemProperty).nullable().optional(),
  nextLevelRequirements: z.array(ItemProperty).nullable().optional(),
  grantedSkills: z.array(ItemProperty).nullable().optional(),
  talismanTier: z.int32().nullable().optional(),
  rewards: z.array(z.object({
    label: z.string(),
    rewards: z.record(z.string(), z.int32()),
  })).nullable().optional(),
  secDescrText: z.string().nullable().optional(),
  utilityMods: z.array(z.string()).nullable().optional(),
  logbookMods: z.array(z.object({
    name: z.string(),
    faction: z.object({
      id: z.string(),
      name: z.string(),
    }),
    mods: z.array(z.string()),
  })).nullable().optional(),
  enchantMods: z.array(z.string()).nullable().optional(),
  runeMods: z.array(z.string()).nullable().optional(),
  scourgeMods: z.array(z.string()).nullable().optional(),
  implicitMods: z.array(z.string()).nullable().optional(),
  ultimatumMods: z.array(z.object({
    type: z.string(),
    tier: z.uint32(),
  })).nullable().optional(),
  explicitMods: z.array(z.string()).nullable().optional(),
  bondedMods: z.array(z.string()).nullable().optional(),
  craftedMods: z.array(z.string()).nullable().optional(),
  fracturedMods: z.array(z.string()).nullable().optional(),
  mutatedMods: z.array(z.string()).nullable().optional(),
  crucibleMods: z.array(z.string()).nullable().optional(),
  cosmeticMods: z.array(z.string()).nullable().optional(),
  veiledMods: z.array(z.string()).nullable().optional(),
  veiled: z.boolean().nullable().optional(),
  desecratedMods: z.array(z.string()).nullable().optional(),
  desecrated: z.boolean().nullable().optional(),
  gemTabs: z.array(GemTab).nullable().optional(),
  gemBackground: z.string().nullable().optional(),
  gemSkill: z.string().nullable().optional(),
  descrText: z.string().nullable().optional(),
  flavourText: z.array(z.string()).nullable().optional(),
  flavourTextNote: z.string().nullable().optional(),
  prophecyText: z.string().nullable().optional(),
  isRelic: z.boolean().nullable().optional(),
  foilVariation: z.int32().nullable().optional(),
  replica: z.boolean().nullable().optional(),
  foreseeing: z.boolean().nullable().optional(),
  incubatedItem: z.object({
    name: z.string(),
    level: z.uint32(),
    progress: z.uint32(),
    total: z.uint32(),
  }).nullable().optional(),
  scourged: z.object({
    tier: z.uint32(),
    level: z.uint32().nullable().optional(),
    progress: z.uint32().nullable().optional(),
    total: z.uint32().nullable().optional(),
  }).nullable().optional(),
  crucible: z.object({
    layout: z.string(),
    nodes: z.record(z.string(), CrucibleNode),
  }).nullable().optional(),
  ruthless: z.boolean().nullable().optional(),
  frameType: FrameType.nullable().optional(),
  artFilename: z.string().nullable().optional(),
  hybrid: z.object({
    isVaalGem: z.boolean().nullable().optional(),
    baseTypeName: z.string(),
    properties: z.array(ItemProperty).nullable().optional(),
    explicitMods: z.array(z.string()).nullable().optional(),
    secDescrText: z.string().nullable().optional(),
  }).nullable().optional(),
  extended: z.object({
    prefixes: z.uint32().nullable().optional(),
    suffixes: z.uint32().nullable().optional(),
  }).nullable().optional(),
  x: z.uint32().nullable().optional(),
  y: z.uint32().nullable().optional(),
  inventoryId: z.string().nullable().optional(),
  socket: z.uint32().nullable().optional(),
  colour: z.string().nullable().optional(),
})
export const PublicStashChange: z.ZodType<PublicStashChange> = z.object({
  id: z.string(),
  public: z.boolean(),
  accountName: z.string().nullable().optional(),
  stash: z.string().nullable().optional(),
  stashType: z.string(),
  league: z.string().nullable().optional(),
  items: z.array(Item),
})
export const PassiveNode: z.ZodType<PassiveNode> = z.object({
  skill: z.uint32().nullable().optional(),
  name: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  isKeystone: z.boolean().nullable().optional(),
  isNotable: z.boolean().nullable().optional(),
  isMastery: z.boolean().nullable().optional(),
  inactiveIcon: z.string().nullable().optional(),
  activeIcon: z.string().nullable().optional(),
  activeEffectImage: z.string().nullable().optional(),
  masteryEffects: z.array(z.object({
    effect: z.uint32(),
    stats: z.array(z.string()),
    reminderText: z.array(z.string()).nullable().optional(),
  })).nullable().optional(),
  isBlighted: z.boolean().nullable().optional(),
  isTattoo: z.boolean().nullable().optional(),
  isProxy: z.boolean().nullable().optional(),
  isJewelSocket: z.boolean().nullable().optional(),
  expansionJewel: z.object({
    size: z.uint32().nullable().optional(),
    index: z.uint32().nullable().optional(),
    proxy: z.uint32().nullable().optional(),
    parent: z.uint32().nullable().optional(),
  }).nullable().optional(),
  recipe: z.array(z.string()).nullable().optional(),
  grantedStrength: z.uint32().nullable().optional(),
  grantedDexterity: z.uint32().nullable().optional(),
  grantedIntelligence: z.uint32().nullable().optional(),
  ascendancyName: z.string().nullable().optional(),
  isAscendancyStart: z.boolean().nullable().optional(),
  isMultipleChoice: z.boolean().nullable().optional(),
  isMultipleChoiceOption: z.boolean().nullable().optional(),
  grantedPassivePoints: z.uint32().nullable().optional(),
  stats: z.array(z.string()).nullable().optional(),
  reminderText: z.array(z.string()).nullable().optional(),
  flavourText: z.array(z.string()).nullable().optional(),
  classStartIndex: z.uint32().nullable().optional(),
  group: z.string().nullable().optional(),
  orbit: z.uint32().nullable().optional(),
  orbitIndex: z.uint32().nullable().optional(),
  out: z.array(z.string()),
  in: z.array(z.string()),
})
export const PassiveGroup: z.ZodType<PassiveGroup> = z.object({
  x: z.float32(),
  y: z.float32(),
  orbits: z.array(z.uint32()),
  isProxy: z.boolean().nullable().optional(),
  proxy: z.string().nullable().optional(),
  nodes: z.array(z.string()),
})
export const ItemJewelData: z.ZodType<ItemJewelData> = z.object({
  type: z.string(),
  radius: z.uint32().nullable().optional(),
  radiusMin: z.uint32().nullable().optional(),
  radiusVisual: z.string().nullable().optional(),
  subgraph: z.object({
    groups: z.record(z.string(), PassiveGroup),
    nodes: z.record(z.string(), PassiveNode),
  }).nullable().optional(),
})
export const Character: z.ZodType<Character> = z.object({
  id: z.string(),
  name: z.string(),
  realm: z.string(),
  class: z.string(),
  league: z.string().nullable().optional(),
  level: z.uint32(),
  experience: z.uint32(),
  ruthless: z.boolean().nullable().optional(),
  expired: z.boolean().nullable().optional(),
  deleted: z.boolean().nullable().optional(),
  current: z.boolean().nullable().optional(),
  equipment: z.array(Item).nullable().optional(),
  skills: z.array(Item).nullable().optional(),
  inventory: z.array(Item).nullable().optional(),
  rucksack: z.array(Item).nullable().optional(),
  jewels: z.array(Item).nullable().optional(),
  passives: z.object({
    hashes: z.array(z.uint32()),
    hashes_ex: z.array(z.uint32()),
    mastery_effects: z.record(z.string(), z.int32()),
    specialisations: z.record(z.string(), z.array(z.int32())),
    skill_overrides: z.record(z.string(), PassiveNode),
    bandit_choice: z.string().nullable().optional(),
    pantheon_major: z.string().nullable().optional(),
    pantheon_minor: z.string().nullable().optional(),
    jewel_data: z.record(z.string(), ItemJewelData),
    quest_stats: z.array(z.string()).nullable().optional(),
    alternate_ascendancy: z.string().nullable().optional(),
  }).nullable().optional(),
  metadata: z.object({
    version: z.string().nullable().optional(),
  }).nullable().optional(),
})
export const StashTab: z.ZodType<StashTab> = z.object({
  id: z.string(),
  parent: z.string().nullable().optional(),
  folder: z.string().nullable().optional(),
  name: z.string(),
  type: z.string(),
  index: z.uint32().nullable().optional(),
  metadata: z.object({
    public: z.boolean().nullable().optional(),
    folder: z.boolean().nullable().optional(),
    colour: z.string().nullable().optional(),
    map: z.record(z.string(), z.any()).nullable().optional(),
  }),
  children: z.array(z.lazy(() => StashTab)).nullable().optional(),
  items: z.array(Item).nullable().optional(),
})
export const LeagueAccount: z.ZodType<LeagueAccount> = z.object({
  atlas_passives: z.object({
    hashes: z.array(z.uint32()),
  }).nullable().optional(),
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
  public: z.boolean().nullable().optional(),
  filter: z.string().nullable().optional(),
  validation: z.object({
    valid: z.boolean(),
    version: z.string().nullable().optional(),
    validated: z.string().nullable().optional(),
  }).nullable().optional(),
})
export const AccountProfileGetProfileResponse: z.ZodType<AccountProfileGetProfileResponse> = z.object({
  uuid: z.string(),
  name: z.string(),
  locale: z.string().nullable().optional(),
  twitch: z.object({
    name: z.string(),
  }).nullable().optional(),
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
  error: ApiError.nullable().optional(),
})
export const LeaguesListLeaguesResponse: z.ZodType<LeaguesListLeaguesResponse> = z.object({
  leagues: z.array(League),
})
export const LeaguesGetLeagueResponse: z.ZodType<LeaguesGetLeagueResponse> = z.object({
  league: League.nullable().optional(),
})
export const LeaguesGetLeagueLadderPoE1OnlyResponse: z.ZodType<LeaguesGetLeagueLadderPoE1OnlyResponse> = z.object({
  league: League,
  ladder: z.object({
    total: z.uint32(),
    cached_since: z.string().nullable().optional(),
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
  match: PvPMatch.nullable().optional(),
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
  character: Character.nullable().optional(),
})
export const AccountStashesPoE1OnlyListStashesResponse: z.ZodType<AccountStashesPoE1OnlyListStashesResponse> = z.object({
  stashes: z.array(StashTab),
})
export const AccountStashesPoE1OnlyGetStashResponse: z.ZodType<AccountStashesPoE1OnlyGetStashResponse> = z.object({
  stash: StashTab.nullable().optional(),
})
export const LeagueAccountsPoE1OnlyGetLeagueAccountResponse: z.ZodType<LeagueAccountsPoE1OnlyGetLeagueAccountResponse> = z.object({
  league_account: LeagueAccount,
})
export const GuildStashesPoE1OnlyListGuildStashesResponse: z.ZodType<GuildStashesPoE1OnlyListGuildStashesResponse> = z.object({
  stashes: z.array(StashTab),
})
export const GuildStashesPoE1OnlyGetGuildStashResponse: z.ZodType<GuildStashesPoE1OnlyGetGuildStashResponse> = z.object({
  stash: StashTab.nullable().optional(),
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


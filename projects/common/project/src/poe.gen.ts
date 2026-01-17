// This file is auto-generated from https://www.pathofexile.com/developer/docs/reference#types



// #region Type Information
// This file is auto-generated from https://www.pathofexile.com/developer/docs/reference#types

import { Type, Expose } from 'class-transformer';
import { IsOptional, ValidateNested, IsArray, IsObject, IsInt, Max, Min, IsNumber, IsString, IsBoolean } from 'class-validator';
import { IsAny } from './is-any.js';
import { Dictionary, IsDictionary, TransformDictionary } from './is-dictionary.js';

/**
 * object LeagueCategory
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LeagueCategory {
  @Expose()
  @IsString()
  id!: string;
  @Expose()
  @IsOptional()
  @IsBoolean()
  current?: boolean;
}
/**
 * object LeagueRule
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LeagueRule {
  @Expose()
  @IsString()
  id!: string;
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsOptional()
  @IsString()
  description?: string;
}
/**
 * object League
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class League {
  @Expose()
  @IsString()
  id!: string;
  @Expose()
  @IsOptional()
  @IsString()
  realm?: string;
  @Expose()
  @IsOptional()
  @IsString()
  name?: string;
  @Expose()
  @IsOptional()
  @IsString()
  description?: string;
  @Expose()
  @IsOptional()
  @Type(() => LeagueCategory)
  @ValidateNested()
  category?: LeagueCategory;
  @Expose()
  @IsOptional()
  @Type(() => LeagueRule)
  @IsArray()
  @ValidateNested({ each: true })
  rules?: LeagueRule[];
  @Expose()
  @IsOptional()
  @IsString()
  registerAt?: string;
  @Expose()
  @IsOptional()
  @IsBoolean()
  event?: boolean;
  @Expose()
  @IsOptional()
  @IsString()
  goal?: string;
  @Expose()
  @IsOptional()
  @IsString()
  url?: string;
  @Expose()
  @IsOptional()
  @IsString()
  startAt?: string;
  @Expose()
  @IsOptional()
  @IsString()
  endAt?: string;
  @Expose()
  @IsOptional()
  @IsBoolean()
  timedEvent?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  scoreEvent?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  delveEvent?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  ancestorEvent?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  leagueEvent?: boolean;
}
/**
 * object LadderEntryCharacterDepth
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LadderEntryCharacterDepth {
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  default?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  solo?: number;
}
/**
 * object LadderEntryCharacter
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LadderEntryCharacter {
  @Expose()
  @IsString()
  id!: string;
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  level!: number;
  @Expose()
  @IsString()
  class!: string;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  time?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  score?: number;
  @Expose()
  @IsOptional()
  @IsObject()
  progress?: Dictionary<object>;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  experience?: number;
  @Expose()
  @IsOptional()
  @Type(() => LadderEntryCharacterDepth)
  @ValidateNested()
  depth?: LadderEntryCharacterDepth;
}
/**
 * object Guild
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class Guild {
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  id!: number;
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsString()
  tag!: string;
}
/**
 * object AccountChallenges
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountChallenges {
  @Expose()
  @IsString()
  set!: string;
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  completed!: number;
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  max!: number;
}
/**
 * object AccountTwitchStream
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountTwitchStream {
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsString()
  image!: string;
  @Expose()
  @IsString()
  status!: string;
}
/**
 * object AccountTwitch
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountTwitch {
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsOptional()
  @Type(() => AccountTwitchStream)
  @ValidateNested()
  stream?: AccountTwitchStream;
}
/**
 * object Account
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class Account {
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsOptional()
  @IsString()
  realm?: string;
  @Expose()
  @IsOptional()
  @Type(() => Guild)
  @ValidateNested()
  guild?: Guild;
  @Expose()
  @IsOptional()
  @Type(() => AccountChallenges)
  @ValidateNested()
  challenges?: AccountChallenges;
  @Expose()
  @IsOptional()
  @Type(() => AccountTwitch)
  @ValidateNested()
  twitch?: AccountTwitch;
}
/**
 * object LadderEntry
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LadderEntry {
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  rank!: number;
  @Expose()
  @IsOptional()
  @IsBoolean()
  dead?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  retired?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  ineligible?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  public?: boolean;
  @Expose()
  @Type(() => LadderEntryCharacter)
  @ValidateNested()
  character!: LadderEntryCharacter;
  @Expose()
  @IsOptional()
  @Type(() => Account)
  @ValidateNested()
  account?: Account;
}
/**
 * object EventLadderEntryPrivate_league
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class EventLadderEntryPrivate_league {
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsString()
  url!: string;
}
/**
 * object EventLadderEntry
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class EventLadderEntry {
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  rank!: number;
  @Expose()
  @IsOptional()
  @IsBoolean()
  ineligible?: boolean;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  time?: number;
  @Expose()
  @Type(() => EventLadderEntryPrivate_league)
  @ValidateNested()
  private_league!: EventLadderEntryPrivate_league;
}
/**
 * object PvPMatch
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PvPMatch {
  @Expose()
  @IsString()
  id!: string;
  @Expose()
  @IsOptional()
  @IsString()
  realm?: string;
  @Expose()
  @IsOptional()
  @IsString()
  startAt?: string;
  @Expose()
  @IsOptional()
  @IsString()
  endAt?: string;
  @Expose()
  @IsOptional()
  @IsString()
  url?: string;
  @Expose()
  @IsString()
  description!: string;
  @Expose()
  @IsBoolean()
  glickoRatings!: boolean;
  @Expose()
  @IsBoolean()
  pvp!: boolean;
  @Expose()
  @IsString()
  style!: string;
  @Expose()
  @IsOptional()
  @IsString()
  registerAt?: string;
  @Expose()
  @IsOptional()
  @IsBoolean()
  complete?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  upcoming?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  inProgress?: boolean;
}
/**
 * object PvPLadderTeamMemberCharacter
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PvPLadderTeamMemberCharacter {
  @Expose()
  @IsString()
  id!: string;
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  level!: number;
  @Expose()
  @IsString()
  class!: string;
  @Expose()
  @IsOptional()
  @IsString()
  league?: string;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  score?: number;
}
/**
 * object PvPLadderTeamMember
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PvPLadderTeamMember {
  @Expose()
  @Type(() => Account)
  @ValidateNested()
  account!: Account;
  @Expose()
  @Type(() => PvPLadderTeamMemberCharacter)
  @ValidateNested()
  character!: PvPLadderTeamMemberCharacter;
  @Expose()
  @IsOptional()
  @IsBoolean()
  public?: boolean;
}
/**
 * object PvPLadderTeamEntry
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PvPLadderTeamEntry {
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  rank!: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  rating?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  points?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  games_played?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  cumulative_opponent_points?: number;
  @Expose()
  @IsOptional()
  @IsString()
  last_game_time?: string;
  @Expose()
  @Type(() => PvPLadderTeamMember)
  @IsArray()
  @ValidateNested({ each: true })
  members!: PvPLadderTeamMember[];
}
/**
 * object ItemSocket
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemSocket {
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  group!: number;
  @Expose()
  @IsOptional()
  @IsString()
  attr?: string;
  @Expose()
  @IsOptional()
  @IsString()
  sColour?: string;
  @Expose()
  @IsOptional()
  @IsString()
  type?: string;
  @Expose()
  @IsOptional()
  @IsString()
  item?: string;
}
/**
 * enum DisplayMode
 * Referenced by ItemProperty→displayMode.
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export enum DisplayMode {
  NameShouldBeFollowedByValues = 0, // Name should be followed by values
  ValuesShouldBeFollowedByName = 1, // Values should be followed by name
  ProgressBar = 2, // Progress bar
  ValuesShouldBeInsertedIntoTheStringByIndex = 3, // Values should be inserted into the string by index
  Separator = 4, // Separator
}
/**
 * object ItemProperty
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemProperty {
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsArray()
  values!: ([string, number])[];
  @Expose()
  @IsOptional()
  displayMode?: DisplayMode;
  @Expose()
  @IsOptional()
  @IsNumber()
  progress?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  type?: number;
  @Expose()
  @IsOptional()
  @IsString()
  suffix?: string;
  @Expose()
  @IsOptional()
  @IsString()
  icon?: string;
}
/**
 * object ItemRewards
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemRewards {
  @Expose()
  @IsString()
  label!: string;
  @Expose()
  @IsDictionary([IsInt(), Max(0x7FFFFFFF), Min(-0x80000000)])
  @Type(() => Dictionary<unknown>)
  rewards!: Dictionary<number>;
}
/**
 * object ItemLogbookModsFaction
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemLogbookModsFaction {
  @Expose()
  @IsString()
  id!: string;
  @Expose()
  @IsString()
  name!: string;
}
/**
 * object ItemLogbookMods
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemLogbookMods {
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @Type(() => ItemLogbookModsFaction)
  @ValidateNested()
  faction!: ItemLogbookModsFaction;
  @Expose()
  @IsArray()
  @IsString({ each: true })
  mods!: string[];
}
/**
 * object ItemUltimatumMods
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemUltimatumMods {
  @Expose()
  @IsString()
  type!: string;
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  tier!: number;
}
/**
 * object GemPage
 * Referenced by GemTab→pages.
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class GemPage {
  /**
   * 
   */
  @Expose()
  @IsOptional()
  @IsString()
  skillName?: string;
  /**
   * 
   */
  @Expose()
  @IsOptional()
  @IsString()
  description?: string;
  /**
   * 
   */
  @Expose()
  @IsOptional()
  @Type(() => ItemProperty)
  @IsArray()
  @ValidateNested({ each: true })
  properties?: ItemProperty[];
  /**
   * 
   */
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stats?: string[];
}
/**
 * object GemTab
 * Referenced by Item→gemTabs.
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class GemTab {
  /**
   * 
   */
  @Expose()
  @IsOptional()
  @IsString()
  name?: string;
  /**
   * 
   */
  @Expose()
  @Type(() => GemPage)
  @IsArray()
  @ValidateNested({ each: true })
  pages!: GemPage[];
}
/**
 * object ItemIncubatedItem
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemIncubatedItem {
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  level!: number;
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  progress!: number;
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  total!: number;
}
/**
 * object ItemScourged
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemScourged {
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  tier!: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  level?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  progress?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  total?: number;
}
/**
 * object CrucibleNode
 * Referenced by Item→crucible.
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class CrucibleNode {
  /**
   * mod hash
   */
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  skill?: number;
  /**
   * mod tier
   */
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  tier?: number;
  /**
   * 
   */
  @Expose()
  @IsOptional()
  @IsString()
  icon?: string;
  /**
   * always true if present
   */
  @Expose()
  @IsOptional()
  @IsBoolean()
  allocated?: boolean;
  /**
   * always true if present
   */
  @Expose()
  @IsOptional()
  @IsBoolean()
  isNotable?: boolean;
  /**
   * always true if present
   */
  @Expose()
  @IsOptional()
  @IsBoolean()
  isReward?: boolean;
  /**
   * stat descriptions
   */
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stats?: string[];
  /**
   * 
   */
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reminderText?: string[];
  /**
   * the column this node occupies
   */
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  orbit?: number;
  /**
   * the node's position within the column
   */
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  orbitIndex?: number;
  /**
   * node identifiers of nodes this one connects to
   */
  @Expose()
  @IsArray()
  @IsString({ each: true })
  out!: string[];
  /**
   * node identifiers of nodes connected to this one
   */
  @Expose()
  @IsArray()
  @IsString({ each: true })
  in!: string[];
}
/**
 * object ItemCrucible
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemCrucible {
  @Expose()
  @IsString()
  layout!: string;
  @Expose()
  @IsDictionary([Type(() => CrucibleNode), ValidateNested()])
  @TransformDictionary(CrucibleNode)
  nodes!: Dictionary<CrucibleNode>;
}
/**
 * enum FrameType
 * Referenced by Item→frameType.
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export enum FrameType {
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
}
/**
 * object ItemHybrid
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemHybrid {
  @Expose()
  @IsOptional()
  @IsBoolean()
  isVaalGem?: boolean;
  @Expose()
  @IsString()
  baseTypeName!: string;
  @Expose()
  @IsOptional()
  @Type(() => ItemProperty)
  @IsArray()
  @ValidateNested({ each: true })
  properties?: ItemProperty[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  explicitMods?: string[];
  @Expose()
  @IsOptional()
  @IsString()
  secDescrText?: string;
}
/**
 * object ItemExtended
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemExtended {
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  prefixes?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  suffixes?: number;
}
/**
 * object Item
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class Item {
  @Expose()
  @IsOptional()
  @IsString()
  realm?: string;
  @Expose()
  @IsBoolean()
  verified!: boolean;
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  w!: number;
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  h!: number;
  @Expose()
  @IsString()
  icon!: string;
  @Expose()
  @IsOptional()
  @IsBoolean()
  support?: boolean;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0x7FFFFFFF)
  @Min(-0x80000000)
  stackSize?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0x7FFFFFFF)
  @Min(-0x80000000)
  maxStackSize?: number;
  @Expose()
  @IsOptional()
  @IsString()
  stackSizeText?: string;
  @Expose()
  @IsOptional()
  @IsString()
  iconTierText?: string;
  @Expose()
  @IsOptional()
  @IsString()
  league?: string;
  @Expose()
  @IsOptional()
  @IsString()
  id?: string;
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gemSockets?: string[];
  @Expose()
  @IsOptional()
  @IsObject()
  influences?: Dictionary<object>;
  @Expose()
  @IsOptional()
  @IsBoolean()
  elder?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  shaper?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  searing?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  tangled?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  memoryItem?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  mutated?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  abyssJewel?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  delve?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  fractured?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  synthesised?: boolean;
  @Expose()
  @IsOptional()
  @Type(() => ItemSocket)
  @IsArray()
  @ValidateNested({ each: true })
  sockets?: ItemSocket[];
  @Expose()
  @IsOptional()
  @Type(() => Item)
  @IsArray()
  @ValidateNested({ each: true })
  socketedItems?: Item[];
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsString()
  typeLine!: string;
  @Expose()
  @IsString()
  baseType!: string;
  @Expose()
  @IsOptional()
  @IsString()
  rarity?: string;
  @Expose()
  @IsBoolean()
  identified!: boolean;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0x7FFFFFFF)
  @Min(-0x80000000)
  itemLevel?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0x7FFFFFFF)
  @Min(-0x80000000)
  unidentifiedTier?: number;
  @Expose()
  @IsInt()
  @Max(0x7FFFFFFF)
  @Min(-0x80000000)
  ilvl!: number;
  @Expose()
  @IsOptional()
  @IsString()
  note?: string;
  @Expose()
  @IsOptional()
  @IsString()
  forum_note?: string;
  @Expose()
  @IsOptional()
  @IsBoolean()
  lockedToCharacter?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  lockedToAccount?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  duplicated?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  split?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  corrupted?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  sanctified?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  unmodifiable?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  unmodifiableExceptChaos?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  cisRaceReward?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  seaRaceReward?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  thRaceReward?: boolean;
  @Expose()
  @IsOptional()
  @Type(() => ItemProperty)
  @IsArray()
  @ValidateNested({ each: true })
  properties?: ItemProperty[];
  @Expose()
  @IsOptional()
  @Type(() => ItemProperty)
  @IsArray()
  @ValidateNested({ each: true })
  notableProperties?: ItemProperty[];
  @Expose()
  @IsOptional()
  @Type(() => ItemProperty)
  @IsArray()
  @ValidateNested({ each: true })
  requirements?: ItemProperty[];
  @Expose()
  @IsOptional()
  @Type(() => ItemProperty)
  @IsArray()
  @ValidateNested({ each: true })
  weaponRequirements?: ItemProperty[];
  @Expose()
  @IsOptional()
  @Type(() => ItemProperty)
  @IsArray()
  @ValidateNested({ each: true })
  supportGemRequirements?: ItemProperty[];
  @Expose()
  @IsOptional()
  @Type(() => ItemProperty)
  @IsArray()
  @ValidateNested({ each: true })
  additionalProperties?: ItemProperty[];
  @Expose()
  @IsOptional()
  @Type(() => ItemProperty)
  @IsArray()
  @ValidateNested({ each: true })
  nextLevelRequirements?: ItemProperty[];
  @Expose()
  @IsOptional()
  @Type(() => ItemProperty)
  @IsArray()
  @ValidateNested({ each: true })
  grantedSkills?: ItemProperty[];
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0x7FFFFFFF)
  @Min(-0x80000000)
  talismanTier?: number;
  @Expose()
  @IsOptional()
  @Type(() => ItemRewards)
  @IsArray()
  @ValidateNested({ each: true })
  rewards?: ItemRewards[];
  @Expose()
  @IsOptional()
  @IsString()
  secDescrText?: string;
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  utilityMods?: string[];
  @Expose()
  @IsOptional()
  @Type(() => ItemLogbookMods)
  @IsArray()
  @ValidateNested({ each: true })
  logbookMods?: ItemLogbookMods[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enchantMods?: string[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  runeMods?: string[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scourgeMods?: string[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  implicitMods?: string[];
  @Expose()
  @IsOptional()
  @Type(() => ItemUltimatumMods)
  @IsArray()
  @ValidateNested({ each: true })
  ultimatumMods?: ItemUltimatumMods[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  explicitMods?: string[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  craftedMods?: string[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fracturedMods?: string[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mutatedMods?: string[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  crucibleMods?: string[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cosmeticMods?: string[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  veiledMods?: string[];
  @Expose()
  @IsOptional()
  @IsBoolean()
  veiled?: boolean;
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  desecratedMods?: string[];
  @Expose()
  @IsOptional()
  @IsBoolean()
  desecrated?: boolean;
  @Expose()
  @IsOptional()
  @Type(() => GemTab)
  @IsArray()
  @ValidateNested({ each: true })
  gemTabs?: GemTab[];
  @Expose()
  @IsOptional()
  @IsString()
  gemBackground?: string;
  @Expose()
  @IsOptional()
  @IsString()
  gemSkill?: string;
  @Expose()
  @IsOptional()
  @IsString()
  descrText?: string;
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flavourText?: string[];
  @Expose()
  @IsOptional()
  @IsString()
  flavourTextNote?: string;
  @Expose()
  @IsOptional()
  @IsString()
  prophecyText?: string;
  @Expose()
  @IsOptional()
  @IsBoolean()
  isRelic?: boolean;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0x7FFFFFFF)
  @Min(-0x80000000)
  foilVariation?: number;
  @Expose()
  @IsOptional()
  @IsBoolean()
  replica?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  foreseeing?: boolean;
  @Expose()
  @IsOptional()
  @Type(() => ItemIncubatedItem)
  @ValidateNested()
  incubatedItem?: ItemIncubatedItem;
  @Expose()
  @IsOptional()
  @Type(() => ItemScourged)
  @ValidateNested()
  scourged?: ItemScourged;
  @Expose()
  @IsOptional()
  @Type(() => ItemCrucible)
  @ValidateNested()
  crucible?: ItemCrucible;
  @Expose()
  @IsOptional()
  @IsBoolean()
  ruthless?: boolean;
  @Expose()
  @IsOptional()
  frameType?: FrameType;
  @Expose()
  @IsOptional()
  @IsString()
  artFilename?: string;
  @Expose()
  @IsOptional()
  @Type(() => ItemHybrid)
  @ValidateNested()
  hybrid?: ItemHybrid;
  @Expose()
  @IsOptional()
  @Type(() => ItemExtended)
  @ValidateNested()
  extended?: ItemExtended;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  x?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  y?: number;
  @Expose()
  @IsOptional()
  @IsString()
  inventoryId?: string;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  socket?: number;
  @Expose()
  @IsOptional()
  @IsString()
  colour?: string;
}
/**
 * object PublicStashChange
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PublicStashChange {
  @Expose()
  @IsString()
  id!: string;
  @Expose()
  @IsBoolean()
  public!: boolean;
  @Expose()
  @IsOptional()
  @IsString()
  accountName?: string;
  @Expose()
  @IsOptional()
  @IsString()
  stash?: string;
  @Expose()
  @IsString()
  stashType!: string;
  @Expose()
  @IsOptional()
  @IsString()
  league?: string;
  @Expose()
  @Type(() => Item)
  @IsArray()
  @ValidateNested({ each: true })
  items!: Item[];
}
/**
 * object PassiveNodeMasteryEffects
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PassiveNodeMasteryEffects {
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  effect!: number;
  @Expose()
  @IsArray()
  @IsString({ each: true })
  stats!: string[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reminderText?: string[];
}
/**
 * object PassiveNodeExpansionJewel
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PassiveNodeExpansionJewel {
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  size?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  index?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  proxy?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  parent?: number;
}
/**
 * object PassiveNode
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PassiveNode {
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  skill?: number;
  @Expose()
  @IsOptional()
  @IsString()
  name?: string;
  @Expose()
  @IsOptional()
  @IsString()
  icon?: string;
  @Expose()
  @IsOptional()
  @IsBoolean()
  isKeystone?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  isNotable?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  isMastery?: boolean;
  @Expose()
  @IsOptional()
  @IsString()
  inactiveIcon?: string;
  @Expose()
  @IsOptional()
  @IsString()
  activeIcon?: string;
  @Expose()
  @IsOptional()
  @IsString()
  activeEffectImage?: string;
  @Expose()
  @IsOptional()
  @Type(() => PassiveNodeMasteryEffects)
  @IsArray()
  @ValidateNested({ each: true })
  masteryEffects?: PassiveNodeMasteryEffects[];
  @Expose()
  @IsOptional()
  @IsBoolean()
  isBlighted?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  isTattoo?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  isProxy?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  isJewelSocket?: boolean;
  @Expose()
  @IsOptional()
  @Type(() => PassiveNodeExpansionJewel)
  @ValidateNested()
  expansionJewel?: PassiveNodeExpansionJewel;
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipe?: string[];
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  grantedStrength?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  grantedDexterity?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  grantedIntelligence?: number;
  @Expose()
  @IsOptional()
  @IsString()
  ascendancyName?: string;
  @Expose()
  @IsOptional()
  @IsBoolean()
  isAscendancyStart?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  isMultipleChoice?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  isMultipleChoiceOption?: boolean;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  grantedPassivePoints?: number;
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stats?: string[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reminderText?: string[];
  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flavourText?: string[];
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  classStartIndex?: number;
  @Expose()
  @IsOptional()
  @IsString()
  group?: string;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  orbit?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  orbitIndex?: number;
  @Expose()
  @IsArray()
  @IsString({ each: true })
  out!: string[];
  @Expose()
  @IsArray()
  @IsString({ each: true })
  in!: string[];
}
/**
 * object PassiveGroup
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PassiveGroup {
  @Expose()
  @IsNumber()
  x!: number;
  @Expose()
  @IsNumber()
  y!: number;
  @Expose()
  @IsArray()
  @IsInt({ each: true })
  @Max(0xFFFFFFFF, { each: true })
  @Min(0, { each: true })
  orbits!: number[];
  @Expose()
  @IsOptional()
  @IsBoolean()
  isProxy?: boolean;
  @Expose()
  @IsOptional()
  @IsString()
  proxy?: string;
  @Expose()
  @IsArray()
  @IsString({ each: true })
  nodes!: string[];
}
/**
 * object ItemJewelDataSubgraph
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemJewelDataSubgraph {
  @Expose()
  @IsDictionary([Type(() => PassiveGroup), ValidateNested()])
  @TransformDictionary(PassiveGroup)
  groups!: Dictionary<PassiveGroup>;
  @Expose()
  @IsDictionary([Type(() => PassiveNode), ValidateNested()])
  @TransformDictionary(PassiveNode)
  nodes!: Dictionary<PassiveNode>;
}
/**
 * object ItemJewelData
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemJewelData {
  @Expose()
  @IsString()
  type!: string;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  radius?: number;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  radiusMin?: number;
  @Expose()
  @IsOptional()
  @IsString()
  radiusVisual?: string;
  @Expose()
  @IsOptional()
  @Type(() => ItemJewelDataSubgraph)
  @ValidateNested()
  subgraph?: ItemJewelDataSubgraph;
}
/**
 * object CharacterPassives
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class CharacterPassives {
  @Expose()
  @IsArray()
  @IsInt({ each: true })
  @Max(0xFFFFFFFF, { each: true })
  @Min(0, { each: true })
  hashes!: number[];
  @Expose()
  @IsArray()
  @IsInt({ each: true })
  @Max(0xFFFFFFFF, { each: true })
  @Min(0, { each: true })
  hashes_ex!: number[];
  @Expose()
  @IsDictionary([IsInt(), Max(0x7FFFFFFF), Min(-0x80000000)])
  @Type(() => Dictionary<unknown>)
  mastery_effects!: Dictionary<number>;
  @Expose()
  @IsDictionary([IsArray(), IsInt({ each: true }), Max(0x7FFFFFFF, { each: true }), Min(-0x80000000, { each: true })])
  @Type(() => Dictionary<unknown>)
  specialisations!: Dictionary<number[]>;
  @Expose()
  @IsDictionary([Type(() => PassiveNode), ValidateNested()])
  @TransformDictionary(PassiveNode)
  skill_overrides!: Dictionary<PassiveNode>;
  @Expose()
  @IsOptional()
  @IsString()
  bandit_choice?: string;
  @Expose()
  @IsOptional()
  @IsString()
  pantheon_major?: string;
  @Expose()
  @IsOptional()
  @IsString()
  pantheon_minor?: string;
  @Expose()
  @IsDictionary([Type(() => ItemJewelData), ValidateNested()])
  @TransformDictionary(ItemJewelData)
  jewel_data!: Dictionary<ItemJewelData>;
  @Expose()
  @IsOptional()
  @IsString()
  alternate_ascendancy?: string;
}
/**
 * object CharacterMetadata
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class CharacterMetadata {
  @Expose()
  @IsOptional()
  @IsString()
  version?: string;
}
/**
 * object Character
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class Character {
  @Expose()
  @IsString()
  id!: string;
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsString()
  realm!: string;
  @Expose()
  @IsString()
  class!: string;
  @Expose()
  @IsOptional()
  @IsString()
  league?: string;
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  level!: number;
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  experience!: number;
  @Expose()
  @IsOptional()
  @IsBoolean()
  ruthless?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  expired?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  deleted?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  current?: boolean;
  @Expose()
  @IsOptional()
  @Type(() => Item)
  @IsArray()
  @ValidateNested({ each: true })
  equipment?: Item[];
  @Expose()
  @IsOptional()
  @Type(() => Item)
  @IsArray()
  @ValidateNested({ each: true })
  skills?: Item[];
  @Expose()
  @IsOptional()
  @Type(() => Item)
  @IsArray()
  @ValidateNested({ each: true })
  inventory?: Item[];
  @Expose()
  @IsOptional()
  @Type(() => Item)
  @IsArray()
  @ValidateNested({ each: true })
  rucksack?: Item[];
  @Expose()
  @IsOptional()
  @Type(() => Item)
  @IsArray()
  @ValidateNested({ each: true })
  jewels?: Item[];
  @Expose()
  @IsOptional()
  @Type(() => CharacterPassives)
  @ValidateNested()
  passives?: CharacterPassives;
  @Expose()
  @IsOptional()
  @Type(() => CharacterMetadata)
  @ValidateNested()
  metadata?: CharacterMetadata;
}
/**
 * object StashTabMetadata
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class StashTabMetadata {
  @Expose()
  @IsOptional()
  @IsBoolean()
  public?: boolean;
  @Expose()
  @IsOptional()
  @IsBoolean()
  folder?: boolean;
  @Expose()
  @IsOptional()
  @IsString()
  colour?: string;
  @Expose()
  @IsOptional()
  @IsObject()
  map?: Dictionary<object>;
}
/**
 * object StashTab
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class StashTab {
  @Expose()
  @IsString()
  id!: string;
  @Expose()
  @IsOptional()
  @IsString()
  parent?: string;
  @Expose()
  @IsOptional()
  @IsString()
  folder?: string;
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsString()
  type!: string;
  @Expose()
  @IsOptional()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  index?: number;
  @Expose()
  @Type(() => StashTabMetadata)
  @ValidateNested()
  metadata!: StashTabMetadata;
  @Expose()
  @IsOptional()
  @Type(() => StashTab)
  @IsArray()
  @ValidateNested({ each: true })
  children?: StashTab[];
  @Expose()
  @IsOptional()
  @Type(() => Item)
  @IsArray()
  @ValidateNested({ each: true })
  items?: Item[];
}
/**
 * object LeagueAccountAtlas_passives
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LeagueAccountAtlas_passives {
  @Expose()
  @IsArray()
  @IsInt({ each: true })
  @Max(0xFFFFFFFF, { each: true })
  @Min(0, { each: true })
  hashes!: number[];
}
/**
 * object LeagueAccountAtlas_passive_trees
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LeagueAccountAtlas_passive_trees {
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsArray()
  @IsInt({ each: true })
  @Max(0xFFFFFFFF, { each: true })
  @Min(0, { each: true })
  hashes!: number[];
}
/**
 * object LeagueAccount
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LeagueAccount {
  @Expose()
  @IsOptional()
  @Type(() => LeagueAccountAtlas_passives)
  @ValidateNested()
  atlas_passives?: LeagueAccountAtlas_passives;
  @Expose()
  @Type(() => LeagueAccountAtlas_passive_trees)
  @IsArray()
  @ValidateNested({ each: true })
  atlas_passive_trees!: LeagueAccountAtlas_passive_trees[];
}
/**
 * object ItemFilterValidation
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemFilterValidation {
  @Expose()
  @IsBoolean()
  valid!: boolean;
  @Expose()
  @IsOptional()
  @IsString()
  version?: string;
  @Expose()
  @IsOptional()
  @IsString()
  validated?: string;
}
/**
 * object ItemFilter
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class ItemFilter {
  @Expose()
  @IsString()
  id!: string;
  @Expose()
  @IsString()
  filter_name!: string;
  @Expose()
  @IsString()
  realm!: string;
  @Expose()
  @IsString()
  description!: string;
  @Expose()
  @IsString()
  version!: string;
  @Expose()
  @IsString()
  type!: string;
  @Expose()
  @IsOptional()
  @IsBoolean()
  public?: boolean;
  @Expose()
  @IsOptional()
  @IsString()
  filter?: string;
  @Expose()
  @IsOptional()
  @Type(() => ItemFilterValidation)
  @ValidateNested()
  validation?: ItemFilterValidation;
}
/**
 * object AccountProfileGetProfileResponseTwitch
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountProfileGetProfileResponseTwitch {
  @Expose()
  @IsString()
  name!: string;
}
/**
 * object AccountProfileGetProfileResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountProfileGetProfileResponse {
  @Expose()
  @IsString()
  uuid!: string;
  @Expose()
  @IsString()
  name!: string;
  @Expose()
  @IsOptional()
  @IsString()
  locale?: string;
  @Expose()
  @IsOptional()
  @Type(() => AccountProfileGetProfileResponseTwitch)
  @ValidateNested()
  twitch?: AccountProfileGetProfileResponseTwitch;
}
/**
 * object AccountItemFiltersGetItemFiltersResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountItemFiltersGetItemFiltersResponse {
  @Expose()
  @Type(() => ItemFilter)
  @IsArray()
  @ValidateNested({ each: true })
  filters!: ItemFilter[];
}
/**
 * object AccountItemFiltersGetItemFilterResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountItemFiltersGetItemFilterResponse {
  @Expose()
  @Type(() => ItemFilter)
  @ValidateNested()
  filter!: ItemFilter;
}
/**
 * object AccountItemFiltersCreateItemFilterResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountItemFiltersCreateItemFilterResponse {
  @Expose()
  @Type(() => ItemFilter)
  @ValidateNested()
  filter!: ItemFilter;
}
/**
 * object AccountItemFiltersUpdateItemFilterResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountItemFiltersUpdateItemFilterResponse {
  @Expose()
  @Type(() => ItemFilter)
  @ValidateNested()
  filter!: ItemFilter;
  @Expose()
  @IsOptional()
  @Type(() => Error)
  @ValidateNested()
  error?: Error;
}
/**
 * object LeaguesListLeaguesResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LeaguesListLeaguesResponse {
  @Expose()
  @Type(() => League)
  @IsArray()
  @ValidateNested({ each: true })
  leagues!: League[];
}
/**
 * object LeaguesGetLeagueResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LeaguesGetLeagueResponse {
  @Expose()
  @IsOptional()
  @Type(() => League)
  @ValidateNested()
  league?: League;
}
/**
 * object LeaguesGetLeagueLadderPoE1OnlyResponseLadder
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LeaguesGetLeagueLadderPoE1OnlyResponseLadder {
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  total!: number;
  @Expose()
  @IsOptional()
  @IsString()
  cached_since?: string;
  @Expose()
  @Type(() => LadderEntry)
  @IsArray()
  @ValidateNested({ each: true })
  entries!: LadderEntry[];
}
/**
 * object LeaguesGetLeagueLadderPoE1OnlyResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LeaguesGetLeagueLadderPoE1OnlyResponse {
  @Expose()
  @Type(() => League)
  @ValidateNested()
  league!: League;
  @Expose()
  @Type(() => LeaguesGetLeagueLadderPoE1OnlyResponseLadder)
  @ValidateNested()
  ladder!: LeaguesGetLeagueLadderPoE1OnlyResponseLadder;
}
/**
 * object LeaguesGetLeagueEventLadderPoE1OnlyResponseLadder
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LeaguesGetLeagueEventLadderPoE1OnlyResponseLadder {
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  total!: number;
  @Expose()
  @Type(() => EventLadderEntry)
  @IsArray()
  @ValidateNested({ each: true })
  entries!: EventLadderEntry[];
}
/**
 * object LeaguesGetLeagueEventLadderPoE1OnlyResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LeaguesGetLeagueEventLadderPoE1OnlyResponse {
  @Expose()
  @Type(() => League)
  @ValidateNested()
  league!: League;
  @Expose()
  @Type(() => LeaguesGetLeagueEventLadderPoE1OnlyResponseLadder)
  @ValidateNested()
  ladder!: LeaguesGetLeagueEventLadderPoE1OnlyResponseLadder;
}
/**
 * object PvPMatchesPoE1OnlyListPvPMatchesResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PvPMatchesPoE1OnlyListPvPMatchesResponse {
  @Expose()
  @Type(() => PvPMatch)
  @IsArray()
  @ValidateNested({ each: true })
  matches!: PvPMatch[];
}
/**
 * object PvPMatchesPoE1OnlyGetPvPMatchResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PvPMatchesPoE1OnlyGetPvPMatchResponse {
  @Expose()
  @IsOptional()
  @Type(() => PvPMatch)
  @ValidateNested()
  match?: PvPMatch;
}
/**
 * object PvPMatchesPoE1OnlyGetPvPMatchLadderResponseLadder
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PvPMatchesPoE1OnlyGetPvPMatchLadderResponseLadder {
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  total!: number;
  @Expose()
  @Type(() => PvPLadderTeamEntry)
  @IsArray()
  @ValidateNested({ each: true })
  entries!: PvPLadderTeamEntry[];
}
/**
 * object PvPMatchesPoE1OnlyGetPvPMatchLadderResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PvPMatchesPoE1OnlyGetPvPMatchLadderResponse {
  @Expose()
  @Type(() => PvPMatch)
  @ValidateNested()
  match!: PvPMatch;
  @Expose()
  @Type(() => PvPMatchesPoE1OnlyGetPvPMatchLadderResponseLadder)
  @ValidateNested()
  ladder!: PvPMatchesPoE1OnlyGetPvPMatchLadderResponseLadder;
}
/**
 * object AccountLeaguesPoE1OnlyGetLeaguesResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountLeaguesPoE1OnlyGetLeaguesResponse {
  @Expose()
  @Type(() => League)
  @IsArray()
  @ValidateNested({ each: true })
  leagues!: League[];
}
/**
 * object AccountCharactersListCharactersResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountCharactersListCharactersResponse {
  @Expose()
  @Type(() => Character)
  @IsArray()
  @ValidateNested({ each: true })
  characters!: Character[];
}
/**
 * object AccountCharactersGetCharacterResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountCharactersGetCharacterResponse {
  @Expose()
  @IsOptional()
  @Type(() => Character)
  @ValidateNested()
  character?: Character;
}
/**
 * object AccountStashesPoE1OnlyListStashesResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountStashesPoE1OnlyListStashesResponse {
  @Expose()
  @Type(() => StashTab)
  @IsArray()
  @ValidateNested({ each: true })
  stashes!: StashTab[];
}
/**
 * object AccountStashesPoE1OnlyGetStashResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class AccountStashesPoE1OnlyGetStashResponse {
  @Expose()
  @IsOptional()
  @Type(() => StashTab)
  @ValidateNested()
  stash?: StashTab;
}
/**
 * object LeagueAccountsPoE1OnlyGetLeagueAccountResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class LeagueAccountsPoE1OnlyGetLeagueAccountResponse {
  @Expose()
  @Type(() => LeagueAccount)
  @ValidateNested()
  league_account!: LeagueAccount;
}
/**
 * object GuildStashesPoE1OnlyListGuildStashesResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class GuildStashesPoE1OnlyListGuildStashesResponse {
  @Expose()
  @Type(() => StashTab)
  @IsArray()
  @ValidateNested({ each: true })
  stashes!: StashTab[];
}
/**
 * object GuildStashesPoE1OnlyGetGuildStashResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class GuildStashesPoE1OnlyGetGuildStashResponse {
  @Expose()
  @IsOptional()
  @Type(() => StashTab)
  @ValidateNested()
  stash?: StashTab;
}
/**
 * object PublicStashesPoE1OnlyGetPublicStashesResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class PublicStashesPoE1OnlyGetPublicStashesResponse {
  @Expose()
  @IsString()
  next_change_id!: string;
  @Expose()
  @Type(() => PublicStashChange)
  @IsArray()
  @ValidateNested({ each: true })
  stashes!: PublicStashChange[];
}
/**
 * object CurrencyExchangeGetExchangeMarketsResponseMarkets
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class CurrencyExchangeGetExchangeMarketsResponseMarkets {
  @Expose()
  @IsString()
  league!: string;
  @Expose()
  @IsString()
  market_id!: string;
  @Expose()
  @IsDictionary([IsInt(), Max(0xFFFFFFFF), Min(0)])
  @Type(() => Dictionary<unknown>)
  volume_traded!: Dictionary<number>;
  @Expose()
  @IsDictionary([IsInt(), Max(0xFFFFFFFF), Min(0)])
  @Type(() => Dictionary<unknown>)
  lowest_stock!: Dictionary<number>;
  @Expose()
  @IsDictionary([IsInt(), Max(0xFFFFFFFF), Min(0)])
  @Type(() => Dictionary<unknown>)
  highest_stock!: Dictionary<number>;
  @Expose()
  @IsDictionary([IsInt(), Max(0xFFFFFFFF), Min(0)])
  @Type(() => Dictionary<unknown>)
  lowest_ratio!: Dictionary<number>;
  @Expose()
  @IsDictionary([IsInt(), Max(0xFFFFFFFF), Min(0)])
  @Type(() => Dictionary<unknown>)
  highest_ratio!: Dictionary<number>;
}
/**
 * object CurrencyExchangeGetExchangeMarketsResponse
 * Generated from https://www.pathofexile.com/developer/docs/reference#types
 */
export class CurrencyExchangeGetExchangeMarketsResponse {
  @Expose()
  @IsInt()
  @Max(0xFFFFFFFF)
  @Min(0)
  next_change_id!: number;
  @Expose()
  @Type(() => CurrencyExchangeGetExchangeMarketsResponseMarkets)
  @IsArray()
  @ValidateNested({ each: true })
  markets!: CurrencyExchangeGetExchangeMarketsResponseMarkets[];
}


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


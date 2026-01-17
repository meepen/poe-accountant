// This file is auto-generated from https://www.pathofexile.com/developer/docs/reference#types

import { serverApiPaths } from "./poe.gen.js";

export abstract class PoeApi {
  protected abstract request<T>(endpointData: typeof serverApiPaths[keyof typeof serverApiPaths], path: string, postData?: FormData): Promise<T>;
// #region Account Profile
  public async getProfile(): Promise<(typeof serverApiPaths)["Get Profile"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get Profile"]['responseType']>(
      serverApiPaths["Get Profile"],
      `/profile`
    );
  }
// #endregion Account Profile

// #region Account Item Filters
  public async getItemFilters(): Promise<(typeof serverApiPaths)["Get Item Filters"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get Item Filters"]['responseType']>(
      serverApiPaths["Get Item Filters"],
      `/item-filter`
    );
  }
  public async getItemFilter(id: string): Promise<(typeof serverApiPaths)["Get Item Filter"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get Item Filter"]['responseType']>(
      serverApiPaths["Get Item Filter"],
      `/item-filter/${id}`
    );
  }
  public async createItemFilter(): Promise<(typeof serverApiPaths)["Create Item Filter"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Create Item Filter"]['responseType']>(
      serverApiPaths["Create Item Filter"],
      `/item-filter`
    );
  }
  public async updateItemFilter(id: string): Promise<(typeof serverApiPaths)["Update Item Filter"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Update Item Filter"]['responseType']>(
      serverApiPaths["Update Item Filter"],
      `/item-filter/${id}`
    );
  }
// #endregion Account Item Filters

// #region Leagues
  public async listLeagues(): Promise<(typeof serverApiPaths)["List Leagues"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["List Leagues"]['responseType']>(
      serverApiPaths["List Leagues"],
      `/league`
    );
  }
  public async getLeague(league: string): Promise<(typeof serverApiPaths)["Get League"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get League"]['responseType']>(
      serverApiPaths["Get League"],
      `/league/${league}`
    );
  }
  public async getLeagueLadderPoE1Only(league: string): Promise<(typeof serverApiPaths)["Get League Ladder (PoE1 only)"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get League Ladder (PoE1 only)"]['responseType']>(
      serverApiPaths["Get League Ladder (PoE1 only)"],
      `/league/${league}/ladder`
    );
  }
  public async getLeagueEventLadderPoE1Only(league: string): Promise<(typeof serverApiPaths)["Get League Event Ladder (PoE1 only)"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get League Event Ladder (PoE1 only)"]['responseType']>(
      serverApiPaths["Get League Event Ladder (PoE1 only)"],
      `/league/${league}/event-ladder`
    );
  }
// #endregion Leagues

// #region PvP Matches (PoE1 only)
  public async listPvPMatches(): Promise<(typeof serverApiPaths)["List PvP Matches"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["List PvP Matches"]['responseType']>(
      serverApiPaths["List PvP Matches"],
      `/pvp-match`
    );
  }
  public async getPvPMatch(match: string): Promise<(typeof serverApiPaths)["Get PvP Match"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get PvP Match"]['responseType']>(
      serverApiPaths["Get PvP Match"],
      `/pvp-match/${match}`
    );
  }
  public async getPvPMatchLadder(match: string): Promise<(typeof serverApiPaths)["Get PvP Match Ladder"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get PvP Match Ladder"]['responseType']>(
      serverApiPaths["Get PvP Match Ladder"],
      `/pvp-match/${match}/ladder`
    );
  }
// #endregion PvP Matches (PoE1 only)

// #region Account Leagues (PoE1 only)
  public async getLeagues(realm?: string): Promise<(typeof serverApiPaths)["Get Leagues"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get Leagues"]['responseType']>(
      serverApiPaths["Get Leagues"],
      `/account/leagues${realm ? `/${realm}` : ''}`
    );
  }
// #endregion Account Leagues (PoE1 only)

// #region Account Characters
  public async listCharacters(realm?: string): Promise<(typeof serverApiPaths)["List Characters"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["List Characters"]['responseType']>(
      serverApiPaths["List Characters"],
      `/character${realm ? `/${realm}` : ''}`
    );
  }
  public async getCharacter(name: string, realm?: string): Promise<(typeof serverApiPaths)["Get Character"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get Character"]['responseType']>(
      serverApiPaths["Get Character"],
      `/character${realm ? `/${realm}` : ''}/${name}`
    );
  }
// #endregion Account Characters

// #region Account Stashes (PoE1 only)
  public async listStashes(league: string, realm?: string): Promise<(typeof serverApiPaths)["List Stashes"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["List Stashes"]['responseType']>(
      serverApiPaths["List Stashes"],
      `/stash${realm ? `/${realm}` : ''}/${league}`
    );
  }
  public async getStash(league: string, stash_id: string, realm?: string, substash_id?: string): Promise<(typeof serverApiPaths)["Get Stash"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get Stash"]['responseType']>(
      serverApiPaths["Get Stash"],
      `/stash${realm ? `/${realm}` : ''}/${league}/${stash_id}${substash_id ? `/${substash_id}` : ''}`
    );
  }
// #endregion Account Stashes (PoE1 only)

// #region League Accounts (PoE1 only)
  public async getLeagueAccount(league: string, realm?: string): Promise<(typeof serverApiPaths)["Get League Account"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get League Account"]['responseType']>(
      serverApiPaths["Get League Account"],
      `/league-account${realm ? `/${realm}` : ''}/${league}`
    );
  }
// #endregion League Accounts (PoE1 only)

// #region Guild Stashes (PoE1 only)
  public async listGuildStashes(league: string, realm?: string): Promise<(typeof serverApiPaths)["List Guild Stashes"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["List Guild Stashes"]['responseType']>(
      serverApiPaths["List Guild Stashes"],
      `/guild${realm ? `/${realm}` : ''}/stash/${league}`
    );
  }
  public async getGuildStash(league: string, stash_id: string, realm?: string, substash_id?: string): Promise<(typeof serverApiPaths)["Get Guild Stash"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get Guild Stash"]['responseType']>(
      serverApiPaths["Get Guild Stash"],
      `/guild${realm ? `/${realm}` : ''}/stash/${league}/${stash_id}${substash_id ? `/${substash_id}` : ''}`
    );
  }
// #endregion Guild Stashes (PoE1 only)

// #region Public Stashes (PoE1 only)
  public async getPublicStashes(realm?: string): Promise<(typeof serverApiPaths)["Get Public Stashes"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get Public Stashes"]['responseType']>(
      serverApiPaths["Get Public Stashes"],
      `/public-stash-tabs${realm ? `/${realm}` : ''}`
    );
  }
// #endregion Public Stashes (PoE1 only)

// #region Currency Exchange
  public async getExchangeMarkets(realm?: string, id?: string): Promise<(typeof serverApiPaths)["Get Exchange Markets"]["responseType"]> {
    return await this.request<(typeof serverApiPaths)["Get Exchange Markets"]['responseType']>(
      serverApiPaths["Get Exchange Markets"],
      `/currency-exchange${realm ? `/${realm}` : ''}${id ? `/${id}` : ''}`
    );
  }
// #endregion Currency Exchange

}

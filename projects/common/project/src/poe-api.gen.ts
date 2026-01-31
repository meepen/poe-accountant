// This file is auto-generated from https://www.pathofexile.com/developer/docs/reference

import { serverApiPaths, serverEndpoint } from "./poe.gen.js";
import { z } from "zod";


export type ServerApi = typeof serverApiPaths[keyof typeof serverApiPaths];

export abstract class PoeApi {
  protected fetch(endpointData: ServerApi, endpoint: URL, options: RequestInit & { body: string | undefined }): Promise<Response> {
    return fetch(endpoint, options);  
  }
  protected abstract authenticate(endpointData: ServerApi): Promise<string> | string | Promise<void> | void;
  protected abstract voidAuthentication(endpointData: ServerApi): Promise<void> | void;
  protected abstract get userAgent(): string;

  protected async request<T>(
    endpointData: ServerApi,
    path: string,
    postData?: FormData,
    attempts = 0,
  ): Promise<T> {
    const authorizationToken = await this.authenticate(endpointData);

    const response = await this.fetch(
      endpointData,
      new URL(path, serverEndpoint),
      {
        method: endpointData.method,
        headers: {
          "Accept": "application/json",
          "User-Agent": this.userAgent,
          ...(authorizationToken
            ? { "Authorization": `Bearer ${authorizationToken}` }
            : {}),
        },
        body: postData?.toString() ?? undefined,
      },
    );

    if (!response.ok) {
      // Check status, if it's 401 then we need to reauthenticate and try again.
      switch (response.status) {
        case 401:
          if (attempts < 1) {
            await this.voidAuthentication(endpointData);
            return this.request<T>(
              endpointData,
              path,
              postData,
              attempts + 1,
            );
          }
          break;
        case 403:
          // If it's 403, the resource requires a different scope than provided.
          throw new Error("API request forbidden: missing required scope");
        // 429 is handled inside of `fetch` or otherwise passed onto the caller.
        default:
          break;
      }

      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`,
      );
    }

    return (endpointData.responseType.parse(await response.json()) as T);
  }
// #region Account Profile
  public async getProfile(args: void): Promise<z.infer<(typeof serverApiPaths)["Get Profile"]["responseType"]>> {
    
    return await this.request<z.infer<(typeof serverApiPaths)["Get Profile"]['responseType']>>(
      serverApiPaths["Get Profile"],
      `/profile`
    );
  }
// #endregion Account Profile

// #region Account Item Filters
  public async getItemFilters(args: { validate?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get Item Filters"]["responseType"]>> {
    // Query Parameters: validate
    const queryParams = new URLSearchParams();
    if (args.validate !== undefined && args.validate !== null) {
      queryParams.append("validate", args.validate as string);
    }
    return await this.request<z.infer<(typeof serverApiPaths)["Get Item Filters"]['responseType']>>(
      serverApiPaths["Get Item Filters"],
      `/item-filter` + `?` + queryParams.toString()
    );
  }
  public async getItemFilter(args: { id: string; validate?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get Item Filter"]["responseType"]>> {
    // Query Parameters: validate
    const queryParams = new URLSearchParams();
    if (args.validate !== undefined && args.validate !== null) {
      queryParams.append("validate", args.validate as string);
    }
    return await this.request<z.infer<(typeof serverApiPaths)["Get Item Filter"]['responseType']>>(
      serverApiPaths["Get Item Filter"],
      `/item-filter/${args.id}` + `?` + queryParams.toString()
    );
  }
  public async createItemFilter(args: { validate?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Create Item Filter"]["responseType"]>> {
    // Query Parameters: validate
    const queryParams = new URLSearchParams();
    if (args.validate !== undefined && args.validate !== null) {
      queryParams.append("validate", args.validate as string);
    }
    return await this.request<z.infer<(typeof serverApiPaths)["Create Item Filter"]['responseType']>>(
      serverApiPaths["Create Item Filter"],
      `/item-filter` + `?` + queryParams.toString()
    );
  }
  public async updateItemFilter(args: { id: string; validate?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Update Item Filter"]["responseType"]>> {
    // Query Parameters: validate
    const queryParams = new URLSearchParams();
    if (args.validate !== undefined && args.validate !== null) {
      queryParams.append("validate", args.validate as string);
    }
    return await this.request<z.infer<(typeof serverApiPaths)["Update Item Filter"]['responseType']>>(
      serverApiPaths["Update Item Filter"],
      `/item-filter/${args.id}` + `?` + queryParams.toString()
    );
  }
// #endregion Account Item Filters

// #region Leagues
  public async listLeagues(args: { realm?: string | null; type?: string | null; season?: string | null; limit?: string | null; offset?: string | null }): Promise<z.infer<(typeof serverApiPaths)["List Leagues"]["responseType"]>> {
    // Query Parameters: realm, type, season, limit, offset
    const queryParams = new URLSearchParams();
    if (args.realm !== undefined && args.realm !== null) {
      queryParams.append("realm", args.realm as string);
    }
    if (args.type !== undefined && args.type !== null) {
      queryParams.append("type", args.type as string);
    }
    if (args.season !== undefined && args.season !== null) {
      queryParams.append("season", args.season as string);
    }
    if (args.limit !== undefined && args.limit !== null) {
      queryParams.append("limit", args.limit as string);
    }
    if (args.offset !== undefined && args.offset !== null) {
      queryParams.append("offset", args.offset as string);
    }
    return await this.request<z.infer<(typeof serverApiPaths)["List Leagues"]['responseType']>>(
      serverApiPaths["List Leagues"],
      `/league` + `?` + queryParams.toString()
    );
  }
  public async getLeague(args: { league: string; realm?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get League"]["responseType"]>> {
    // Query Parameters: realm
    const queryParams = new URLSearchParams();
    if (args.realm !== undefined && args.realm !== null) {
      queryParams.append("realm", args.realm as string);
    }
    return await this.request<z.infer<(typeof serverApiPaths)["Get League"]['responseType']>>(
      serverApiPaths["Get League"],
      `/league/${args.league}` + `?` + queryParams.toString()
    );
  }
  public async getLeagueLadderPoE1Only(args: { league: string; realm?: string | null; sort?: string | null; class?: string | null; limit?: string | null; offset?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get League Ladder (PoE1 only)"]["responseType"]>> {
    // Query Parameters: realm, sort, class, limit, offset
    const queryParams = new URLSearchParams();
    if (args.realm !== undefined && args.realm !== null) {
      queryParams.append("realm", args.realm as string);
    }
    if (args.sort !== undefined && args.sort !== null) {
      queryParams.append("sort", args.sort as string);
    }
    if (args.class !== undefined && args.class !== null) {
      queryParams.append("class", args.class as string);
    }
    if (args.limit !== undefined && args.limit !== null) {
      queryParams.append("limit", args.limit as string);
    }
    if (args.offset !== undefined && args.offset !== null) {
      queryParams.append("offset", args.offset as string);
    }
    return await this.request<z.infer<(typeof serverApiPaths)["Get League Ladder (PoE1 only)"]['responseType']>>(
      serverApiPaths["Get League Ladder (PoE1 only)"],
      `/league/${args.league}/ladder` + `?` + queryParams.toString()
    );
  }
  public async getLeagueEventLadderPoE1Only(args: { league: string; realm?: string | null; limit?: string | null; offset?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get League Event Ladder (PoE1 only)"]["responseType"]>> {
    // Query Parameters: realm, limit, offset
    const queryParams = new URLSearchParams();
    if (args.realm !== undefined && args.realm !== null) {
      queryParams.append("realm", args.realm as string);
    }
    if (args.limit !== undefined && args.limit !== null) {
      queryParams.append("limit", args.limit as string);
    }
    if (args.offset !== undefined && args.offset !== null) {
      queryParams.append("offset", args.offset as string);
    }
    return await this.request<z.infer<(typeof serverApiPaths)["Get League Event Ladder (PoE1 only)"]['responseType']>>(
      serverApiPaths["Get League Event Ladder (PoE1 only)"],
      `/league/${args.league}/event-ladder` + `?` + queryParams.toString()
    );
  }
// #endregion Leagues

// #region PvP Matches (PoE1 only)
  public async listPvPMatches(args: { realm?: string | null; type?: string | null; season?: string | null; league?: string | null }): Promise<z.infer<(typeof serverApiPaths)["List PvP Matches"]["responseType"]>> {
    // Query Parameters: realm, type, season, league
    const queryParams = new URLSearchParams();
    if (args.realm !== undefined && args.realm !== null) {
      queryParams.append("realm", args.realm as string);
    }
    if (args.type !== undefined && args.type !== null) {
      queryParams.append("type", args.type as string);
    }
    if (args.season !== undefined && args.season !== null) {
      queryParams.append("season", args.season as string);
    }
    if (args.league !== undefined && args.league !== null) {
      queryParams.append("league", args.league as string);
    }
    return await this.request<z.infer<(typeof serverApiPaths)["List PvP Matches"]['responseType']>>(
      serverApiPaths["List PvP Matches"],
      `/pvp-match` + `?` + queryParams.toString()
    );
  }
  public async getPvPMatch(args: { match: string; realm?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get PvP Match"]["responseType"]>> {
    // Query Parameters: realm
    const queryParams = new URLSearchParams();
    if (args.realm !== undefined && args.realm !== null) {
      queryParams.append("realm", args.realm as string);
    }
    return await this.request<z.infer<(typeof serverApiPaths)["Get PvP Match"]['responseType']>>(
      serverApiPaths["Get PvP Match"],
      `/pvp-match/${args.match}` + `?` + queryParams.toString()
    );
  }
  public async getPvPMatchLadder(args: { match: string; realm?: string | null; limit?: string | null; offset?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get PvP Match Ladder"]["responseType"]>> {
    // Query Parameters: realm, limit, offset
    const queryParams = new URLSearchParams();
    if (args.realm !== undefined && args.realm !== null) {
      queryParams.append("realm", args.realm as string);
    }
    if (args.limit !== undefined && args.limit !== null) {
      queryParams.append("limit", args.limit as string);
    }
    if (args.offset !== undefined && args.offset !== null) {
      queryParams.append("offset", args.offset as string);
    }
    return await this.request<z.infer<(typeof serverApiPaths)["Get PvP Match Ladder"]['responseType']>>(
      serverApiPaths["Get PvP Match Ladder"],
      `/pvp-match/${args.match}/ladder` + `?` + queryParams.toString()
    );
  }
// #endregion PvP Matches (PoE1 only)

// #region Account Leagues (PoE1 only)
  public async getLeagues(args: { realm?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get Leagues"]["responseType"]>> {
    
    return await this.request<z.infer<(typeof serverApiPaths)["Get Leagues"]['responseType']>>(
      serverApiPaths["Get Leagues"],
      `/account/leagues${args.realm && args.realm !== 'pc' ? `/${args.realm}` : ''}`
    );
  }
// #endregion Account Leagues (PoE1 only)

// #region Account Characters
  public async listCharacters(args: { realm?: string | null }): Promise<z.infer<(typeof serverApiPaths)["List Characters"]["responseType"]>> {
    
    return await this.request<z.infer<(typeof serverApiPaths)["List Characters"]['responseType']>>(
      serverApiPaths["List Characters"],
      `/character${args.realm && args.realm !== 'pc' ? `/${args.realm}` : ''}`
    );
  }
  public async getCharacter(args: { name: string; realm?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get Character"]["responseType"]>> {
    
    return await this.request<z.infer<(typeof serverApiPaths)["Get Character"]['responseType']>>(
      serverApiPaths["Get Character"],
      `/character${args.realm && args.realm !== 'pc' ? `/${args.realm}` : ''}/${args.name}`
    );
  }
// #endregion Account Characters

// #region Account Stashes (PoE1 only)
  public async listStashes(args: { league: string; realm?: string | null }): Promise<z.infer<(typeof serverApiPaths)["List Stashes"]["responseType"]>> {
    
    return await this.request<z.infer<(typeof serverApiPaths)["List Stashes"]['responseType']>>(
      serverApiPaths["List Stashes"],
      `/stash${args.realm && args.realm !== 'pc' ? `/${args.realm}` : ''}/${args.league}`
    );
  }
  public async getStash(args: { league: string; stash_id: string; realm?: string | null; substash_id?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get Stash"]["responseType"]>> {
    
    return await this.request<z.infer<(typeof serverApiPaths)["Get Stash"]['responseType']>>(
      serverApiPaths["Get Stash"],
      `/stash${args.realm && args.realm !== 'pc' ? `/${args.realm}` : ''}/${args.league}/${args.stash_id}${args.substash_id ? `/${args.substash_id}` : ''}`
    );
  }
// #endregion Account Stashes (PoE1 only)

// #region League Accounts (PoE1 only)
  public async getLeagueAccount(args: { league: string; realm?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get League Account"]["responseType"]>> {
    
    return await this.request<z.infer<(typeof serverApiPaths)["Get League Account"]['responseType']>>(
      serverApiPaths["Get League Account"],
      `/league-account${args.realm && args.realm !== 'pc' ? `/${args.realm}` : ''}/${args.league}`
    );
  }
// #endregion League Accounts (PoE1 only)

// #region Guild Stashes (PoE1 only)
  public async listGuildStashes(args: { league: string; realm?: string | null }): Promise<z.infer<(typeof serverApiPaths)["List Guild Stashes"]["responseType"]>> {
    
    return await this.request<z.infer<(typeof serverApiPaths)["List Guild Stashes"]['responseType']>>(
      serverApiPaths["List Guild Stashes"],
      `/guild${args.realm && args.realm !== 'pc' ? `/${args.realm}` : ''}/stash/${args.league}`
    );
  }
  public async getGuildStash(args: { league: string; stash_id: string; realm?: string | null; substash_id?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get Guild Stash"]["responseType"]>> {
    
    return await this.request<z.infer<(typeof serverApiPaths)["Get Guild Stash"]['responseType']>>(
      serverApiPaths["Get Guild Stash"],
      `/guild${args.realm && args.realm !== 'pc' ? `/${args.realm}` : ''}/stash/${args.league}/${args.stash_id}${args.substash_id ? `/${args.substash_id}` : ''}`
    );
  }
// #endregion Guild Stashes (PoE1 only)

// #region Public Stashes (PoE1 only)
  public async getPublicStashes(args: { realm?: string | null; id?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get Public Stashes"]["responseType"]>> {
    // Query Parameters: id
    const queryParams = new URLSearchParams();
    if (args.id !== undefined && args.id !== null) {
      queryParams.append("id", args.id as string);
    }
    return await this.request<z.infer<(typeof serverApiPaths)["Get Public Stashes"]['responseType']>>(
      serverApiPaths["Get Public Stashes"],
      `/public-stash-tabs${args.realm && args.realm !== 'pc' ? `/${args.realm}` : ''}` + `?` + queryParams.toString()
    );
  }
// #endregion Public Stashes (PoE1 only)

// #region Currency Exchange
  public async getExchangeMarkets(args: { realm?: string | null; id?: string | null }): Promise<z.infer<(typeof serverApiPaths)["Get Exchange Markets"]["responseType"]>> {
    
    return await this.request<z.infer<(typeof serverApiPaths)["Get Exchange Markets"]['responseType']>>(
      serverApiPaths["Get Exchange Markets"],
      `/currency-exchange${args.realm && args.realm !== 'pc' ? `/${args.realm}` : ''}${args.id ? `/${args.id}` : ''}`
    );
  }
// #endregion Currency Exchange

}

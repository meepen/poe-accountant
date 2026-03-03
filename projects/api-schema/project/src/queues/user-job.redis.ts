export const UserJobRedisMetadataTtlSeconds = 60 * 30;

export const userJobPrefix = "user:job:";

export function getUserJobCacheKey(userId: string, cacheKey: string): string {
  return `${userJobPrefix}${userId}:${cacheKey}`;
}

export function getUserJobCachePattern(userId: string): string {
  return `${userJobPrefix}${userId}:*`;
}

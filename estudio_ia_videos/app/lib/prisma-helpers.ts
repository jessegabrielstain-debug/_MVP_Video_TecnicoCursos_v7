/**
 * Prisma Helpers
 * 
 * Utility functions to help with Prisma type casting and JSON field handling.
 * Reduces the need for `as any` casts throughout the codebase.
 */

import { Prisma } from '@prisma/client';

/**
 * Cast a value to Prisma's InputJsonValue for JSON columns.
 * Use this instead of `as any` when inserting/updating JSON fields.
 * 
 * @example
 * await prisma.timeline.update({
 *   data: {
 *     settings: toJsonValue(settings),
 *     tracks: toJsonValue(tracks),
 *   }
 * })
 */
export function toJsonValue<T extends Record<string, unknown> | unknown[]>(
  value: T
): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

/**
 * Parse a Prisma JSON field to a specific type.
 * Use this when reading JSON fields from the database.
 * 
 * @example
 * const settings = fromJsonValue<TimelineSettings>(timeline.settings);
 */
export function fromJsonValue<T>(value: Prisma.JsonValue | null | undefined): T | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value as unknown as T;
}

/**
 * Parse a Prisma JSON field with a default value.
 * 
 * @example
 * const tracks = fromJsonValueWithDefault<Track[]>(timeline.tracks, []);
 */
export function fromJsonValueWithDefault<T>(
  value: Prisma.JsonValue | null | undefined, 
  defaultValue: T
): T {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return value as unknown as T;
}

/**
 * Safe JSON parse that returns null on error.
 */
export function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Check if a value is a valid JSON object (not null, not array).
 */
export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safely get a nested property from a JSON object.
 * 
 * @example
 * const tracksCount = getJsonProperty<number>(template.metadata, 'tracksCount', 0);
 */
export function getJsonProperty<T>(
  obj: Prisma.JsonValue | null | undefined,
  key: string,
  defaultValue: T
): T {
  if (!isJsonObject(obj)) {
    return defaultValue;
  }
  const value = (obj as Record<string, unknown>)[key];
  return (value as T) ?? defaultValue;
}

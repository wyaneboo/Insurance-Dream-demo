import { CrudResource } from './types';

/** Generic value coercion + fuzzy name-matching helpers shared by the resource tools. */

export function iso(value: unknown): string | undefined {
  return value instanceof Date ? value.toISOString() : undefined;
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function optionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function optionalRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function optionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === 'string');
}

export function optionalDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Unwraps a resource-nested data payload (e.g. `data.prospect`) when present. */
export function actionData(
  data: Record<string, unknown> | undefined,
  resource: CrudResource,
): Record<string, unknown> {
  const root = data ?? {};
  const nested = root[resource];
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return root;
}

export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/^sample:\s*/, '')
    .replace(/\b(the|prospect|pipeline|submission|case)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function pickSingleNameMatch(
  items: Array<{ id: string; name: string }>,
  query: string,
): string | undefined {
  const normalizedQuery = normalizeName(query);
  const exact = items.filter((item) => normalizeName(item.name) === normalizedQuery);
  if (exact.length === 1) return exact[0].id;
  const partial = items.filter((item) => normalizeName(item.name).includes(normalizedQuery));
  return partial.length === 1 ? partial[0].id : undefined;
}

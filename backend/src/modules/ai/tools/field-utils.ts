/**
 * Shared field-resolution plumbing. Each resource owns its own field
 * vocabulary (the `normalizeOne` mapper + `defaults` fallback); this only holds
 * the generic filter/dedupe logic so it lives in one place.
 */
export function resolveFields(
  rawFields: unknown,
  normalizeOne: (field: string) => string | undefined,
  defaults: () => string[],
): string[] {
  const raw = Array.isArray(rawFields)
    ? rawFields.filter((field): field is string => typeof field === 'string')
    : [];
  const normalized = raw
    .map((field) => normalizeOne(field))
    .filter((field): field is string => !!field);
  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique : defaults();
}

import vndbTagTranslationsRaw from "./vndbTagTranslations.zh-CN.json";

type TranslationMap = Record<string, string>;

const vndbTagTranslations = Object.fromEntries(
  Object.entries(vndbTagTranslationsRaw as Record<string, unknown>).filter(
    ([key, value]) => !key.startsWith("_") && typeof value === "string",
  ),
) as TranslationMap;

const normalizedTranslatedIndex = new Map<string, string[]>();

for (const [rawName, translatedName] of Object.entries(vndbTagTranslations)) {
  const normalized = normalizeTagSearchText(translatedName);
  if (!normalized || normalized === normalizeTagSearchText(rawName)) {
    continue;
  }
  const existing = normalizedTranslatedIndex.get(normalized) ?? [];
  existing.push(rawName);
  normalizedTranslatedIndex.set(normalized, existing);
}

export function getTagDisplayName(
  tagName: string,
  enableTranslation = true,
): string {
  if (!enableTranslation) {
    return tagName;
  }
  return vndbTagTranslations[tagName] ?? tagName;
}

export function getTagTitle(
  tagName: string,
  enableTranslation = true,
): string | undefined {
  const displayName = getTagDisplayName(tagName, enableTranslation);
  return displayName === tagName ? undefined : tagName;
}

export function findRawTagNamesByTranslatedQuery(query: string): string[] {
  const normalizedQuery = normalizeTagSearchText(query);
  if (!normalizedQuery) {
    return [];
  }

  const matches: string[] = [];
  for (const [translatedName, rawNames] of normalizedTranslatedIndex) {
    if (translatedName.includes(normalizedQuery)) {
      matches.push(...rawNames);
    }
  }

  return [...new Set(matches)];
}

export function filterTagNamesByDisplayQuery(
  tagNames: string[],
  query: string,
  enableTranslation = true,
): string[] {
  const normalizedQuery = normalizeTagSearchText(query);
  if (!normalizedQuery) {
    return tagNames;
  }

  return tagNames.filter((tagName) => {
    const rawName = normalizeTagSearchText(tagName);
    const displayName = normalizeTagSearchText(
      getTagDisplayName(tagName, enableTranslation),
    );
    return (
      rawName.includes(normalizedQuery) || displayName.includes(normalizedQuery)
    );
  });
}

export function normalizeTagSearchText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

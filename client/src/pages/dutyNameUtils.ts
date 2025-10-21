import {
  MASTERS_LIST,
  OFFICERS_LIST,
  RANK_DISPLAY_MAP
} from "@/data/officersData";

const KNOWN_RANK_PREFIXES = new Set(
  Object.keys(RANK_DISPLAY_MAP).map(rank => rank.toUpperCase())
);

const KNOWN_SPECIALTIES = new Set(
  [...OFFICERS_LIST, ...MASTERS_LIST]
    .map(person => person.specialty)
    .filter((specialty): specialty is string => Boolean(specialty))
    .map(specialty => specialty.toUpperCase())
);

const DUTY_NAME_PATTERN = /^([A-Z0-9]+)\s*(?:\(([^)]+)\))?\s+(.+)$/;

export const normalizeDutyNameValue = (value?: string | null): string => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const upper = trimmed.toUpperCase();
  const match = upper.match(DUTY_NAME_PATTERN);
  if (match) {
    const [, possibleRank, possibleSpecialty, remainder] = match;
    const isKnownRank = KNOWN_RANK_PREFIXES.has(possibleRank);
    const isKnownSpecialty = !possibleSpecialty || KNOWN_SPECIALTIES.has(possibleSpecialty);

    if (isKnownRank && isKnownSpecialty) {
      return remainder.trim();
    }
  }

  return upper;
};

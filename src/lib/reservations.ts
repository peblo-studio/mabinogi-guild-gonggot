import { ReservationType } from "@prisma/client";

export const RAID_CONTENT_OPTIONS = [
  { value: "tabartas_intro", label: "타바르타스 레이드 입문" },
  { value: "tabartas_hard", label: "타바르타스 레이드 어려움" },
  { value: "tabartas_very_hard", label: "타바르타스 레이드 매우어려움" },
  { value: "airel_hard", label: "에이렐 어려움" },
  { value: "glasgibnen_very_hard", label: "글라스기브넨 매우어려움" },
  { value: "white_succubus_hard", label: "화이트 서큐버스 어려움" },
  { value: "white_succubus_very_hard", label: "화이트 서큐버스 매우어려움" },
] as const;

export const ABYSS_CONTENT_OPTIONS = [{ value: "abyss_general", label: "어비스" }] as const;

export function getDefaultContentKey(type: ReservationType) {
  return type === "RAID" ? RAID_CONTENT_OPTIONS[0].value : ABYSS_CONTENT_OPTIONS[0].value;
}

export function isValidContentKey(type: ReservationType, key: string) {
  const options = type === "RAID" ? RAID_CONTENT_OPTIONS : ABYSS_CONTENT_OPTIONS;
  return options.some((option) => option.value === key);
}

export function getContentLabel(type: ReservationType, key: string) {
  const options = type === "RAID" ? RAID_CONTENT_OPTIONS : ABYSS_CONTENT_OPTIONS;
  return options.find((option) => option.value === key)?.label ?? key;
}

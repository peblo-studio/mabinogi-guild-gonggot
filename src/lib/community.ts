export type CommunityCategory = "NOTICE" | "GUIDE" | "GENERAL";

export const COMMUNITY_CATEGORY_OPTIONS: ReadonlyArray<{
  value: CommunityCategory;
  label: string;
  description: string;
}> = [
  { value: "NOTICE", label: "공지사항", description: "운영 공지 및 길드 안내" },
  { value: "GUIDE", label: "공략", description: "레이드/어비스 공략 공유" },
  { value: "GENERAL", label: "자유게시판", description: "자유롭게 소통" },
];

export function getCategoryLabel(category: CommunityCategory) {
  return COMMUNITY_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;
}

export function isCommunityCategory(value: string): value is CommunityCategory {
  return COMMUNITY_CATEGORY_OPTIONS.some((item) => item.value === value);
}

export function isAdminUsername(username: string) {
  const configured = process.env.ADMIN_USERNAMES ?? "";
  const list = configured
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) {
    return false;
  }
  return list.includes(username.toLowerCase());
}

export function canWriteCategory(username: string, category: CommunityCategory) {
  if (category !== "NOTICE") {
    return true;
  }
  return isAdminUsername(username);
}

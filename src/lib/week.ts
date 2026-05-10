const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

export function getDayLabel(dayOfWeek: number) {
  return DAY_LABELS[dayOfWeek - 1] ?? "-";
}

export function getCurrentWeekStartISO(baseDate = new Date()) {
  return dateToISO(getWeekStartDate(baseDate));
}

export function getWeekStartDate(baseDate: Date) {
  const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return date;
}

export function parseWeekStartISO(raw: string | undefined) {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return getCurrentWeekStartISO();
  }

  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return getCurrentWeekStartISO();
  }

  return dateToISO(getWeekStartDate(parsed));
}

export function addWeeksISO(weekStartISO: string, weeks: number) {
  const base = new Date(`${weekStartISO}T00:00:00`);
  base.setDate(base.getDate() + weeks * 7);
  return dateToISO(base);
}

export function getWeekRangeLabel(weekStartISO: string) {
  const start = new Date(`${weekStartISO}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const year = start.getFullYear();
  const startMonth = start.getMonth() + 1;
  const startDate = start.getDate();
  const endMonth = end.getMonth() + 1;
  const endDate = end.getDate();

  if (startMonth === endMonth) {
    return `${year}년 ${startMonth}월 ${startDate}일 - ${endDate}일`;
  }

  return `${year}년 ${startMonth}월 ${startDate}일 - ${endMonth}월 ${endDate}일`;
}

function dateToISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

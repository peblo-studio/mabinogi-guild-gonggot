import Link from "next/link";
import { ReservationType } from "@prisma/client";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  createReservationAction,
  deleteReservationAction,
  updateDisplayNameAction,
} from "@/app/reservations/actions";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ABYSS_CONTENT_OPTIONS,
  getContentLabel,
  getDefaultContentKey,
  RAID_CONTENT_OPTIONS,
} from "@/lib/reservations";
import {
  addWeeksISO,
  getCurrentWeekStartISO,
  getDayLabel,
  getWeekRangeLabel,
  parseWeekStartISO,
} from "@/lib/week";

type ReservationsPageProps = {
  searchParams?: Promise<{
    week?: string;
    message?: string;
    mine?: string;
    view?: string;
  }>;
};

type ReservationWithUser = {
  id: string;
  type: ReservationType;
  contentKey: string | null;
  dayOfWeek: number;
  timeSlot: string;
  note: string | null;
  userId: string;
  user: {
    displayName: string;
  };
};

const DAYS = [
  { value: 1, label: "월요일" },
  { value: 2, label: "화요일" },
  { value: 3, label: "수요일" },
  { value: 4, label: "목요일" },
  { value: 5, label: "금요일" },
  { value: 6, label: "토요일" },
  { value: 7, label: "일요일" },
] as const;

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const params = await searchParams;
  const weekStart = parseWeekStartISO(params?.week ?? getCurrentWeekStartISO());
  const mineOnly = params?.mine === "1";
  const view = params?.view === "RAID" || params?.view === "ABYSS" ? params.view : "ALL";
  const weekLabel = getWeekRangeLabel(weekStart);
  const prevWeek = addWeeksISO(weekStart, -1);
  const nextWeek = addWeeksISO(weekStart, 1);
  const sessionUser = await getSessionUser();

  const reservations = await Promise.race([
    prisma.reservation.findMany({
      where: { weekStart },
      orderBy: [{ type: "asc" }, { dayOfWeek: "asc" }, { timeSlot: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        type: true,
        contentKey: true,
        dayOfWeek: true,
        timeSlot: true,
        note: true,
        userId: true,
        user: {
          select: {
            displayName: true,
          },
        },
      },
    }),
    new Promise<ReservationWithUser[]>((resolve) => setTimeout(() => resolve([]), 1200)),
  ]);

  const filteredByMine =
    mineOnly && sessionUser ? reservations.filter((item) => item.userId === sessionUser.id) : reservations;

  const raidReservations = filteredByMine.filter((item) => item.type === "RAID");
  const abyssReservations = filteredByMine.filter((item) => item.type === "ABYSS");
  const summaryReservations = filteredByMine.filter((item) => {
    if (view === "RAID") return item.type === "RAID";
    if (view === "ABYSS") return item.type === "ABYSS";
    return true;
  });

  const buildFilterHref = (nextMine: boolean, nextView: "ALL" | "RAID" | "ABYSS") => {
    const search = new URLSearchParams({ week: weekStart });
    if (nextMine) {
      search.set("mine", "1");
    }
    if (nextView !== "ALL") {
      search.set("view", nextView);
    }
    return `/reservations?${search.toString()}`;
  };

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              주간 예약 게시판
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              주 단위(월~일)로 레이드와 어비스 예약을 등록할 수 있습니다.
            </p>
          </div>
          {sessionUser ? (
            <p className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">
              로그인: {sessionUser.displayName}
            </p>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              로그인
            </Link>
          )}
        </div>

        {sessionUser ? (
          <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-zinc-900">닉네임 설정</h2>
            <p className="mt-1 text-xs text-zinc-600">현재 닉네임: {sessionUser.displayName}</p>
            <form action={updateDisplayNameAction} className="mt-3 flex flex-wrap items-center gap-2">
              <input type="hidden" name="weekStart" value={weekStart} />
              <input
                type="text"
                name="displayName"
                defaultValue={sessionUser.displayName}
                minLength={2}
                maxLength={20}
                required
                className="w-56 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
              >
                닉네임 저장
              </button>
            </form>
          </section>
        ) : null}

        <div className="mt-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <Link href={`/reservations?week=${prevWeek}`} className="text-sm font-medium text-zinc-700">
            ← 이전 주
          </Link>
          <p className="text-sm font-semibold text-zinc-900">{weekLabel}</p>
          <Link href={`/reservations?week=${nextWeek}`} className="text-sm font-medium text-zinc-700">
            다음 주 →
          </Link>
        </div>

        {params?.message ? (
          <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            {params.message}
          </p>
        ) : null}

        {!sessionUser ? (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            예약 등록/삭제는 로그인 후 가능합니다. 목록은 누구나 볼 수 있어요.
          </p>
        ) : null}

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-900">필터</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href={buildFilterHref(mineOnly, "ALL")}
                className={`rounded-full px-3 py-1 ${
                  view === "ALL" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
                }`}
              >
                전체
              </Link>
              <Link
                href={buildFilterHref(mineOnly, "RAID")}
                className={`rounded-full px-3 py-1 ${
                  view === "RAID" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
                }`}
              >
                레이드
              </Link>
              <Link
                href={buildFilterHref(mineOnly, "ABYSS")}
                className={`rounded-full px-3 py-1 ${
                  view === "ABYSS" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
                }`}
              >
                어비스
              </Link>
              {sessionUser ? (
                <Link
                  href={buildFilterHref(!mineOnly, view)}
                  className={`rounded-full px-3 py-1 ${
                    mineOnly ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {mineOnly ? "내 예약만: ON" : "내 예약만: OFF"}
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ReservationSection
            title="레이드 예약"
            type="RAID"
            weekStart={weekStart}
          contentOptions={RAID_CONTENT_OPTIONS}
            reservations={raidReservations}
            currentUserId={sessionUser?.id ?? null}
          />
          <ReservationSection
            title="어비스 예약"
            type="ABYSS"
            weekStart={weekStart}
          contentOptions={ABYSS_CONTENT_OPTIONS}
            reservations={abyssReservations}
            currentUserId={sessionUser?.id ?? null}
          />
        </div>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">이번 주 전체 예약 현황</h2>
          <p className="mt-1 text-xs text-zinc-500">누가 몇 시에 예약했는지 한눈에 볼 수 있어요.</p>
          {summaryReservations.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">아직 등록된 예약이 없습니다.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {summaryReservations.map((item) => (
                <li key={item.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700">
                  <p className="font-medium text-zinc-900">
                    {item.type === "RAID" ? "레이드" : "어비스"} · {getDayLabel(item.dayOfWeek)} · {item.timeSlot}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    예약자: {item.user.displayName} ·{" "}
                    {getContentLabel(item.type, item.contentKey ?? getDefaultContentKey(item.type))}
                  </p>
                  {item.note ? <p className="mt-1 text-xs text-zinc-500">메모: {item.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function ReservationSection({
  title,
  type,
  weekStart,
  contentOptions,
  reservations,
  currentUserId,
}: {
  title: string;
  type: ReservationType;
  weekStart: string;
  contentOptions: readonly { value: string; label: string }[];
  reservations: ReservationWithUser[];
  currentUserId: string | null;
}) {
  const grouped = DAYS.map((day) => ({
    ...day,
    items: reservations.filter((item) => item.dayOfWeek === day.value),
  }));

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h2>

      {currentUserId ? (
        <form action={createReservationAction} className="mt-4 grid gap-2 rounded-xl bg-zinc-50 p-3">
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="weekStart" value={weekStart} />
          <select
            name="contentKey"
            defaultValue={getDefaultContentKey(type)}
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          >
            {contentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              name="dayOfWeek"
              defaultValue="1"
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            >
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            <input
              type="time"
              name="timeSlot"
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </div>
          <input
            type="text"
            name="note"
            placeholder="메모 (선택) - 파티명, 모집 정보 등"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            {title} 등록
          </button>
        </form>
      ) : null}

      <ul className="mt-4 space-y-2">
        {grouped.map((day) => (
          <li key={day.value} className="rounded-lg border border-zinc-200 p-3">
            <p className="text-sm font-semibold text-zinc-900">{getDayLabel(day.value)}</p>
            {day.items.length === 0 ? (
              <p className="mt-1 text-xs text-zinc-500">예약 없음</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {day.items.map((item) => (
                  <li key={item.id} className="rounded-md bg-zinc-50 px-2 py-2 text-xs text-zinc-700">
                    <div className="flex items-center justify-between gap-2">
                      <span>{item.timeSlot} · {item.user.displayName}</span>
                      {currentUserId === item.userId ? (
                        <form action={deleteReservationAction}>
                          <input type="hidden" name="reservationId" value={item.id} />
                          <input type="hidden" name="weekStart" value={weekStart} />
                          <button type="submit" className="text-zinc-500 underline-offset-2 hover:underline">
                            삭제
                          </button>
                        </form>
                      ) : null}
                    </div>
                    <p className="mt-1 text-zinc-500">
                      {getContentLabel(item.type, item.contentKey ?? getDefaultContentKey(item.type))}
                    </p>
                    {item.note ? <p className="mt-1 text-zinc-500">{item.note}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

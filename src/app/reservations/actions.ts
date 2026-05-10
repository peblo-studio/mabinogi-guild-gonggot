"use server";

import { Prisma, ReservationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultContentKey, isValidContentKey } from "@/lib/reservations";
import { parseWeekStartISO } from "@/lib/week";

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function buildRedirectURL(weekStart: string, message?: string) {
  const search = new URLSearchParams({ week: weekStart });
  if (message) {
    search.set("message", message);
  }
  return `/reservations?${search.toString()}`;
}

export async function createReservationAction(formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login?error=로그인 후 이용해 주세요.");
  }

  const typeRaw = normalizeText(formData.get("type"));
  const type = (typeRaw as ReservationType) || "RAID";
  const contentKey = normalizeText(formData.get("contentKey")) || getDefaultContentKey(type);
  const weekStart = parseWeekStartISO(normalizeText(formData.get("weekStart")));
  const dayOfWeek = Number(normalizeText(formData.get("dayOfWeek")));
  const timeSlot = normalizeText(formData.get("timeSlot"));
  const note = normalizeText(formData.get("note"));

  if (!["RAID", "ABYSS"].includes(typeRaw)) {
    redirect(buildRedirectURL(weekStart, "예약 종류가 올바르지 않습니다."));
  }

  if (!isValidContentKey(type, contentKey)) {
    redirect(buildRedirectURL(weekStart, "레이드/어비스 세부 항목이 올바르지 않습니다."));
  }

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    redirect(buildRedirectURL(weekStart, "요일은 월요일부터 일요일까지만 가능합니다."));
  }

  if (!/^\d{2}:\d{2}$/.test(timeSlot)) {
    redirect(buildRedirectURL(weekStart, "시간 형식은 HH:MM으로 입력해 주세요."));
  }

  try {
    await prisma.reservation.create({
      data: {
        type,
        contentKey,
        weekStart,
        dayOfWeek,
        timeSlot,
        note: note || null,
        userId: sessionUser.id,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(buildRedirectURL(weekStart, "같은 시간대 예약이 이미 있어요."));
    }
    throw error;
  }

  revalidatePath("/reservations");
  redirect(buildRedirectURL(weekStart, "예약이 등록되었습니다."));
}

export async function deleteReservationAction(formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login?error=로그인 후 이용해 주세요.");
  }

  const reservationId = normalizeText(formData.get("reservationId"));
  const weekStart = parseWeekStartISO(normalizeText(formData.get("weekStart")));

  if (!reservationId) {
    redirect(buildRedirectURL(weekStart, "삭제할 예약이 없습니다."));
  }

  await prisma.reservation.deleteMany({
    where: {
      id: reservationId,
      userId: sessionUser.id,
    },
  });

  revalidatePath("/reservations");
  redirect(buildRedirectURL(weekStart, "예약이 삭제되었습니다."));
}

export async function updateDisplayNameAction(formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login?error=로그인 후 이용해 주세요.");
  }

  const weekStart = parseWeekStartISO(normalizeText(formData.get("weekStart")));
  const displayName = normalizeText(formData.get("displayName"));

  if (displayName.length < 2 || displayName.length > 20) {
    redirect(buildRedirectURL(weekStart, "닉네임은 2~20자로 입력해 주세요."));
  }

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { displayName },
  });

  revalidatePath("/");
  revalidatePath("/login");
  revalidatePath("/reservations");
  redirect(buildRedirectURL(weekStart, "닉네임이 변경되었습니다."));
}

"use server";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { clearSession, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeUsername(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function redirectLoginError(message: string): never {
  const search = new URLSearchParams({ error: message });
  redirect(`/login?${search.toString()}`);
}

export async function loginAction(formData: FormData) {
  const username = normalizeUsername(formData.get("username"));
  const password = normalizeText(formData.get("password"));

  if (!username || !password) {
    redirectLoginError("아이디와 비밀번호를 입력해 주세요.");
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    redirectLoginError("계정을 찾을 수 없어요.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    redirectLoginError("비밀번호가 올바르지 않아요.");
  }

  try {
    await createSession(user.id);
  } catch {
    redirectLoginError("로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  }
  redirect("/reservations");
}

export async function registerAction(formData: FormData) {
  const username = normalizeUsername(formData.get("username"));
  const displayName = normalizeText(formData.get("displayName"));
  const password = normalizeText(formData.get("password"));

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    redirectLoginError("아이디는 영문 소문자/숫자/_ 3~20자로 입력해 주세요.");
  }

  if (displayName.length < 2 || displayName.length > 20) {
    redirectLoginError("표시 이름은 2~20자로 입력해 주세요.");
  }

  if (password.length < 6) {
    redirectLoginError("비밀번호는 최소 6자 이상이어야 합니다.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let userId: string;
  try {
    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        passwordHash,
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectLoginError("이미 사용 중인 아이디입니다.");
    }
    redirectLoginError("회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  }

  try {
    await createSession(userId);
  } catch {
    redirectLoginError("가입은 완료되었지만 자동 로그인에 실패했습니다. 다시 로그인해 주세요.");
  }
  redirect("/reservations");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

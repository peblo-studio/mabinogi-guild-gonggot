"use server";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
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

async function redirectLoginErrorCode(code: string): Promise<never> {
  const cookieStore = await cookies();
  cookieStore.set("login_notice", `error:${code}`, {
    path: "/login",
    maxAge: 30,
    sameSite: "lax",
  });
  redirect("/login");
}

async function redirectLoginSuccessCode(code: string): Promise<never> {
  const cookieStore = await cookies();
  cookieStore.set("login_notice", `success:${code}`, {
    path: "/login",
    maxAge: 30,
    sameSite: "lax",
  });
  redirect("/login");
}

export async function loginAction(formData: FormData) {
  const username = normalizeUsername(formData.get("username"));
  const password = normalizeText(formData.get("password"));

  if (!username || !password) {
    await redirectLoginErrorCode("missing_credentials");
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return await redirectLoginErrorCode("account_not_found");
  }
  if (!user.passwordHash) {
    return await redirectLoginErrorCode("login_failed");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return await redirectLoginErrorCode("invalid_password");
  }

  try {
    await createSession(user.id);
  } catch {
    return await redirectLoginErrorCode("login_failed");
  }
  redirect("/");
}

export async function registerAction(formData: FormData) {
  const username = normalizeUsername(formData.get("username"));
  const displayName = normalizeText(formData.get("displayName"));
  const password = normalizeText(formData.get("password"));

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    await redirectLoginErrorCode("invalid_username");
  }

  if (displayName.length < 2 || displayName.length > 20) {
    await redirectLoginErrorCode("invalid_display_name");
  }

  if (password.length < 6) {
    await redirectLoginErrorCode("invalid_password_length");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        username,
        displayName,
        passwordHash,
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      await redirectLoginErrorCode("duplicate_username");
    }
    await redirectLoginErrorCode("register_failed");
  }

  await redirectLoginSuccessCode("registered");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

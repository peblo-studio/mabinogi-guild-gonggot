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

function redirectLoginErrorCode(code: string): never {
  const search = new URLSearchParams({ e: code });
  redirect(`/login?${search.toString()}`);
}

function redirectLoginSuccessCode(code: string): never {
  const search = new URLSearchParams({ s: code });
  redirect(`/login?${search.toString()}`);
}

export async function loginAction(formData: FormData) {
  const username = normalizeUsername(formData.get("username"));
  const password = normalizeText(formData.get("password"));

  if (!username || !password) {
    redirectLoginErrorCode("missing_credentials");
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    redirectLoginErrorCode("account_not_found");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    redirectLoginErrorCode("invalid_password");
  }

  try {
    await createSession(user.id);
  } catch {
    redirectLoginErrorCode("login_failed");
  }
  redirect("/");
}

export async function registerAction(formData: FormData) {
  const username = normalizeUsername(formData.get("username"));
  const displayName = normalizeText(formData.get("displayName"));
  const password = normalizeText(formData.get("password"));

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    redirectLoginErrorCode("invalid_username");
  }

  if (displayName.length < 2 || displayName.length > 20) {
    redirectLoginErrorCode("invalid_display_name");
  }

  if (password.length < 6) {
    redirectLoginErrorCode("invalid_password_length");
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
      redirectLoginErrorCode("duplicate_username");
    }
    redirectLoginErrorCode("register_failed");
  }

  redirectLoginSuccessCode("registered");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
